"""Task routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import Task
from schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(user_id: int, db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    return [TaskResponse(**task.to_dict()) for task in tasks]

@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**task_data.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse(**task.to_dict())

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_data: TaskUpdate, user_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    db.commit()
    db.refresh(task)
    return TaskResponse(**task.to_dict())

@router.patch("/{task_id}/complete")
async def complete_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
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
    return TaskResponse(**task.to_dict())

@router.patch("/{task_id}/incomplete")
async def mark_task_incomplete(task_id: int, user_id: int, db: Session = Depends(get_db)):
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
    return TaskResponse(**task.to_dict())

@router.delete("/{task_id}")
async def delete_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
