from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.utils.dependencies import admin_only

router = APIRouter(prefix="/admin", tags=["Admin"])


# ================= USERS =================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]


class RoleUpdate(BaseModel):
    role: str


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot change their own role"
        )

    if data.role not in ["admin", "seller", "buyer"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = data.role
    db.commit()

    return {"message": "Role updated successfully"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete themselves"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


# ================= PRODUCTS =================

@router.get("/products")
def get_all_products(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    products = db.query(Product).all()

    response = []

    for product in products:
        seller = db.query(User).filter(User.id == product.seller_id).first()

        response.append({
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "stock": product.stock,
            "is_active": product.is_active,
            "image_url": product.image_url,
            "seller_email": seller.email if seller else None
        })

    return response


@router.put("/products/{product_id}/toggle")
def toggle_product_status(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = not product.is_active
    db.commit()

    return {
        "message": "Product status updated",
        "is_active": product.is_active
    }


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
   
    db.commit()

    return {"message": "Product deleted successfully"}


# ================= ORDERS DETAILS =================

@router.get("/orders/details")
def get_all_orders(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    orders = (
        db.query(Order)
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

        order_items = []

        for item, product in items:
            order_items.append({
                "product_name": product.name,
                "image_url": product.image_url,
                "quantity": item.quantity,
                "price": item.price
            })

        response.append({
            "order_id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "items": order_items
        })

    return response


# ================= ORDER STATUS UPDATE =================

class OrderStatusUpdate(BaseModel):
    status: str


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed_status = ["PLACED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

    new_status = data.status.upper()

    if new_status not in allowed_status:
        raise HTTPException(status_code=400, detail="Invalid status")

    order.status = new_status

    db.commit()
    db.refresh(order)

    return {
        "message": "Order status updated successfully",
        "order_id": order.id,
        "new_status": order.status
    }

# ================= DASHBOARD STATS =================

@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    total_users = db.query(User).count()
    total_sellers = db.query(User).filter(User.role == "seller").count()
    total_orders = db.query(Order).count()

    total_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status == "PAID")
        .scalar()
    ) or 0

    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "total_orders": total_orders,
        "total_revenue": total_revenue
    }


@router.get("/analytics/orders")
def order_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    result = (
        db.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )

    return [
        {"status": status, "count": count}
        for status, count in result
    ]