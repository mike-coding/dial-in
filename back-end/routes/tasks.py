"""Task routes."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
from models import Task
from route_utils import normalize_color, normalize_icon

router = APIRouter()

def parse_date_only(value: Optional[str]):
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    return parsed.date()

def parse_time_only(value: Optional[str], fallback_datetime: Optional[str] = None):
    if isinstance(value, str) and value.strip():
        parsed = value.strip()
        if len(parsed) >= 5:
            return parsed[:5]
        return parsed

    if fallback_datetime and "T" in fallback_datetime:
        parsed = datetime.fromisoformat(fallback_datetime.replace('Z', '+00:00'))
        fallback = parsed.strftime("%H:%M")
        return fallback if fallback != "00:00" else None

    return None

@router.get("/")
async def get_tasks(user_id: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    return [task.to_dict() for task in tasks]

@router.post("/")
async def create_task(
    title: str = Body(...),
    user_id: int = Body(...),
    icon: Optional[str] = Body(None),
    color: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    category_id: Optional[int] = Body(None),
    is_completed: Optional[bool] = Body(False),
    due_date: Optional[str] = Body(None),
    due_time: Optional[str] = Body(None),
    end_date: Optional[str] = Body(None),
    end_time: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    parsed_due_date = parse_date_only(due_date)
    parsed_end_date = parse_date_only(end_date)
    task = Task(
        title=title,
        icon=normalize_icon(icon),
        color=normalize_color(color),
        description=description,
        category_id=category_id,
        user_id=user_id,
        is_completed=is_completed,
        due_date=parsed_due_date,
        due_time=parse_time_only(due_time, due_date) if parsed_due_date else None,
        end_date=parsed_end_date,
        end_time=parse_time_only(end_time, end_date) if parsed_end_date else None
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task.to_dict()

@router.put("/{task_id}")
async def update_task(
    task_id: int,
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db)
):
    if 'rule_id' in changes:
        raise HTTPException(
            status_code=400,
            detail="rule_id cannot be set through manual task updates"
        )

    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if 'title' in changes:
        task.title = changes.get('title')
    if 'icon' in changes:
        task.icon = normalize_icon(changes.get('icon'))
    if 'color' in changes:
        task.color = normalize_color(changes.get('color'))
    if 'description' in changes:
        task.description = changes.get('description')
    if 'category_id' in changes:
        task.category_id = changes.get('category_id')
    if 'is_completed' in changes:
        task.is_completed = changes.get('is_completed')
    if 'completed_at' in changes and changes.get('completed_at') is not None:
        task.completed_at = datetime.fromisoformat(changes.get('completed_at').replace('Z', '+00:00'))
    if 'due_date' in changes:
        val = changes.get('due_date')
        task.due_date = parse_date_only(val)
        if not val:
            task.due_time = None
        elif 'due_time' not in changes:
            task.due_time = parse_time_only(None, val)
    if 'due_time' in changes:
        task.due_time = parse_time_only(changes.get('due_time')) if task.due_date else None
    if 'end_date' in changes:
        val = changes.get('end_date')
        task.end_date = parse_date_only(val)
        if not val:
            task.end_time = None
        elif 'end_time' not in changes:
            task.end_time = parse_time_only(None, val)
    if 'end_time' in changes:
        task.end_time = parse_time_only(changes.get('end_time')) if task.end_date else None

    db.commit()
    db.refresh(task)
    return task.to_dict()

@router.patch("/{task_id}/complete")
async def complete_task(
    task_id: int,
    user_id: int = Body(...),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = True
    task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    return task.to_dict()

@router.patch("/{task_id}/incomplete")
async def mark_task_incomplete(
    task_id: int,
    user_id: int = Body(...),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_completed = False
    task.completed_at = None
    
    db.commit()
    db.refresh(task)
    return task.to_dict()

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
