"""Rule routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Rule
from schemas import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter()

@router.get("/", response_model=List[RuleResponse])
async def get_rules(user_id: int, db: Session = Depends(get_db)):
    rules = db.query(Rule).filter(Rule.category.has(user_id=user_id)).all()
    return [RuleResponse(**rule.to_dict()) for rule in rules]

@router.post("/", response_model=RuleResponse)
async def create_rule(rule_data: RuleCreate, db: Session = Depends(get_db)):
    rule = Rule(**rule_data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return RuleResponse(**rule.to_dict())

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(rule_id: int, rule_data: RuleUpdate, user_id: int, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.category.has(user_id=user_id)
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    return RuleResponse(**rule.to_dict())

@router.delete("/{rule_id}")
async def delete_rule(rule_id: int, user_id: int, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.category.has(user_id=user_id)
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted successfully"}
