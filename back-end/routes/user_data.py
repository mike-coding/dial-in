"""User data routes for managing user preferences and settings."""
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import update
from database import get_db
from models import UserData
from datetime import datetime
from typing import Optional, List
import json

router = APIRouter()

@router.get("/{user_id}")
def get_user_data(user_id: int, db: Session = Depends(get_db)):
    """Get user data/preferences for a specific user."""
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    if not user_data:
        # Create default user_data if it doesn't exist
        user_data = UserData(
            user_id=user_id,
            theme="light",
            time_period="today",
            show_undated=True,
            show_uncategorized=True,
            show_overdue=True,
            show_categories="[]"
        )
        db.add(user_data)
        db.commit()
        db.refresh(user_data)
    
    return user_data.to_dict()

@router.post("/")
def create_user_data(
    user_id: int = Body(...),
    theme: Optional[str] = Body("light"),
    time_period: Optional[str] = Body("today"),
    show_undated: Optional[bool] = Body(True),
    show_uncategorized: Optional[bool] = Body(True),
    show_overdue: Optional[bool] = Body(True),
    show_categories: Optional[List[int]] = Body(None),
    db: Session = Depends(get_db)
):
    """Create new user data/preferences."""
    # Check if user_data already exists for this user
    existing = db.query(UserData).filter(UserData.user_id == user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User data already exists for this user")
    
    if show_categories is None:
        show_categories = []
    
    db_user_data = UserData(
        user_id=user_id,
        theme=theme,
        time_period=time_period,
        show_undated=show_undated,
        show_uncategorized=show_uncategorized,
        show_overdue=show_overdue,
        show_categories=json.dumps(show_categories)
    )
    db.add(db_user_data)
    db.commit()
    db.refresh(db_user_data)
    return db_user_data.to_dict()

@router.put("/{user_id}")
def update_user_data(
    user_id: int,
    theme: Optional[str] = Body(None),
    time_period: Optional[str] = Body(None),
    show_undated: Optional[bool] = Body(None),
    show_uncategorized: Optional[bool] = Body(None),
    show_overdue: Optional[bool] = Body(None),
    show_categories: Optional[List[int]] = Body(None),
    db: Session = Depends(get_db)
):
    """Update user data/preferences for a specific user."""
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User data not found")
    
    if theme is not None:
        user_data.theme = theme
    if time_period is not None:
        user_data.time_period = time_period
    if show_undated is not None:
        user_data.show_undated = show_undated
    if show_uncategorized is not None:
        user_data.show_uncategorized = show_uncategorized
    if show_overdue is not None:
        user_data.show_overdue = show_overdue
    if show_categories is not None:
        user_data.show_categories = json.dumps(show_categories)
    
    user_data.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user_data)
    
    return user_data.to_dict()

@router.delete("/{user_id}")
def delete_user_data(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete user data/preferences for a specific user."""
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User data not found")
    
    db.delete(user_data)
    db.commit()
    return {"message": "User data deleted successfully"}
