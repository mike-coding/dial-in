"""User routes."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import User

router = APIRouter()

@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "avatar": user.avatar or "🙂",
        "message": "User retrieved"
    }


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "username" in changes and isinstance(changes.get("username"), str):
        next_username = changes.get("username", "").strip()
        if not next_username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")

        existing_user = db.query(User).filter(User.username == next_username, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")

        user.username = next_username

    if "avatar" in changes:
        avatar_value = changes.get("avatar")
        user.avatar = avatar_value if isinstance(avatar_value, str) and avatar_value.strip() else "🙂"

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "avatar": user.avatar or "🙂",
        "message": "User updated"
    }
