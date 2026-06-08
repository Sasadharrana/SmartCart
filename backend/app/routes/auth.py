import os
import re
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==============================
# LOAD ENVIRONMENT VARIABLES
# ==============================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

RESET_TOKEN_EXPIRE_MINUTES = 15

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError(
        "SECRET_KEY or ALGORITHM not set in environment variables"
    )

# ==============================
# SCHEMAS
# ==============================

class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    role: str

    @validator("email")
    def normalize_email(cls, value):
        value = value.strip().lower()

        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", value):
            raise ValueError("Invalid email format")

        return value

    @validator("password")
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError(
                "Password must be at least 8 characters long"
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Must contain uppercase letter"
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "Must contain lowercase letter"
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "Must contain digit"
            )

        if not re.search(
            r"[!@#$%^&*(),.?\":{}|<>]",
            value
        ):
            raise ValueError(
                "Must contain special character"
            )

        return value


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

# ==============================
# HELPER FUNCTIONS
# ==============================

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(data: dict):
    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def create_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(
        minutes=RESET_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": email,
        "type": "reset",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

# ==============================
# REGISTER
# ==============================

@router.post("/register")
def register(
    user: RegisterSchema,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully"
    }

# ==============================
# LOGIN
# ==============================

@router.post("/login")
def login(
    user: LoginSchema,
    db: Session = Depends(get_db)
):
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if (
        not db_user
        or not verify_password(
            user.password,
            db_user.password
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "sub": db_user.email,
            "role": db_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
    }

# ==============================
# FORGOT PASSWORD
# ==============================

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordSchema,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email not registered"
        )

    reset_token = create_reset_token(
        user.email
    )

    return {
        "message": "Reset token generated",
        "reset_token": reset_token,
    }

# ==============================
# RESET PASSWORD
# ==============================

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordSchema,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            data.token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if payload.get("type") != "reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid reset token"
            )

        email = payload.get("sub")

    except JWTError:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired token"
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password = hash_password(
        data.new_password
    )

    db.commit()

    return {
        "message": "Password reset successfully"
    }