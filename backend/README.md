# SmartCart Backend

The backend of SmartCart is built using **FastAPI**, providing REST APIs for authentication, product management, cart management, orders, payments, and reviews.

---

## Technologies

* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* Passlib (bcrypt)

---

## Backend Structure

```
backend
│
├── app
│   ├── models
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── payment.py
│   │   └── review.py
│   │
│   ├── routers
│   ├── schemas
│   ├── core
│   └── main.py
│
├── requirements.txt
└── .env
```

---

## Setup

### Clone Repository

```
git clone https://github.com/yourusername/smartcart.git
cd smartcart/backend
```

---

### Create Virtual Environment

```
python -m venv venv
```

Activate:

Windows

```
venv\Scripts\activate
```

Linux / Mac

```
source venv/bin/activate
```

---

### Install Dependencies

```
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/smartcart
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

##  Run Server

```
uvicorn app.main:app --reload
```

Server runs at:

```
http://127.0.0.1:8000
```

Swagger API Docs:

```
http://127.0.0.1:8000/docs
```

---

## Authentication

* Password hashing using bcrypt
* JWT access tokens
* Role-based authorization

---

## Main API Modules

* Auth
* Products
* Cart
* Orders
* Payments
* Reviews
