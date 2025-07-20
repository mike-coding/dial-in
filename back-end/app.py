from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./instance/data.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Pydantic Models (Request/Response schemas)
# ---------------------------
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    data: Optional[dict] = {}

    class Config:
        from_attributes = True

# Category models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    user_id: int
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Rule models
class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    rate_pattern: str  # New encoding system (e.g., "w#1M#1,2,3,4,5,6,7,8,9,10,11,12T#09:00")

class RuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category_id: int
    rate_pattern: str
    is_active: bool
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Task models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: int
    rule_id: Optional[int] = None
    due_date: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category_id: int
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
    category_id: int
    rule_id: Optional[int] = None
    start_time: str
    end_time: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_time: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category_id: int
    rule_id: Optional[int]
    user_id: int
    start_time: str
    end_time: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True

# ---------------------------
# SQLAlchemy Models
# ---------------------------
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    password = Column(String(120), nullable=False)
    
    # One-to-one relationship with UserData
    data = relationship('UserData', back_populates='user', uselist=False)

    def to_dict(self):
        return {"id": self.id, "username": self.username}

class UserData(Base):
    __tablename__ = 'user_data'
    
    # Use the same primary key as the User id
    id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    completed_tutorial = Column(Boolean, default=False)
    
    # Back reference to user
    user = relationship('User', back_populates='data')

    def to_dict(self):
        return {
            "completed_tutorial": self.completed_tutorial
        }

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User')
    rules = relationship('Rule', back_populates='category')
    tasks = relationship('Task', back_populates='category')
    events = relationship('Event', back_populates='category')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Rule(Base):
    __tablename__ = 'rules'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    rate_pattern = Column(String(200), nullable=False)  # New encoding system (e.g., "w#1M#1,2,3,4,5,6,7,8,9,10,11,12T#09:00")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship('Category', back_populates='rules')
    tasks = relationship('Task', back_populates='rule')
    events = relationship('Event', back_populates='rule')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "rate_pattern": self.rate_pattern,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    rule_id = Column(Integer, ForeignKey('rules.id'), nullable=True)  # Optional rule assignment
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User')
    category = relationship('Category', back_populates='tasks')
    rule = relationship('Rule', back_populates='tasks')
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category_id": self.category_id,
            "rule_id": self.rule_id,
            "user_id": self.user_id,
            "is_completed": self.is_completed,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

class Event(Base):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    rule_id = Column(Integer, ForeignKey('rules.id'), nullable=True)  # Optional rule assignment
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User')
    category = relationship('Category', back_populates='events')
    rule = relationship('Rule', back_populates='events')
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category_id": self.category_id,
            "rule_id": self.rule_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# Create tables
Base.metadata.create_all(bind=engine)

# ---------------------------
# Routes
# ---------------------------
@app.get("/")
def index():
    return {"message": "FastAPI is running."}

# Registration endpoint (now returns complete user data)
@app.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create new user
    new_user = User(username=user_data.username, password=user_data.password)
    db.add(new_user)
    db.flush()  # Get new_user.id without committing yet

    # Create associated UserData for this new user
    new_user_data = UserData(id=new_user.id, completed_tutorial=False)
    db.add(new_user_data)
    db.commit()
    db.refresh(new_user)

    # Return full user data including UserData
    result = new_user.to_dict()
    result["data"] = new_user.data.to_dict() if new_user.data else {}
    return result

# Login endpoint (now returns complete user data)
@app.post("/login", response_model=UserResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.password != user_data.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Return full user data including UserData
    result = user.to_dict()
    result["data"] = user.data.to_dict() if user.data else {}
    return result

# Endpoint to get a user's full data (user + userdata)
@app.get("/userdata/{user_id}", response_model=UserResponse)
def get_userdata(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.data:
        raise HTTPException(status_code=404, detail="UserData not found")

    result = user.to_dict()
    result['data'] = user.data.to_dict()
    return result

@app.put("/userdata/{user_id}")
def update_userdata(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.data:
        raise HTTPException(status_code=404, detail="UserData not found")

    # Note: You may want to add request body handling here for updating specific fields
    # For now, just returning the current data
    db.commit()
    updated_data = user.data.to_dict()
    return updated_data

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)
