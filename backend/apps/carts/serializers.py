from rest_framework import serializers
from .models import Cart, CartItem

class CartItemActionSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class CartUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True, coerce_to_string=False)
    unit = serializers.CharField(source='product.unit', read_only=True)
    image_url = serializers.CharField(source='product.image_url', read_only=True)

    class Meta:
        model = CartItem
        fields = ['product_id', 'product_name', 'price', 'unit', 'quantity', 'image_url']

class CartSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'created_at', 'updated_at']

    def get_total(self, obj):
        return float(sum(item.product.price * item.quantity for item in obj.items.select_related('product').all()))
