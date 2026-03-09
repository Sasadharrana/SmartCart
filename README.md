# SmartCart – Full Stack E-Commerce Platform

SmartCart is a full-stack e-commerce application built using **FastAPI (backend)** and **React (frontend)**.
It allows users to browse products, manage carts, place orders, process payments, and review products.

This project demonstrates a complete **modern web application architecture** including authentication, role-based access, relational database design, and REST APIs.

---

## Features

### Buyer

* Register and login
* Browse products
* Search and filter products
* Add products to cart
* Update cart quantities
* Place orders
* Make payments
* View order history
* Write product reviews

### Seller

* Add new products
* Manage product inventory
* Upload product images

### Admin

* Manage platform users
* Manage products
* Admin dashboard
* Order products

---

## Tech Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT Authentication
* Passlib (bcrypt)

### Frontend

* React
* React Router
* Axios
* Tailwind CSS

---

## Project Structure

```
SmartCart
│
├── backend
│   ├── app
│   │   ├── models
│   │   ├── routers
│   │   ├── schemas
│   │   ├── core
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── README.md
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   └── services
│   │
│   └── README.md
│
└── README.md
```

---

## Database Design

Main tables used in SmartCart:

* Users
* Products
* Cart
* Orders
* OrderItems
* Payments
* Reviews

### Relationships

* User → Products (Seller)
* User → Orders
* User ↔ Product (Cart)
* Order ↔ Product (OrderItems)
* Order → Payment
* Product → Reviews

---

## Authentication

SmartCart uses **JWT-based authentication**.

* Password hashing using bcrypt
* Access tokens for API authentication
* Role-based authorization

---

##  Running the Project

See setup instructions in:

* **backend/README.md**
* **frontend/README.md**

---

## 👨‍💻 Author

**Sasadhar Rana**

* Email: [sasadharrana825@gmail.com](mailto:sasadharrana825@gmail.com)

---


