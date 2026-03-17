from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func,asc,desc,or_
import os
import shutil
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductOut
from app.utils.dependencies import seller_only, admin_only
from app.routes.order import OrderItem, Order

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ================= SELLER CREATE PRODUCT =================

@router.post("/", response_model=ProductOut)
def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    seller = Depends(seller_only)
):
    image_url = None

    if image:
        try:
            filename = f"{seller.id}_{image.filename}"
            file_path = os.path.join(UPLOAD_FOLDER, filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            image_url = f"/uploads/{filename}"

        except Exception:
            raise HTTPException(status_code=500, detail="Image upload failed")

    new_product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        image_url=image_url,
        seller_id=seller.id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# ================= SELLER UPDATE PRODUCT =================

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    name: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    stock: int = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    seller = Depends(seller_only)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name is not None:
        product.name = name
    if description is not None:
        product.description = description
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = stock

    if image:
        filename = f"{seller.id}_{image.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        product.image_url = f"/uploads/{filename}"

    db.commit()
    db.refresh(product)

    return product


# ================= SELLER DELETE PRODUCT =================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    seller = Depends(seller_only)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.image_url:
        image_path = product.image_url.lstrip("/")
        if os.path.exists(image_path):
            os.remove(image_path)
    product.is_active=False
    db.commit()

    return {"message": "Product deleted successfully"}


# ================= SELLER PRODUCTS =================

@router.get("/seller", response_model=list[ProductOut])
def get_seller_products(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db),
    seller = Depends(seller_only)
):
    offset = (page - 1) * limit

    products = (
        db.query(Product)
        .filter(Product.seller_id == seller.id)
        .order_by(Product.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return products

# ================= SELLER STATS =================

@router.get("/seller/stats")
def seller_stats(
    db: Session = Depends(get_db),
    seller = Depends(seller_only)
):
    total_products = db.query(Product).filter(
        Product.seller_id == seller.id
    ).count()

    total_revenue = (
        db.query(func.sum(OrderItem.price * OrderItem.quantity))
        .join(Product, Product.id == OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Product.seller_id == seller.id)
        .filter(Order.status == "PAID")
        .scalar()
    ) or 0

    return {
        "total_products": total_products,
        "total_revenue": total_revenue
    }

# ================= SELLER GET ALL PRODUCTS =================

@router.put("/{product_id}")
def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user = Depends(seller_only)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == user.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = name
    product.description = description
    product.price = price
    product.stock = stock

    if image:
        file_path = f"uploads/{image.filename}"
        with open(file_path, "wb") as f:
            f.write(image.file.read())
        product.image_url = f"/{file_path}"

    db.commit()
    db.refresh(product)

    return {"message": "Product updated successfully"}

# ================= ADMIN GET ALL PRODUCTS =================

@router.get("/admin/all", dependencies=[Depends(admin_only)])
def admin_get_all_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


# ================= ADMIN DELETE PRODUCT =================

@router.delete("/admin/{product_id}", dependencies=[Depends(admin_only)])
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active=False
    db.commit()

    return {"message": "Product deleted by admin"}


# ================= PUBLIC GET PRODUCTS (ADVANCED FILTERS + PAGINATION) =================

@router.get("/")
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(8, ge=1),
    min_price: float = Query(None),
    max_price: float = Query(None),
    rating: float = Query(None),
    category: str = Query(None),
    sort: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    # Price Filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Category Filter
    if category:
        query = query.filter(Product.category == category)

    # Rating Filter
    if rating is not None:
        query = query.filter(Product.average_rating >= rating)

    # Sorting
    if sort == "price_low":
        query = query.order_by(asc(Product.price))

    elif sort == "price_high":
        query = query.order_by(desc(Product.price))

    elif sort == "newest":
        query = query.order_by(desc(Product.created_at))

    else:
        query = query.order_by(desc(Product.id))  # default newest

    total_products = query.count()

    skip = (page - 1) * limit

    products = query.offset(skip).limit(limit).all()

    return {
        "total": total_products,
        "page": page,
        "limit": limit,
        "data": products
    }