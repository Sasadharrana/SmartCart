from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.product import Product
from app.schemas.cart import CartCreate
from app.database import get_db
from app.utils.dependencies import buyer_only

router = APIRouter(prefix="/cart", tags=["Cart"])


# ================= ADD TO CART =================
@router.post("/")
def add_to_cart(
    cart: CartCreate,
    db: Session = Depends(get_db),
    user = Depends(buyer_only)
):
    product = db.query(Product).filter(
        Product.id == cart.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if cart.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    existing_item = db.query(Cart).filter(
        Cart.user_id == user.id,
        Cart.product_id == cart.product_id
    ).first()

    if existing_item:
        new_quantity = existing_item.quantity + cart.quantity

        if new_quantity > product.stock:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        existing_item.quantity = new_quantity
    else:
        if cart.quantity > product.stock:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        new_item = Cart(
            user_id=user.id,
            product_id=cart.product_id,
            quantity=cart.quantity
        )
        db.add(new_item)

    db.commit()
    return {"message": "Product added to cart successfully"}


# ================= VIEW CART =================
@router.get("/")
def view_cart(
    db: Session = Depends(get_db),
    user = Depends(buyer_only)
):
    cart_items = db.query(Cart).filter(Cart.user_id == user.id).all()

    response = []
    grand_total = 0

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            continue

        total_price = product.price * item.quantity
        grand_total += total_price

        response.append({
            "cart_id": item.id,
            "product_id": product.id,
            "product_name": product.name,
            "price": product.price,
            "quantity": item.quantity,
            "total_price": total_price,
            "image_url": product.image_url,
            "stock": product.stock
        })

    return {
        "items": response,
        "grand_total": grand_total
    }


# ================= UPDATE CART =================
@router.put("/{cart_id}")
def update_cart(
    cart_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    user = Depends(buyer_only)
):
    cart_item = db.query(Cart).filter(
        Cart.id == cart_id,
        Cart.user_id == user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    product = db.query(Product).filter(
        Product.id == cart_item.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 🔥 If quantity <= 0 → remove item
    if quantity <= 0:
        db.delete(cart_item)
        db.commit()
        return {"message": "Item removed from cart"}

    if quantity > product.stock:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart_item.quantity = quantity
    db.commit()

    return {"message": "Cart updated successfully"}


# ================= DELETE SINGLE ITEM =================
@router.delete("/{cart_id}")
def delete_cart_item(
    cart_id: int,
    db: Session = Depends(get_db),
    user = Depends(buyer_only)
):
    cart_item = db.query(Cart).filter(
        Cart.id == cart_id,
        Cart.user_id == user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    db.delete(cart_item)
    db.commit()

    return {"message": "Item removed from cart successfully"}


# ================= CLEAR CART =================
@router.delete("/")
def clear_cart(
    db: Session = Depends(get_db),
    user = Depends(buyer_only)
):
    db.query(Cart).filter(Cart.user_id == user.id).delete()
    db.commit()

    return {"message": "Cart cleared successfully"}