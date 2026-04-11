# Zapify - Premium E-commerce Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge&logo=vercel)](https://zapify-three.vercel.app/)

Zapify is a modern, high-performance e-commerce ecosystem built with the MySQL, Express, React, Node.js. It provides a seamless experience for customers, a powerful dashboard for sellers, and a comprehensive moderation suite for administrators.

## 🚀 Key Features

-   **Customer Storefront**: Sleek product discovery with Algolia search integration.
-   **Seller Dashboard**: Advanced analytics, inventory management, and order fulfillment.
-   **Invoicing**: PDF generation with itemized MRP, selling price, and detailed savings breakdown.
-   **Admin Suite**: Review moderation, user management, and platform-wide statistics.
-   **Hybrid Responsive UI**: "Classic" desktop/pad layout with a mobile-optimized alignment-fixed grid.
-   **Advanced Address System**: Comprehensive shipping management with JSON-based landmark and structured data support.
-   **Security**: JWT-based authentication, Google/GitHub OAuth, and secure payment processing via Stripe.

---

## 🛠️ Project Structure

```text
zapify/
├── backend/    # Node.js/Express API with Sequelize ORM
└── frontend/   # React/Vite SPA with Tailwind CSS
```

---

## ⚙️ Backend Setup

### Prerequisites
-   Node.js (v18+)
-   MySQL
-   Redis (for background workers)

### Installation
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.sample` and fill in your credentials.

### Environment Variables
| Variable | Description |
| :--- | :--- |
| `PORT` | Local server port (e.g., 5000) |
| `DB_NAME` / `DB_USER` / `DB_PASS` | PostgreSQL database credentials |
| `JWT_SECRET` | Secret key for signing access tokens |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh tokens |
| `CLOUDINARY_NAME` | Cloudinary account name for media uploads |
| `STRIPE_SECRET_KEY` | Stripe API secret for payments |
| `REDIS_URL` | Redis connection string (e.g., redis://localhost:6379) |
| `ALGOLIA_ADMIN_KEY` | Algolia API key for indexing products |
-- and more... (Check .env.sample)

### Running the App
-   **Development**: `npm run dev` (starts server with nodemon)

---

## 💻 Frontend Setup

### Prerequisites
-   Node.js (v18+)
-   NPM or Yarn

### Installation
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the frontend folder.

### Environment Variables
```ini
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
VITE_ALGOLIA_APP_ID=your_algolia_id
VITE_ALGOLIA_SEARCH_KEY=your_algolia_search_key
```

### Running the App
-   **Development**: `npm run dev`
-   **Production Build**: `npm run build`
-   **Preview**: `npm run preview`

---

## 🛠️ Tech Stack

### Frontend
-   **React 18** + **Vite**
-   **Redux Toolkit** (State Management)
-   **Tailwind CSS v4** (Styling)
-   **Lucide React** (Icons)
-   **Chart.js** (Analytics)
-   **React Hot Toast** (Notifications)

### Backend
-   **Node.js** & **Express**
-   **Sequelize (ORM)** with **MySQL**
-   **Redis** (BullMQ for background jobs)
-   **Stripe** (Payment Gateway)
-   **Algolia** (Search Engine)
-   **Cloudinary** (Image Hosting)
-   **Brevo** (Email & SMS notifications)

---

## 👤 Author
Developed by **[Vishal](https://github.com/vishal-1207)**
