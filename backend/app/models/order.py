from sqlalchemy import Column, Integer, ForeignKey, Float, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    total_amount = Column(Float, nullable=False)

    status = Column(String, default="PLACED", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())