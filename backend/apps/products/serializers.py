from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    farmer_id = serializers.IntegerField(source='farmer.id', read_only=True)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'price', 'unit', 'stock_quantity',
            'image_url', 'organic_certified', 'farmer_id', 'farmer_name',
            'average_rating', 'total_reviews', 'created_at'
        ]
