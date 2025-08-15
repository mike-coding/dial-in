"""Pydantic models for request/response schemas."""
from pydantic import BaseModel
from typing import Optional

# User models
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    message: str

    class Config:
        from_attributes = True

# Category models
class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    user_id: int

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str]
    user_id: int
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Rule models
class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None  # Now optional
    user_id: int  # Add user_id
    rate_pattern: str  # New encoding system (e.g., "w#1M#1,2,3,4,5,6,7,8,9,10,11,12T#09:00")

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    rate_pattern: Optional[str] = None
    is_active: Optional[bool] = None

class RuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category_id: Optional[int]  # Now optional
    user_id: int  # Add user_id
    rate_pattern: str
    is_active: bool
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Task models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None  # Allow null category
    rule_id: Optional[int] = None
    is_completed: Optional[bool] = False  # Add this field
    due_date: Optional[str] = None
    user_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    is_completed: Optional[bool] = None
    completed_at: Optional[str] = None  # Add this field
    due_date: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category_id: Optional[int]  # Allow null category
    rule_id: Optional[int]
    user_id: int
    is_completed: bool
    due_date: Optional[str]
    created_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True

# Event models
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None  # Allow null category
    rule_id: Optional[int] = None
    start_time: str
    end_time: Optional[str] = None
    user_id: int

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_time: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category_id: Optional[int]  # Allow null category
    rule_id: Optional[int]
    user_id: int
    start_time: str
    end_time: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True

# UserData models
class UserDataCreate(BaseModel):
    user_id: int
    theme: Optional[str] = "light"
    time_period: Optional[str] = "today"
    show_undated: Optional[bool] = True
    show_uncategorized: Optional[bool] = True
    show_overdue: Optional[bool] = True
    show_categories: Optional[list[int]] = []

class UserDataUpdate(BaseModel):
    theme: Optional[str] = None
    time_period: Optional[str] = None
    show_undated: Optional[bool] = None
    show_uncategorized: Optional[bool] = None
    show_overdue: Optional[bool] = None
    show_categories: Optional[list[int]] = None

class UserDataResponse(BaseModel):
    id: int
    user_id: int
    theme: str
    time_period: str
    show_undated: bool
    show_uncategorized: bool
    show_overdue: bool
    show_categories: list[int]
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True
