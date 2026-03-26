"""Category routes."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Category, Rule

router = APIRouter()

@router.get("/")
async def get_categories(user_id: int, db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    return [category.to_dict() for category in categories]

@router.post("/")
async def create_category(
    name: str = Body(...),
    user_id: int = Body(...),
    icon: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    category = Category(name=name, icon=icon, user_id=user_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category.to_dict()

@router.put("/{category_id}")
async def update_category(
    category_id: int,
    user_id: int,
    changes: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Update category fields from a changes dict in the request body."""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Apply updates from changes dict if present
    if 'name' in changes:
        category.name = changes.get('name')
    if 'icon' in changes:
        category.icon = changes.get('icon')

    db.commit()
    db.refresh(category)
    return category.to_dict()

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    assigned_rules_count = db.query(Rule).filter(
        Rule.user_id == user_id,
        Rule.category_id == category_id,
    ).count()

    if assigned_rules_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete project while rules are assigned to it",
        )
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
