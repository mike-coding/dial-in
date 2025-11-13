"""Rule routes."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Rule

router = APIRouter()

@router.get("/")
async def get_rules(user_id: int, db: Session = Depends(get_db)):
    rules = db.query(Rule).filter(Rule.user_id == user_id).all()
    return [rule.to_dict() for rule in rules]

@router.post("/")
async def create_rule(
    name: str = Body(...),
    rate_pattern: str = Body(...),
    user_id: int = Body(...),
    description: Optional[str] = Body(None),
    category_id: Optional[int] = Body(None),
    db: Session = Depends(get_db)
):
    rule = Rule(
        name=name,
        description=description,
        category_id=category_id,
        user_id=user_id,
        rate_pattern=rate_pattern
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule.to_dict()

@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db)
):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.user_id == user_id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    if 'name' in changes:
        rule.name = changes.get('name')
    if 'description' in changes:
        rule.description = changes.get('description')
    if 'category_id' in changes:
        rule.category_id = changes.get('category_id')
    if 'rate_pattern' in changes:
        rule.rate_pattern = changes.get('rate_pattern')
    if 'is_active' in changes:
        rule.is_active = changes.get('is_active')

    db.commit()
    db.refresh(rule)
    return rule.to_dict()

@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.user_id == user_id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted successfully"}
