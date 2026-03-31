from django.urls import path
from .views import products_view, product_detail_view

urlpatterns = [
    path('', products_view),
    path('<int:product_id>', product_detail_view),
]
