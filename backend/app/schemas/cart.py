from pydantic import BaseModel,Field

class CartCreate(BaseModel):
    product_id: int
    quantity: int

class CartUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

