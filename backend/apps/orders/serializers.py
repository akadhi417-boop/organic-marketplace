from rest_framework import serializers
from .models import Order, OrderItem

class OrderCreateSerializer(serializers.Serializer):
    delivery_address = serializers.CharField()
    phone = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source='product_id_str', read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_name', 'farmer_id', 'farmer_name', 'price', 'quantity', 'unit', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'items', 'total_amount', 'delivery_address', 'phone',
            'notes', 'status', 'payment_status', 'payment_session_id', 'created_at', 'updated_at'
        ]
