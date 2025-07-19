from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import Optional

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
