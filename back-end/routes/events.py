"""Event routes."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from database import get_db
from models import Event

router = APIRouter()

@router.get("/")
async def get_events(user_id: int, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.user_id == user_id).all()
    return [event.to_dict() for event in events]

@router.post("/")
async def create_event(
    title: str = Body(...),
    start_time: str = Body(...),
    user_id: int = Body(...),
    description: Optional[str] = Body(None),
    category_id: Optional[int] = Body(None),
    rule_id: Optional[int] = Body(None),
    end_time: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    event = Event(
        title=title,
        description=description,
        category_id=category_id,
        rule_id=rule_id,
        user_id=user_id,
        start_time=datetime.fromisoformat(start_time.replace('Z', '+00:00')),
        end_time=datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.to_dict()

@router.put("/{event_id}")
async def update_event(
    event_id: int,
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if 'title' in changes:
        event.title = changes.get('title')
    if 'description' in changes:
        event.description = changes.get('description')
    if 'end_time' in changes and changes.get('end_time') is not None:
        event.end_time = datetime.fromisoformat(changes.get('end_time').replace('Z', '+00:00'))

    db.commit()
    db.refresh(event)
    return event.to_dict()

@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
