from django.urls import path
from .views import create_order, orders_list, order_detail, update_order_status, payment_status

urlpatterns = [
    path('', orders_list),
    path('create', create_order),
    path('payment-status/<str:session_id>', payment_status),
    path('<int:order_id>', order_detail),
    path('<int:order_id>/status', update_order_status),
]
