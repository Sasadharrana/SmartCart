from pydantic import BaseModel

class PaymentCreate(BaseModel):
    order_id: int

class PaymentVerify(BaseModel):
    payment_id: int
    status: str   # SUCCESS or FAILED