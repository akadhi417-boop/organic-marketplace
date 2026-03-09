from fastapi import FastAPI, HTTPException, Depends, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv
from bson import ObjectId
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

load_dotenv()

app = FastAPI(title="Organic Marketplace API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
products_collection = db["products"]
carts_collection = db["carts"]
orders_collection = db["orders"]
reviews_collection = db["reviews"]
payment_transactions_collection = db["payment_transactions"]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

# ==================== MODELS ====================

class UserRole:
    ADMIN = "admin"
    FARMER = "farmer"
    CUSTOMER = "customer"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = Field(..., pattern="^(admin|farmer|customer)$")
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: str

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str  # fruits, vegetables
    price: float
    unit: str  # kg, piece, dozen
    stock_quantity: int
    image_url: Optional[str] = None
    organic_certified: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    organic_certified: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    unit: str
    stock_quantity: int
    image_url: Optional[str] = None
    organic_certified: bool
    farmer_id: str
    farmer_name: str
    average_rating: float = 0.0
    total_reviews: int = 0
    created_at: str

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

class OrderCreate(BaseModel):
    delivery_address: str
    phone: str
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    items: List[Dict]
    total_amount: float
    delivery_address: str
    phone: str
    notes: Optional[str] = None
    status: str  # pending, paid, processing, shipped, delivered, cancelled
    payment_status: str  # pending, completed, failed
    payment_session_id: Optional[str] = None
    created_at: str
    updated_at: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    customer_id: str
    customer_name: str
    rating: int
    comment: Optional[str] = None
    created_at: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*allowed_roles):
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if not doc:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", status_code=201)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await users_collection.insert_one(user_dict)
    
    # Create JWT token
    token = create_access_token({"sub": str(result.inserted_id), "role": user_data.role})
    
    user = await users_collection.find_one({"_id": result.inserted_id}, {"password": 0})
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": serialize_doc(user)
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    user = await users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    
    user_data = await users_collection.find_one({"_id": user["_id"]}, {"password": 0})
    
    return {
        "message": "Login successful",
        "token": token,
        "user": serialize_doc(user_data)
    }

@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    user_copy = {k: v for k, v in user.items() if k != "password"}
    return serialize_doc(user_copy)

# ==================== PRODUCT ENDPOINTS ====================

@app.post("/api/products", status_code=201)
async def create_product(
    product_data: ProductCreate,
    user=Depends(require_role(UserRole.FARMER, UserRole.ADMIN))
):
    product_dict = product_data.model_dump()
    product_dict["farmer_id"] = str(user["_id"])
    product_dict["farmer_name"] = user["full_name"]
    product_dict["created_at"] = datetime.now(timezone.utc)
    product_dict["average_rating"] = 0.0
    product_dict["total_reviews"] = 0
    
    result = await products_collection.insert_one(product_dict)
    product = await products_collection.find_one({"_id": result.inserted_id})
    
    return {"message": "Product created successfully", "product": serialize_doc(product)}

@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    farmer_id: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    if category:
        query["category"] = category
    if farmer_id:
        query["farmer_id"] = farmer_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await products_collection.find(query).to_list(100)
    return [serialize_doc(p) for p in products]

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return serialize_doc(product)

@app.put("/api/products/{product_id}")
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    user=Depends(require_role(UserRole.FARMER, UserRole.ADMIN))
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check ownership (farmers can only update their own products)
    if user["role"] == UserRole.FARMER and str(product["farmer_id"]) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return {"message": "Product updated successfully", "product": serialize_doc(updated_product)}

@app.delete("/api/products/{product_id}")
async def delete_product(
    product_id: str,
    user=Depends(require_role(UserRole.FARMER, UserRole.ADMIN))
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if user["role"] == UserRole.FARMER and str(product["farmer_id"]) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    await products_collection.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted successfully"}

# ==================== CART ENDPOINTS ====================

@app.post("/api/cart/items")
async def add_to_cart(item: CartItemAdd, user=Depends(require_role(UserRole.CUSTOMER))):
    if not ObjectId.is_valid(item.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await products_collection.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["stock_quantity"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await carts_collection.find_one({"customer_id": str(user["_id"])})
    
    if not cart:
        cart = {
            "customer_id": str(user["_id"]),
            "items": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await carts_collection.insert_one(cart)
        cart["_id"] = result.inserted_id
    
    # Check if item already in cart
    item_exists = False
    for cart_item in cart["items"]:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] += item.quantity
            item_exists = True
            break
    
    if not item_exists:
        cart["items"].append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "price": product["price"],
            "unit": product["unit"],
            "quantity": item.quantity,
            "image_url": product.get("image_url")
        })
    
    await carts_collection.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc)}}
    )
    
    updated_cart = await carts_collection.find_one({"_id": cart["_id"]})
    return {"message": "Item added to cart", "cart": serialize_doc(updated_cart)}

