"""Event routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Event
from schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter()

@router.get("/", response_model=List[EventResponse])
async def get_events(user_id: int, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.user_id == user_id).all()
    return [EventResponse(**event.to_dict()) for event in events]

@router.post("/", response_model=EventResponse)
async def create_event(event_data: EventCreate, db: Session = Depends(get_db)):
    event = Event(**event_data.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventResponse(**event.to_dict())

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: int, event_data: EventUpdate, user_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    return EventResponse(**event.to_dict())

@router.delete("/{event_id}")
async def delete_event(event_id: int, user_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
