from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, index=True)
    description = Column(String)

    price = Column(Float)
    stock = Column(Integer)
    category = Column(String, index=True)   # for category filter
    average_rating = Column(Float, default=0)  # for rating filter
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # for newest sorting
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True,nullable=False)

    seller_id = Column(Integer, ForeignKey("users.id"))