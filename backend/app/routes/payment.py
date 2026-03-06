from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payment", tags=["Payment"])


# =====================================================
# INITIATE PAYMENT (Optional Step - for info display)
# =====================================================

@router.post("/create/{order_id}")
def create_payment(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status.upper() == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )

    return {
        "message": "Payment initiated",
        "order_id": order.id,
        "amount": order.total_amount,
        "status": order.status
    }


# =====================================================
# VERIFY PAYMENT (Mock Success)
# =====================================================

@router.post("/verify/{order_id}")
def verify_payment(
    order_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Prevent double payment
    if order.status.upper() == "PAID":
        return {
            "message": "Order already paid",
            "order_id": order.id,
            "status": order.status
        }

    # Allow payment only if order is placed
    if order.status.upper() != "PLACED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay for order in '{order.status}' status"
        )

    # Update status to PAID
    order.status = "PAID"
    db.commit()

    return {
        "message": "Payment successful",
        "order_id": order.id,
        "status": order.status
    }