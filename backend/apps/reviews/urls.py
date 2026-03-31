from django.urls import path
from .views import create_review, product_reviews

urlpatterns = [
    path('', create_review),
    path('product/<int:product_id>', product_reviews),
]
