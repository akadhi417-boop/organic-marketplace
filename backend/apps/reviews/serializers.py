from rest_framework import serializers
from .models import Review

class ReviewCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    customer_id = serializers.IntegerField(source='customer.id', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product_id', 'customer_id', 'customer_name', 'rating', 'comment', 'created_at']