@app.get("/api/cart")
async def get_cart(user=Depends(require_role(UserRole.CUSTOMER))):
    cart = await carts_collection.find_one({"customer_id": str(user["_id"])})
    if not cart:
        return {"items": [], "total": 0.0}
    
    total = sum(item["price"] * item["quantity"] for item in cart["items"])
    cart_data = serialize_doc(cart)
    cart_data["total"] = total
    return cart_data

@app.put("/api/cart/items/{product_id}")
async def update_cart_item(
    product_id: str,
    update_data: CartItemUpdate,
    user=Depends(require_role(UserRole.CUSTOMER))
):
    cart = await carts_collection.find_one({"customer_id": str(user["_id"])})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    item_found = False
    for item in cart["items"]:
        if item["product_id"] == product_id:
            item["quantity"] = update_data.quantity
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    await carts_collection.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc)}}
    )
    
    updated_cart = await carts_collection.find_one({"_id": cart["_id"]})
    return {"message": "Cart updated", "cart": serialize_doc(updated_cart)}

@app.delete("/api/cart/items/{product_id}")
async def remove_from_cart(product_id: str, user=Depends(require_role(UserRole.CUSTOMER))):
    cart = await carts_collection.find_one({"customer_id": str(user["_id"])})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    
    await carts_collection.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Item removed from cart"}

@app.delete("/api/cart")
async def clear_cart(user=Depends(require_role(UserRole.CUSTOMER))):
    await carts_collection.delete_one({"customer_id": str(user["_id"])})
    return {"message": "Cart cleared"}

# ==================== ORDER & PAYMENT ENDPOINTS ====================

