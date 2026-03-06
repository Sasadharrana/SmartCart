from pydantic import BaseModel

class ReviewCreate(BaseModel):
    rating: int
    comment: str | None = None

class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str | None
    user_id: int

    class Config:
        from_attributes = True