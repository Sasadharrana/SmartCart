from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

#Payment Table


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="PENDING")  
    # PENDING / SUCCESS / FAILED