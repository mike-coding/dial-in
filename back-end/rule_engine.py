"""Rule execution engine for generating tasks from active rules."""
from __future__ import annotations

from datetime import date, datetime, timedelta
import re
import threading
from typing import Dict, List, Optional, Set

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Rule, Task

FREQUENCY_PATTERN = re.compile(r"^(mw|d|w|m|y)#([^MT;]+)")
MONTH_FILTER_PATTERN = re.compile(r"M#([^T;]+)")
TIME_PATTERN = re.compile(r"T#(\d{2}:\d{2})")


def _date_to_weekday_code(target_date: date) -> int:
    return ((target_date.weekday() + 1) % 7) + 1


def _parse_time(value: Optional[str]) -> tuple[int, int]:
    if not value:
        return 0, 0
    hours_text, minutes_text = value.split(":", 1)
    hours = int(hours_text)
    minutes = int(minutes_text)
    return hours, minutes


def _is_last_weekday_of_month(target_date: date) -> bool:
    next_week = target_date + timedelta(days=7)
    return next_week.month != target_date.month


def _segment_matches_date(segment: Dict[str, object], target_date: date, anchor_date: date) -> bool:
    month_filter: List[int] = segment.get("month_filter", [])  # type: ignore[assignment]
    if month_filter and target_date.month not in month_filter:
        return False

    frequency = segment["frequency"]

    if frequency == "d":
        interval = int(segment["interval"])  # type: ignore[arg-type]
        if target_date < anchor_date:
            return False
        delta_days = (target_date - anchor_date).days
        return delta_days % interval == 0

    if frequency == "w":
        weekday_codes: List[int] = segment["weekday_codes"]  # type: ignore[assignment]
        return _date_to_weekday_code(target_date) in weekday_codes

    if frequency == "m":
        month_days: List[int] = segment["month_days"]  # type: ignore[assignment]
        return target_date.day in month_days

    if frequency == "mw":
        monthly_weekdays: List[Dict[str, object]] = segment["monthly_weekdays"]  # type: ignore[assignment]
        weekday_code = _date_to_weekday_code(target_date)
        occurrence = ((target_date.day - 1) // 7) + 1

        for entry in monthly_weekdays:
            if entry["weekday"] != weekday_code:
                continue

            occurrence_text = str(entry["occurrence"])

            if occurrence_text == "L":
                if _is_last_weekday_of_month(target_date):
                    return True
            elif occurrence_text.isdigit() and int(occurrence_text) == occurrence:
                return True

        return False

    if frequency == "y":
        yearly_dates: List[Dict[str, int]] = segment["yearly_dates"]  # type: ignore[assignment]
        for entry in yearly_dates:
            if target_date.month == entry["month"] and target_date.day == entry["day"]:
                return True
        return False

    return False


def _parse_segment(segment_pattern: str) -> Optional[Dict[str, object]]:
    trimmed_pattern = segment_pattern.strip()
    frequency_match = FREQUENCY_PATTERN.match(trimmed_pattern)
    if not frequency_match:
        return None

    frequency = frequency_match.group(1)
    raw_pattern = frequency_match.group(2)

    month_filter_match = MONTH_FILTER_PATTERN.search(trimmed_pattern)
    month_filter = []
    if month_filter_match:
        month_filter = [
            int(value)
            for value in month_filter_match.group(1).split(",")
            if value.isdigit() and 1 <= int(value) <= 12
        ]

    time_match = TIME_PATTERN.search(trimmed_pattern)
    due_time = time_match.group(1) if time_match else None

    segment: Dict[str, object] = {
        "frequency": frequency,
        "month_filter": month_filter,
        "due_time": due_time,
    }

    if frequency == "d":
        if not raw_pattern.isdigit() or int(raw_pattern) < 1:
            return None
        segment["interval"] = int(raw_pattern)

    if frequency == "w":
        weekday_codes = [int(value) for value in raw_pattern if value.isdigit() and 1 <= int(value) <= 7]
        if not weekday_codes:
            return None
        segment["weekday_codes"] = sorted(set(weekday_codes))

    if frequency == "m":
        month_days = [
            int(value)
            for value in raw_pattern.split(",")
            if value.isdigit() and 1 <= int(value) <= 31
        ]
        if not month_days:
            return None
        segment["month_days"] = sorted(set(month_days))

    if frequency == "mw":
        monthly_weekdays: List[Dict[str, object]] = []
        for entry in raw_pattern.split(","):
            occurrence_text, _, weekday_text = entry.partition("-")
            if occurrence_text not in {"1", "2", "3", "4", "L"}:
                continue
            if not weekday_text.isdigit() or not (1 <= int(weekday_text) <= 7):
                continue
            monthly_weekdays.append(
                {
                    "occurrence": occurrence_text,
                    "weekday": int(weekday_text),
                }
            )
        if not monthly_weekdays:
            return None
        segment["monthly_weekdays"] = monthly_weekdays

    if frequency == "y":
        yearly_dates: List[Dict[str, int]] = []
        for entry in raw_pattern.split(","):
            month_text, _, day_text = entry.partition("-")
            if not month_text.isdigit() or not day_text.isdigit():
                continue
            month = int(month_text)
            day = int(day_text)
            if not (1 <= month <= 12 and 1 <= day <= 31):
                continue
            yearly_dates.append({"month": month, "day": day})
        if not yearly_dates:
            return None
        segment["yearly_dates"] = yearly_dates

    return segment


def parse_rate_pattern(rate_pattern: str) -> List[Dict[str, object]]:
    segments: List[Dict[str, object]] = []
    for raw_segment in rate_pattern.split(";"):
        parsed = _parse_segment(raw_segment)
        if parsed:
            segments.append(parsed)
    return segments


def _build_due_datetimes_for_pattern(
    rate_pattern: str,
    anchor_date: date,
    start_date: date,
    end_date: date,
) -> Set[datetime]:
    if end_date < start_date:
        return set()

    due_datetimes: Set[datetime] = set()
    segments = parse_rate_pattern(rate_pattern)
    if not segments:
        return due_datetimes

    current_day = start_date
    while current_day <= end_date:
        for segment in segments:
            if not _segment_matches_date(segment, current_day, anchor_date):
                continue

            due_time_value = segment.get("due_time")
            hours, minutes = _parse_time(due_time_value if isinstance(due_time_value, str) else None)
            due_datetimes.add(
                datetime(
                    current_day.year,
                    current_day.month,
                    current_day.day,
                    hours,
                    minutes,
                )
            )

        current_day += timedelta(days=1)

    return due_datetimes


def _combine_task_datetime(task: Task) -> Optional[datetime]:
    due_date = getattr(task, "due_date", None)
    if isinstance(due_date, datetime):
        due_date_value = due_date.date()
    elif isinstance(due_date, date):
        due_date_value = due_date
    else:
        return None

    due_time = getattr(task, "due_time", None)
    hours, minutes = _parse_time(due_time if isinstance(due_time, str) else None)
    return datetime(due_date_value.year, due_date_value.month, due_date_value.day, hours, minutes)


def _date_part(value: datetime) -> date:
    return value.date()


def _time_part_string(value: datetime) -> Optional[str]:
    time_value = value.strftime("%H:%M")
    return time_value if time_value != "00:00" else None


def _schedule_preview_summary(delete_count: int, create_count: int) -> Dict[str, int]:
    return {
        "delete_count": max(0, delete_count),
        "create_count": max(0, create_count),
        "net_change": max(0, create_count) - max(0, delete_count),
    }


def preview_rule_schedule_change(
    db: Session,
    rule: Rule,
    next_rate_pattern: str,
    horizon_days: int = 30,
) -> Dict[str, object]:
    now_utc = datetime.utcnow()
    start_future = now_utc.date()
    start_future_dt = datetime.combine(start_future, datetime.min.time())
    end_future = start_future + timedelta(days=horizon_days)

    existing_tasks = db.query(Task).filter(Task.rule_id == rule.id, Task.user_id == rule.user_id).all()
    if len(existing_tasks) == 0:
        return {
            "has_child_tasks": False,
            "existing_child_tasks": 0,
            "previews": {
                "future_replace_preserve_completed": _schedule_preview_summary(0, 0),
                "all_replace": _schedule_preview_summary(0, 0),
                "additive_future": _schedule_preview_summary(0, 0),
            },
        }

    created_at_value = getattr(rule, "created_at", None)
    anchor_date = created_at_value.date() if isinstance(created_at_value, datetime) else start_future

    existing_due_dates = {
        due_datetime
        for task in existing_tasks
        for due_datetime in [_combine_task_datetime(task)]
        if due_datetime is not None
    }

    existing_future_incomplete = []
    for task in existing_tasks:
        due_date = _combine_task_datetime(task)
        is_completed = bool(getattr(task, "is_completed", False))
        if due_date is not None and due_date >= start_future_dt and not is_completed:
            existing_future_incomplete.append(task)

    expected_future = _build_due_datetimes_for_pattern(next_rate_pattern, anchor_date, start_future, end_future)
    kept_due_dates_for_future_replace = set()
    for task in existing_tasks:
        due_date = _combine_task_datetime(task)
        is_completed = bool(getattr(task, "is_completed", False))
        if due_date is not None and not (due_date >= start_future_dt and not is_completed):
            kept_due_dates_for_future_replace.add(due_date)
    future_replace_creates = len(expected_future - kept_due_dates_for_future_replace)
    future_replace_deletes = len(existing_future_incomplete)

    all_due_dates = [due_datetime for task in existing_tasks for due_datetime in [_combine_task_datetime(task)] if due_datetime is not None]
    all_start_date = min((due_date.date() for due_date in all_due_dates), default=anchor_date)
    expected_all = _build_due_datetimes_for_pattern(next_rate_pattern, anchor_date, all_start_date, end_future)
    all_replace_deletes = len(existing_tasks)
    all_replace_creates = len(expected_all)

    additive_creates = len(expected_future - existing_due_dates)

    return {
        "has_child_tasks": True,
        "existing_child_tasks": len(existing_tasks),
        "previews": {
            "future_replace_preserve_completed": _schedule_preview_summary(future_replace_deletes, future_replace_creates),
            "all_replace": _schedule_preview_summary(all_replace_deletes, all_replace_creates),
            "additive_future": _schedule_preview_summary(0, additive_creates),
        },
    }


def apply_rule_schedule_change(
    db: Session,
    rule: Rule,
    next_rate_pattern: str,
    mode: str,
    horizon_days: int = 30,
) -> Dict[str, int]:
    normalized_mode = (mode or "future_replace_preserve_completed").strip().lower()
    now_utc = datetime.utcnow()
    start_future = now_utc.date()
    start_future_dt = datetime.combine(start_future, datetime.min.time())
    end_future = start_future + timedelta(days=horizon_days)

    created_at_value = getattr(rule, "created_at", None)
    anchor_date = created_at_value.date() if isinstance(created_at_value, datetime) else start_future

    existing_tasks = db.query(Task).filter(Task.rule_id == rule.id, Task.user_id == rule.user_id).all()
    deleted_count = 0
    created_count = 0

    if normalized_mode == "future_replace_preserve_completed":
        deletable_tasks = []
        for task in existing_tasks:
            due_date = _combine_task_datetime(task)
            is_completed = bool(getattr(task, "is_completed", False))
            if due_date is not None and due_date >= start_future_dt and not is_completed:
                deletable_tasks.append(task)
        deletable_ids = [task.id for task in deletable_tasks if task.id is not None]
        deleted_count = len(deletable_ids)
        if deletable_ids:
            db.query(Task).filter(Task.id.in_(deletable_ids)).delete(synchronize_session=False)

        kept_due_dates = {
            due_datetime
            for task in existing_tasks
            if task.id not in set(deletable_ids)
            for due_datetime in [_combine_task_datetime(task)]
            if due_datetime is not None
        }
        expected_due_dates = _build_due_datetimes_for_pattern(next_rate_pattern, anchor_date, start_future, end_future)
        for due_datetime in sorted(expected_due_dates - kept_due_dates):
            db.add(
                Task(
                    title=str(getattr(rule, "name", "")),
                    description=getattr(rule, "description", None),
                    category_id=getattr(rule, "category_id", None),
                    rule_id=getattr(rule, "id"),
                    user_id=getattr(rule, "user_id"),
                    is_completed=False,
                    due_date=_date_part(due_datetime),
                    due_time=_time_part_string(due_datetime),
                )
            )
            created_count += 1

        return _schedule_preview_summary(deleted_count, created_count)

    if normalized_mode == "all_replace":
        deleted_count = len(existing_tasks)
        if deleted_count > 0:
            db.query(Task).filter(Task.rule_id == rule.id, Task.user_id == rule.user_id).delete(synchronize_session=False)

        all_due_dates = [due_datetime for task in existing_tasks for due_datetime in [_combine_task_datetime(task)] if due_datetime is not None]
        all_start_date = min((due_date.date() for due_date in all_due_dates), default=anchor_date)
        expected_due_dates = _build_due_datetimes_for_pattern(next_rate_pattern, anchor_date, all_start_date, end_future)

        for due_datetime in sorted(expected_due_dates):
            db.add(
                Task(
                    title=str(getattr(rule, "name", "")),
                    description=getattr(rule, "description", None),
                    category_id=getattr(rule, "category_id", None),
                    rule_id=getattr(rule, "id"),
                    user_id=getattr(rule, "user_id"),
                    is_completed=False,
                    due_date=_date_part(due_datetime),
                    due_time=_time_part_string(due_datetime),
                )
            )
            created_count += 1

        return _schedule_preview_summary(deleted_count, created_count)

    expected_due_dates = _build_due_datetimes_for_pattern(next_rate_pattern, anchor_date, start_future, end_future)
    existing_due_dates = {
        due_datetime
        for task in existing_tasks
        for due_datetime in [_combine_task_datetime(task)]
        if due_datetime is not None
    }

    for due_datetime in sorted(expected_due_dates - existing_due_dates):
        db.add(
            Task(
                title=str(getattr(rule, "name", "")),
                description=getattr(rule, "description", None),
                category_id=getattr(rule, "category_id", None),
                rule_id=getattr(rule, "id"),
                user_id=getattr(rule, "user_id"),
                is_completed=False,
                due_date=_date_part(due_datetime),
                due_time=_time_part_string(due_datetime),
            )
        )
        created_count += 1

    return _schedule_preview_summary(0, created_count)


def run_rule_generation(
    db: Session,
    start_date: date,
    end_date: date,
    user_id: Optional[int] = None,
) -> Dict[str, int]:
    if end_date < start_date:
        return {"rules_checked": 0, "tasks_created": 0}

    query = db.query(Rule).filter(Rule.is_active == True)
    if user_id is not None:
        query = query.filter(Rule.user_id == user_id)
    active_rules = query.all()
    tasks_created = 0

    for rule in active_rules:
        rate_pattern = str(getattr(rule, "rate_pattern", "") or "")
        segments = parse_rate_pattern(rate_pattern)
        if not segments:
            continue

        existing_tasks = (
            db.query(Task)
            .filter(
                Task.rule_id == rule.id,
                func.date(Task.due_date) >= start_date.isoformat(),
                func.date(Task.due_date) <= end_date.isoformat(),
            )
            .all()
        )

        existing_due_dates = {
            due_datetime
            for task in existing_tasks
            for due_datetime in [_combine_task_datetime(task)]
            if due_datetime is not None
        }

        created_at_value = getattr(rule, "created_at", None)
        anchor_date = created_at_value.date() if isinstance(created_at_value, datetime) else start_date
        current_day = start_date

        while current_day <= end_date:
            for segment in segments:
                if not _segment_matches_date(segment, current_day, anchor_date):
                    continue

                due_time_value = segment.get("due_time")
                hours, minutes = _parse_time(due_time_value if isinstance(due_time_value, str) else None)
                due_datetime = datetime(
                    current_day.year,
                    current_day.month,
                    current_day.day,
                    hours,
                    minutes,
                )

                if due_datetime in existing_due_dates:
                    continue

                generated_task = Task(
                    title=str(getattr(rule, "name", "")),
                    description=getattr(rule, "description", None),
                    category_id=getattr(rule, "category_id", None),
                    rule_id=getattr(rule, "id"),
                    user_id=getattr(rule, "user_id"),
                    is_completed=False,
                    due_date=_date_part(due_datetime),
                    due_time=_time_part_string(due_datetime),
                )
                db.add(generated_task)
                existing_due_dates.add(due_datetime)
                tasks_created += 1

            current_day += timedelta(days=1)

    if tasks_created > 0:
        db.commit()

    return {
        "rules_checked": len(active_rules),
        "tasks_created": tasks_created,
    }


class RuleScheduler:
    def __init__(self, interval_seconds: int = 60, horizon_days: int = 30):
        self.interval_seconds = interval_seconds
        self.horizon_days = horizon_days
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="rule-scheduler", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            db = SessionLocal()
            try:
                start_date = datetime.utcnow().date()
                end_date = start_date + timedelta(days=self.horizon_days)
                run_rule_generation(db, start_date, end_date)
            except Exception as exc:
                print(f"Rule scheduler error: {exc}")
                db.rollback()
            finally:
                db.close()

            self._stop_event.wait(self.interval_seconds)
