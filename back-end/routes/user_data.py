"""User data routes for managing user preferences and settings."""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import update
from database import get_db
from models import UserData
from schemas import UserDataCreate, UserDataUpdate, UserDataResponse
from datetime import datetime

router = APIRouter()

@router.get("/{user_id}", response_model=UserDataResponse)
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
            show_overdue=True
        )
        db.add(user_data)
        db.commit()
        db.refresh(user_data)
    
    return UserDataResponse(**user_data.to_dict())

@router.post("/", response_model=UserDataResponse)
def create_user_data(user_data: UserDataCreate, db: Session = Depends(get_db)):
    """Create new user data/preferences."""
    # Check if user_data already exists for this user
    existing = db.query(UserData).filter(UserData.user_id == user_data.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User data already exists for this user")
    
    db_user_data = UserData(**user_data.dict())
    db.add(db_user_data)
    db.commit()
    db.refresh(db_user_data)
    return UserDataResponse(**db_user_data.to_dict())

@router.put("/{user_id}", response_model=UserDataResponse)
def update_user_data(user_id: int, user_data_update: UserDataUpdate, db: Session = Depends(get_db)):
    """Update user data/preferences for a specific user."""
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User data not found")
    
    # Update only provided fields
    update_data = user_data_update.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        db.execute(
            update(UserData)
            .where(UserData.user_id == user_id)
            .values(**update_data)
        )
        db.commit()
        db.refresh(user_data)
    
    return UserDataResponse(**user_data.to_dict())

@router.delete("/{user_id}")
def delete_user_data(user_id: int, db: Session = Depends(get_db)):
    """Delete user data/preferences for a specific user."""
    user_data = db.query(UserData).filter(UserData.user_id == user_id).first()
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User data not found")
    
    db.delete(user_data)
    db.commit()
    return {"message": "User data deleted successfully"}
