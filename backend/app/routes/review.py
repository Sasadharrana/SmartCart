from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.review import Review
from app.models.product import Product
from app.schemas.review import ReviewCreate, ReviewOut
from app.utils.dependencies import buyer_only

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# ================= ADD REVIEW =================
@router.post("/{product_id}", response_model=ReviewOut)
def add_review(
    product_id: int,
    review: ReviewCreate,
    db: Session = Depends(get_db),
    buyer = Depends(buyer_only)
):
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Prevent duplicate review
    existing = db.query(Review).filter(
        Review.user_id == buyer.id,
        Review.product_id == product_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")

    new_review = Review(
        rating=review.rating,
        comment=review.comment,
        user_id=buyer.id,
        product_id=product_id
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


# ================= GET PRODUCT REVIEWS =================
@router.get("/{product_id}")
def get_reviews(product_id: int, db: Session = Depends(get_db)):

    reviews = db.query(Review).filter(
        Review.product_id == product_id
    ).all()

    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.product_id == product_id
    ).scalar() or 0

    return {
        "average_rating": round(avg_rating, 1),
        "reviews": reviews
    }