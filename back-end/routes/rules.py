"""Rule routes."""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models import Rule, Task, Category
from rule_engine import run_rule_generation, preview_rule_schedule_change, apply_rule_schedule_change
from route_utils import normalize_icon

router = APIRouter()

ALLOWED_SCHEDULE_UPDATE_MODES = {
    "future_replace_preserve_completed",
    "all_replace",
    "additive_future",
}

@router.get("/")
async def get_rules(user_id: int, db: Session = Depends(get_db)):
    rules = db.query(Rule).filter(Rule.user_id == user_id).all()
    return [rule.to_dict() for rule in rules]

@router.post("/")
async def create_rule(
    name: str = Body(...),
    rate_pattern: str = Body(...),
    user_id: int = Body(...),
    icon: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    category_id: int = Body(...),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id,
    ).first()
    if not category:
        raise HTTPException(status_code=400, detail="Project is required")

    rule = Rule(
        name=name,
        icon=normalize_icon(icon),
        description=description,
        category_id=category_id,
        user_id=user_id,
        rate_pattern=rate_pattern
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    start_date = datetime.utcnow().date()
    end_date = start_date + timedelta(days=30)
    run_rule_generation(db, start_date, end_date, user_id=user_id)

    return rule.to_dict()

@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db)
):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.user_id == user_id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    category_changed = 'category_id' in changes
    raw_category_id = changes.get('category_id') if category_changed else None
    next_category_id = raw_category_id if isinstance(raw_category_id, int) else None

    if category_changed:
        if next_category_id is None:
            raise HTTPException(status_code=400, detail="Project is required")

        category = db.query(Category).filter(
            Category.id == next_category_id,
            Category.user_id == user_id,
        ).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid project")

    raw_rate_pattern = changes.get('rate_pattern')
    next_rate_pattern = raw_rate_pattern if isinstance(raw_rate_pattern, str) else None
    schedule_changed = isinstance(next_rate_pattern, str) and next_rate_pattern != (rule.rate_pattern or "")
    schedule_update_mode = str(changes.get('schedule_update_mode') or 'future_replace_preserve_completed').strip().lower()

    if schedule_update_mode not in ALLOWED_SCHEDULE_UPDATE_MODES:
        raise HTTPException(status_code=400, detail="Invalid schedule update mode")

    if 'name' in changes and isinstance(changes.get('name'), str):
        next_name = changes.get('name', '').strip()
        if next_name:
            rule.name = next_name

    if 'icon' in changes:
        setattr(rule, 'icon', normalize_icon(changes.get('icon')))

    if 'description' in changes:
        raw_description = changes.get('description')
        setattr(rule, 'description', raw_description if isinstance(raw_description, str) and raw_description.strip() else None)

    if category_changed:
        setattr(rule, 'category_id', next_category_id)

    if schedule_changed:
        if isinstance(next_rate_pattern, str):
            setattr(rule, 'rate_pattern', next_rate_pattern)
    elif 'rate_pattern' in changes and not schedule_changed:
        if isinstance(raw_rate_pattern, str) and raw_rate_pattern.strip():
            setattr(rule, 'rate_pattern', raw_rate_pattern)

    if 'is_active' in changes and isinstance(changes.get('is_active'), bool):
        setattr(rule, 'is_active', bool(changes.get('is_active')))

    if category_changed:
        db.query(Task).filter(
            Task.rule_id == rule.id,
            Task.user_id == user_id,
        ).update({"category_id": next_category_id}, synchronize_session=False)

    schedule_result = None
    if schedule_changed:
        effective_rate_pattern = next_rate_pattern if isinstance(next_rate_pattern, str) else str(getattr(rule, 'rate_pattern', '') or '')
        schedule_result = apply_rule_schedule_change(
            db=db,
            rule=rule,
            next_rate_pattern=effective_rate_pattern,
            mode=schedule_update_mode,
            horizon_days=30,
        )

    db.commit()
    db.refresh(rule)

    if not schedule_changed:
        start_date = datetime.utcnow().date()
        end_date = start_date + timedelta(days=30)
        run_rule_generation(db, start_date, end_date, user_id=user_id)

    response = rule.to_dict()
    if schedule_result is not None:
        response["schedule_update"] = {
            "mode": schedule_update_mode,
            **schedule_result,
        }
    return response


@router.post("/{rule_id}/schedule-preview")
async def preview_schedule_update(
    rule_id: int,
    user_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.user_id == user_id,
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    next_rate_pattern = payload.get("rate_pattern")
    if not isinstance(next_rate_pattern, str) or not next_rate_pattern.strip():
        raise HTTPException(status_code=400, detail="rate_pattern is required")

    preview = preview_rule_schedule_change(
        db=db,
        rule=rule,
        next_rate_pattern=next_rate_pattern,
        horizon_days=30,
    )
    preview["schedule_changed"] = next_rate_pattern != (rule.rate_pattern or "")
    return preview

@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int,
    user_id: int,
    delete_children: Optional[bool] = Query(None),
    delete_children_body: Optional[bool] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.user_id == user_id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    should_delete_children = delete_children if delete_children is not None else bool(delete_children_body)

    if should_delete_children:
        db.query(Task).filter(Task.rule_id == rule.id).delete()
    else:
        db.query(Task).filter(Task.rule_id == rule.id).update({"rule_id": None})

    db.delete(rule)
    db.commit()
    return {
        "message": "Rule deleted successfully",
        "delete_children": should_delete_children,
    }


@router.post("/run")
async def run_rules(
    days_ahead: int = Body(30),
    db: Session = Depends(get_db),
):
    horizon = max(0, min(days_ahead, 90))
    start_date = datetime.utcnow().date()
    end_date = start_date + timedelta(days=horizon)
    return run_rule_generation(db, start_date, end_date)
