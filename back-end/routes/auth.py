"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse
import bcrypt

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash the password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create new user
    user = User(
        username=user_data.username,
        password=hashed_password.decode('utf-8')
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        message="User registered successfully"
    )

@router.post("/login", response_model=UserResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user by username
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check password
    if not bcrypt.checkpw(user_data.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        message="Login successful"
    )

@router.post("/me", response_model=UserResponse)
async def validate_user(user_data: dict, db: Session = Depends(get_db)):
    """Validate that a stored user ID is still valid."""
    user_id = user_data.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required"
        )
    
    # Find user by ID
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        message="User validation successful"
    )

@router.post("/logout")
async def logout():
    """Logout current user."""
    return {"message": "Logged out successfully"}
