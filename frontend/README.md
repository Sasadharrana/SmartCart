# SmartCart Frontend

The SmartCart frontend is built using **React** and communicates with the FastAPI backend via REST APIs.

---

## Technologies

* React
* React Router
* Axios
* Tailwind CSS

---

## Frontend Structure

```
frontend
│
├── src
│   ├── components
│   │   └── Navbar.jsx
│   │
│   ├── pages
│   │   ├── BuyerDashboard.jsx
│   │   ├── Cart.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── SellerDashboard.jsx
│   │
│   ├── services
│   │   └── api.js
│   │
│   └── App.jsx
│
└── package.json
```

---

## Setup

Navigate to frontend folder:

```
cd frontend
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## API Communication

Frontend communicates with backend APIs using **Axios**.

Example API calls:

* Login
* Register
* Fetch products
* Add to cart
* Place orders
* Submit reviews

---

## UI Pages

* Login Page
* Register Page
* Buyer Dashboard
* Product Listing
* Cart Page
* Order History
* Seller Dashboard
* Admin Dashboard

---

## Backend Integration

Backend API base URL:

```
http://127.0.0.1:8000
```
