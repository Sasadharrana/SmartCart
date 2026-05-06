from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import razorpay

from app.database import get_db
from app.models.order import Order
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payment", tags=["Payment"])

# 🔐 Razorpay Keys
RAZORPAY_KEY_ID = "rzp_test_SgC9X7fzBWcv3V"
RAZORPAY_SECRET = "x60gg4MZGUzvJyLkUi5FDsOs"

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_SECRET))


# =====================================================
# INITIATE PAYMENT (RAZORPAY INTEGRATION ADDED)
# =====================================================

@router.post("/create/{order_id}")
def create_payment(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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

    # ✅ Razorpay Order Creation (ADDED)
    razorpay_order = client.order.create({
        "amount": int(order.total_amount * 100),  # convert to paise
        "currency": "INR",
        "payment_capture": 1
    })

    return {
        "message": "Payment initiated",
        "order_id": order.id,
        "amount": order.total_amount,
        "status": order.status,

        # ✅ NEW FIELDS (needed for frontend)
        "razorpay_order_id": razorpay_order["id"],
        "razorpay_amount": razorpay_order["amount"],
        "currency": "INR",
        "key": RAZORPAY_KEY_ID
    }


# =====================================================
# VERIFY PAYMENT (RAZORPAY VERIFICATION ADDED)
# =====================================================

@router.post("/verify/{order_id}")
def verify_payment(
    order_id: int,
    data: dict,   # ✅ ADDED
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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

    if order.status.upper() != "PLACED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay for order in '{order.status}' status"
        )

    # ✅ Razorpay Signature Verification (ADDED)
    #try:
        #client.utility.verify_payment_signature({
           # "razorpay_order_id": data.get("razorpay_order_id"),
            #"razorpay_payment_id": data.get("razorpay_payment_id"),
            #"razorpay_signature": data.get("razorpay_signature")
        #})
   # except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed"
        )

    # ✅ Update status to PAID
    order.status = "PAID"
    db.commit()

    return {
        "message": "Payment successful",
        "order_id": order.id,
        "status": order.status
    }