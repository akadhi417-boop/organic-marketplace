# Organic Fruits & Vegetables Marketplace

**Final Year Project - B.Tech Computer Science Engineering**

A full-stack web application connecting organic farmers directly with customers, providing a seamless and transparent marketplace for fresh, organic produce.

## 📋 Project Overview

This platform enables organic farmers to showcase and sell their products directly to health-conscious consumers, eliminating middlemen and ensuring fair prices. The application features comprehensive user management, secure payments, and an intuitive interface designed with an organic theme.

## Features

### User Authentication System
- Email/password registration and login
- JWT-based authentication
- Role-based access control (Admin, Farmer, Customer)
- Secure password hashing with bcrypt

### Role-Based Access Control

#### Customer Features
- Browse organic products by category (Fruits, Vegetables)
- Search products
- View product details with ratings and reviews
- Add products to cart
- Manage cart (update quantities, remove items)
- Checkout with delivery information
- Secure payment processing via Stripe
- View order history
- Leave product reviews and ratings

#### Farmer Features
- Dashboard with sales analytics
- Add new products with details (name, description, price, stock, images)
- Edit and delete own products
- View orders containing their products
- Manage product inventory
- Track revenue

#### Admin Features
- Platform-wide statistics (users, products, orders, revenue)
- View all users
- View all products
- Manage order statuses
- Monitor platform activity

### CRUD Operations
- **Users**: Create (register), Read (profile), Update, Delete
- **Products**: Full CRUD operations for farmers
- **Orders**: Create orders, Read order history, Update status (admin/farmer)
- **Cart**: Add items, Update quantities, Remove items, Clear cart
- **Reviews**: Create reviews, Read product reviews

### Payment Integration
- Stripe payment gateway integration
- Secure checkout flow with INR (Indian Rupees) currency
- Payment status verification
- Order confirmation after successful payment
- Payment transaction tracking

### Responsive UI
- Modern, organic-themed design
- Mobile-responsive layout
- Fresh color palette (moss green, terracotta, bone white)
- Playfair Display font for headings
- Smooth animations and transitions
- Accessible components from shadcn/ui

## Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - JSON Web Tokens for authentication
- **Stripe** - Payment processing
- **Pydantic** - Data validation
- **Bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

## Project Structure

```
/app
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth)
│   │   ├── utils/         # Utility functions (API client)
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (Farmer/Admin)
- `PUT /api/products/{id}` - Update product (Farmer/Admin)
- `DELETE /api/products/{id}` - Delete product (Farmer/Admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{product_id}` - Update item quantity
- `DELETE /api/cart/items/{product_id}` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get orders (filtered by role)
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders/create` - Create order with payment
- `PUT /api/orders/{id}/status` - Update order status (Admin/Farmer)
- `GET /api/orders/payment-status/{session_id}` - Check payment status

### Reviews
- `POST /api/reviews` - Create review (Customer)
- `GET /api/reviews/product/{product_id}` - Get product reviews

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get platform statistics

### Payment
- `POST /api/webhook/stripe` - Stripe webhook handler

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
JWT_SECRET=organic_marketplace_secret_key_change_in_production
JWT_ALGORITHM=HS256
STRIPE_API_KEY=your_stripe_test_key_here
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-app-url.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Stripe account (test mode)

### Installation

1. **Backend Setup**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd /app/frontend
yarn install
```

3. **Start Services**
Services are managed by supervisor:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Default Test Users

You can register new users with the following roles:
- Admin: Set role to "admin" during registration
- Farmer: Set role to "farmer" during registration
- Customer: Set role to "customer" during registration (default)

## Payment Flow

1. Customer adds items to cart
2. Proceeds to checkout with delivery information
3. Creates order and redirects to Stripe checkout
4. Completes payment on Stripe
5. Redirected back to success page with session ID
6. Frontend polls payment status
7. Backend verifies with Stripe and updates order
8. Cart is cleared and inventory updated
9. Order marked as "processing"

## Design System

### Colors
- **Primary (Moss Green)**: #2F5233 - Main actions, buttons, headings
- **Secondary (Terracotta)**: #B05C3C - Accents, sale tags
- **Background (Bone White)**: #F9F8F4 - Main background
- **Surface (Pure White)**: #FFFFFF - Cards, modals

### Typography
- **Headings**: Playfair Display (Serif)
- **Body**: Manrope (Sans-serif)
- **Accent**: Caveat (Handwriting) - Used for organic badges

### Key UI Features
- Rounded buttons with hover animations
- Shadow-based depth
- Smooth transitions
- Organic certification badges
- Star ratings
- Responsive grid layouts

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based route protection
- Input validation with Pydantic
- CORS configuration
- Secure payment processing
- MongoDB injection prevention

## Database Schema

### Users Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  full_name: String,
  role: String (admin|farmer|customer),
  phone: String,
  address: String,
  created_at: DateTime
}
```

### Products Collection
```javascript
{
  name: String,
  description: String,
  category: String (fruits|vegetables),
  price: Float,
  unit: String (kg|piece|dozen|bunch),
  stock_quantity: Integer,
  image_url: String,
  organic_certified: Boolean,
  farmer_id: String,
  farmer_name: String,
  average_rating: Float,
  total_reviews: Integer,
  created_at: DateTime
}
```

### Orders Collection
```javascript
{
  customer_id: String,
  customer_name: String,
  customer_email: String,
  items: Array,
  total_amount: Float,
  delivery_address: String,
  phone: String,
  notes: String,
  status: String (pending|processing|shipped|delivered|cancelled),
  payment_status: String (pending|completed|failed),
  payment_session_id: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Carts Collection
```javascript
{
  customer_id: String,
  items: Array,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Reviews Collection
```javascript
{
  product_id: String,
  customer_id: String,
  customer_name: String,
  rating: Integer (1-5),
  comment: String,
  created_at: DateTime
}
```

### Payment Transactions Collection
```javascript
{
  order_id: String,
  customer_id: String,
  session_id: String,
  amount: Float,
  currency: String,
  payment_status: String,
  status: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

## Future Enhancements

- Real-time order tracking with GPS integration
- Email and SMS notifications for order updates
- Advanced analytics dashboard for farmers
- AI-powered product recommendations
- Wishlist functionality
- Farmer ratings and reviews
- Multi-language support (Hindi, regional languages)
- Advanced search with filters (price range, location, certifications)
- Bulk order discounts for institutional buyers
- Subscription boxes for regular customers
- Mobile application (React Native)

## Project Team

**Student Name**: [Your Name]  
**Roll Number**: [Your Roll Number]  
**Department**: Computer Science Engineering  
**Institution**: [Your College/University Name]  
**Academic Year**: [Year]  
**Project Guide**: [Guide Name]

## Acknowledgments

Special thanks to my project guide and the faculty of the Computer Science Department for their guidance and support throughout this project.

## License

This project is developed as part of academic curriculum.

---

**© 2026 OrganicMarket | Final Year Project - CSE**  
*Promoting sustainable agriculture and healthy living through technology*
