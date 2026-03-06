from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cart import Cart
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


# ================= PLACE ORDER =================

@router.post("/")
def place_order(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    cart_items = db.query(Cart).filter(
        Cart.user_id == user.id
    ).all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 🔥 STEP 1: Validate stock first (before creating order)
    total = 0
    products_map = {}

    for item in cart_items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} is out of stock"
            )

        products_map[item.product_id] = product
        total += product.price * item.quantity

    # 🔥 STEP 2: Create Order (only after validation)
    order = Order(
        user_id=user.id,
        total_amount=total,
        status="PLACED"
    )

    db.add(order)
    db.flush()  # safer than commit here

    # 🔥 STEP 3: Create Order Items + Reduce Stock
    for item in cart_items:
        product = products_map[item.product_id]

        # Reduce stock
        product.stock -= item.quantity

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )

        db.add(order_item)

    # 🔥 STEP 4: Clear Cart
    db.query(Cart).filter(
        Cart.user_id == user.id
    ).delete()

    db.commit()

    return {
        "message": "Order placed successfully",
        "order_id": order.id,
        "status": order.status,
        "total_amount": order.total_amount
    }


# ================= MANUAL PAYMENT =================

@router.post("/{order_id}/pay")
def pay_order(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "PAID":
        raise HTTPException(status_code=400, detail="Order already paid")

    order.status = "PAID"
    db.commit()

    return {
        "message": "Payment successful",
        "order_id": order.id,
        "status": order.status
    }


# ================= ORDER HISTORY =================

@router.get("/")
def order_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.id.desc())
        .all()
    )

    response = []

    for order in orders:
        items = (
            db.query(OrderItem, Product)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

        item_list = []

        for item, product in items:
            item_list.append({
                "product_name": product.name,
                "image_url": product.image_url,
                "quantity": item.quantity,
                "price": item.price
            })

        response.append({
            "order_id": order.id,
            "status": order.status,
            "total_amount": order.total_amount,
            "items": item_list
        })

    return response