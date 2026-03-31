# Organic Marketplace (React UI + Django Backend + SQLite)

This ZIP keeps the existing React UI and replaces the old FastAPI/MongoDB backend with Django + SQLite.

## Stack
- Frontend: React
- Backend: Django REST Framework
- Database: SQLite
- Auth: JWT

## Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

Backend runs at:
- http://127.0.0.1:8000

## Frontend setup
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Frontend runs at:
- http://localhost:3000

## Demo accounts after `seed_demo`
- Admin: admin@organicmarket.com / admin123
- Farmer: farmer@organicmarket.com / farmer123
- Customer: customer@organicmarket.com / customer123

## Payment note
This version uses a local simulated checkout flow so the existing UI works end-to-end without Stripe setup.
When a customer places an order, the backend returns a checkout URL that redirects to the existing payment-success page, and the payment-status endpoint marks the order as paid.


## Local setup notes

Frontend has been pinned to React 18/date-fns 3 and includes AJV compatibility dev dependencies so `npm install` and `npm start` work more reliably on Windows.

## Deployment notes

### Backend on PythonAnywhere
- Use `backend/.env` and set your real PythonAnywhere domain and Netlify URL.
- Recommended `ALLOWED_HOSTS` includes `.pythonanywhere.com` so the app works on PythonAnywhere without a 400 host error.
- Set static mapping to `backend/staticfiles` and media mapping to `backend/media`.

### Frontend on Netlify
- `frontend/.env` now points to a PythonAnywhere backend placeholder instead of localhost.
- `frontend/public/_redirects` and `frontend/netlify.toml` are included so React routes like `/login` and `/register` work after refresh.
