"""SQLAlchemy database models."""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    password = Column(String(120), nullable=False)

    def to_dict(self):
        return {
            "id": self.id, 
            "username": self.username
        }

class UserData(Base):
    __tablename__ = "user_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    
    # Simple user preferences
    theme = Column(String(20), default="light")  # light, dark
    time_period = Column(String(20), default="today")  # Today, This Week, This Month, Upcoming
    show_undated = Column(Boolean, default=True)
    show_uncategorized = Column(Boolean, default=True)
    show_overdue = Column(Boolean, default=True)
    show_categories = Column(Text, default="[]")  # JSON array of category IDs to show
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User')
    
    def to_dict(self):
        import json
        return {
            "id": self.id,
            "user_id": self.user_id,
            "theme": self.theme,
            "time_period": self.time_period,
            "show_undated": self.show_undated,
            "show_uncategorized": self.show_uncategorized,
            "show_overdue": self.show_overdue,
            "show_categories": json.loads(getattr(self, 'show_categories', '[]') or "[]"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(10), nullable=True)  # Store emoji character
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
            "icon": self.icon,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Rule(Base):
    __tablename__ = 'rules'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)  # Now optional
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Add user_id for ownership
    rate_pattern = Column(String(200), nullable=False)  # New encoding system (e.g., "w#1M#1,2,3,4,5,6,7,8,9,10,11,12T#09:00")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User')
    category = relationship('Category', back_populates='rules')
    tasks = relationship('Task', back_populates='rule')
    events = relationship('Event', back_populates='rule')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "user_id": self.user_id,
            "rate_pattern": self.rate_pattern,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
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
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
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
