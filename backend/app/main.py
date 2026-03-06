from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import Base, engine
from app.routes import auth, product, cart, order, payment, admin,review
from app.models import user, product as product_model, cart as cart_model, order as order_model, order_item

# Create tables (development only)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartCart E-Commerce API")

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= STATIC FILES =================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")

# ================= ROUTERS =================
app.include_router(auth.router)
app.include_router(product.router)
app.include_router(cart.router)
app.include_router(order.router)
app.include_router(payment.router)
app.include_router(admin.router)
app.include_router(review.router)

@app.get("/")
def root():
    return {"message": "SmartCart Backend is running"}