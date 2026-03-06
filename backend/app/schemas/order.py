from pydantic import BaseModel

class OrderOut(BaseModel):
    id: int
    total_amount: float
    status: str

    class Config:
        from_attributes = True