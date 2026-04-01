# 🌿 Organic Marketplace

A full-stack organic produce marketplace built with **React** + **Django REST Framework**.

🌐 **Live Demo:** [organicmarketplace.netlify.app](https://organicmarketplace.netlify.app)  
🔗 **API:** [akadhi417.pythonanywhere.com](https://akadhi417.pythonanywhere.com)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, shadcn/ui |
| Backend | Django 5.1, Django REST Framework |
| Database | SQLite |
| Auth | JWT (SimpleJWT) |
| Frontend Host | Netlify |
| Backend Host | PythonAnywhere |

---

## 👥 Demo Accounts

After running `python manage.py seed_demo`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@organicmarket.com | admin123 |
| Farmer | farmer@organicmarket.com | farmer123 |
| Customer | customer@organicmarket.com | customer123 |

---

## 🚀 Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
cp .env.example .env            # edit with your values
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

Edit `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
DEBUG=False
DJANGO_SECRET_KEY=your-secret-key
ALLOWED_HOSTS=127.0.0.1,localhost,.pythonanywhere.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-site.netlify.app
CSRF_TRUSTED_ORIGINS=https://*.pythonanywhere.com,https://your-site.netlify.app
FRONTEND_URL=https://your-site.netlify.app
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=https://your-username.pythonanywhere.com
```

---

## ☁️ Deployment

### Backend → PythonAnywhere

1. Upload and unzip project to PythonAnywhere
2. Create virtualenv and install dependencies
3. Set up `.env` with production values
4. Run `migrate` and `collectstatic`
5. Configure Web tab: Manual config → Python 3.12
6. Set WSGI file:

```python
import os, sys
path = '/home/<username>/organic-marketplace-django/backend'
if path not in sys.path:
    sys.path.insert(0, path)
os.environ['DJANGO_SETTINGS_MODULE'] = 'organic_marketplace.settings'
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

7. Add static file mappings:
   - `/static/` → `backend/staticfiles`
   - `/media/` → `backend/media`
8. Click **Reload**

### Frontend → Netlify

1. Set `REACT_APP_BACKEND_URL` in `frontend/.env` to your PythonAnywhere URL
2. Build: `npm run build`
3. Drag and drop the `build/` folder to [netlify.com/drop](https://app.netlify.com/drop)

> `netlify.toml` and `_redirects` are pre-configured so React routes work after page refresh.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products/` | List all products |
| GET | `/api/products/:id/` | Product detail |
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns JWT tokens |
| GET | `/api/cart/` | Get current user cart |
| POST | `/api/cart/items/` | Add item to cart |
| POST | `/api/orders/create/` | Create order / checkout |
| GET | `/api/orders/` | List user orders |
| POST | `/api/reviews/` | Submit a product review |
| GET | `/api/admin/stats/` | Admin dashboard stats |

---

## 📁 Project Structure

```
organic-marketplace-django/
├── backend/
│   ├── apps/
│   │   ├── users/        # Auth, roles, JWT
│   │   ├── products/     # Product listings
│   │   ├── carts/        # Shopping cart
│   │   ├── orders/       # Orders & checkout
│   │   └── reviews/      # Product reviews
│   ├── organic_marketplace/  # Django settings & URLs
│   └── requirements.txt
└── frontend/
    ├── src/
│   │   ├── pages/        # Landing, Cart, Checkout, Dashboards...
│   │   ├── context/      # AuthContext
│   │   └── utils/        # API helpers
    └── package.json
```

---

## 💳 Payment Note

This project uses a **simulated checkout flow** — no Stripe setup required. When a customer places an order, the backend returns a checkout URL that redirects to the payment-success page and marks the order as paid automatically.

---

## 📄 License

MIT
