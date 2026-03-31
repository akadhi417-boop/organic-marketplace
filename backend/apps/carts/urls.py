from django.urls import path
from .views import cart_root, add_item, item_detail

urlpatterns = [
    path('', cart_root),
    path('items', add_item),
    path('items/<int:product_id>', item_detail),
]