@app.post("/api/orders/create")
async def create_order(
    order_data: OrderCreate,
    request: Request,
    user=Depends(require_role(UserRole.CUSTOMER))
):
    cart = await carts_collection.find_one({"customer_id": str(user["_id"])})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total_amount = sum(item["price"] * item["quantity"] for item in cart["items"])
    
    order = {
        "customer_id": str(user["_id"]),
        "customer_name": user["full_name"],
        "customer_email": user["email"],
        "items": cart["items"],
        "total_amount": total_amount,
        "delivery_address": order_data.delivery_address,
        "phone": order_data.phone,
        "notes": order_data.notes,
        "status": "pending",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await orders_collection.insert_one(order)
    order_id = str(result.inserted_id)
    
    # Create Stripe checkout session
    host_url = str(request.base_url).rstrip('/')
    success_url = f"{host_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}"
    cancel_url = f"{host_url}/payment-cancelled"
    
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total_amount),
        currency="inr",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "customer_id": str(user["_id"]),
            "customer_email": user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_transaction = {
        "order_id": order_id,
        "customer_id": str(user["_id"]),
        "session_id": session.session_id,
        "amount": total_amount,
        "currency": "inr",
        "payment_status": "pending",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await payment_transactions_collection.insert_one(payment_transaction)
    
    # Update order with session ID
    await orders_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {
        "message": "Order created successfully",
        "order_id": order_id,
        "checkout_url": session.url,
        "session_id": session.session_id
    }

@app.get("/api/orders/payment-status/{session_id}")
async def check_payment_status(
    session_id: str,
    user=Depends(require_role(UserRole.CUSTOMER))
):
    # Get payment transaction
    transaction = await payment_transactions_collection.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    
    # Check if already processed
    if transaction["payment_status"] == "paid":
        order = await orders_collection.find_one({"_id": ObjectId(transaction["order_id"])})
        return {
            "status": "completed",
            "payment_status": "paid",
            "order": serialize_doc(order)
        }
    
    # Poll Stripe for status
    webhook_url = f"{str(os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001'))}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        await payment_transactions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": checkout_status.payment_status,
                    "status": checkout_status.status,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # If payment successful, update order and clear cart
        if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
            order_id = transaction["order_id"]
            await orders_collection.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {
                        "payment_status": "completed",
                        "status": "processing",
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Clear customer cart
            await carts_collection.delete_one({"customer_id": transaction["customer_id"]})
            
            # Update product stock
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
            for item in order["items"]:
                await products_collection.update_one(
                    {"_id": ObjectId(item["product_id"])},
                    {"$inc": {"stock_quantity": -item["quantity"]}}
                )
        
        order = await orders_collection.find_one({"_id": ObjectId(transaction["order_id"])})
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "order": serialize_doc(order)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking payment status: {str(e)}")

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update payment transaction
        if webhook_response.session_id:
            await payment_transactions_collection.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": webhook_response.payment_status,
                        "status": webhook_response.event_type,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/orders")
async def get_orders(user=Depends(get_current_user)):
    query = {}
    if user["role"] == UserRole.CUSTOMER:
        query["customer_id"] = str(user["_id"])
    elif user["role"] == UserRole.FARMER:
        # Get orders containing farmer's products
        farmer_products = await products_collection.find(
            {"farmer_id": str(user["_id"])}
        ).to_list(100)
        product_ids = [str(p["_id"]) for p in farmer_products]
        query["items.product_id"] = {"$in": product_ids}
    # Admin sees all orders
    
    orders = await orders_collection.find(query).sort("created_at", -1).to_list(100)
    return [serialize_doc(o) for o in orders]

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access permissions
    if user["role"] == UserRole.CUSTOMER and order["customer_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    
    return serialize_doc(order)

@app.put("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    user=Depends(require_role(UserRole.ADMIN, UserRole.FARMER))
):
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="Invalid order ID")
    
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
    return {"message": "Order status updated", "order": serialize_doc(updated_order)}

# ==================== REVIEW ENDPOINTS ====================

@app.post("/api/reviews", status_code=201)
async def create_review(
    review_data: ReviewCreate,
    user=Depends(require_role(UserRole.CUSTOMER))
):
    if not ObjectId.is_valid(review_data.product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    product = await products_collection.find_one({"_id": ObjectId(review_data.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user has ordered this product
    order = await orders_collection.find_one({
        "customer_id": str(user["_id"]),
        "items.product_id": review_data.product_id,
        "payment_status": "completed"
    })
    
    if not order:
        raise HTTPException(status_code=400, detail="You can only review products you've purchased")
    
    # Check if already reviewed
    existing_review = await reviews_collection.find_one({
        "product_id": review_data.product_id,
        "customer_id": str(user["_id"])
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You've already reviewed this product")
    
    review = {
        "product_id": review_data.product_id,
        "customer_id": str(user["_id"]),
        "customer_name": user["full_name"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await reviews_collection.insert_one(review)
    
    # Update product rating
    reviews = await reviews_collection.find({"product_id": review_data.product_id}).to_list(100)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await products_collection.update_one(
        {"_id": ObjectId(review_data.product_id)},
        {"$set": {"average_rating": avg_rating, "total_reviews": len(reviews)}}
    )
    
    created_review = await reviews_collection.find_one({"_id": result.inserted_id})
    return {"message": "Review added successfully", "review": serialize_doc(created_review)}

@app.get("/api/reviews/product/{product_id}")
async def get_product_reviews(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    reviews = await reviews_collection.find({"product_id": product_id}).sort("created_at", -1).to_list(50)
    return [serialize_doc(r) for r in reviews]

# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/users")
async def get_all_users(user=Depends(require_role(UserRole.ADMIN))):
    users = await users_collection.find({}, {"password": 0}).to_list(100)
    return [serialize_doc(u) for u in users]

@app.get("/api/admin/stats")
async def get_admin_stats(user=Depends(require_role(UserRole.ADMIN))):
    total_users = await users_collection.count_documents({})
    total_products = await products_collection.count_documents({})
    total_orders = await orders_collection.count_documents({})
    completed_orders = await orders_collection.count_documents({"payment_status": "completed"})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await orders_collection.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue
    }

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Organic Marketplace API"}

@app.get("/")
async def root():
    return {"message": "Organic Marketplace API - Visit /docs for API documentation"}
