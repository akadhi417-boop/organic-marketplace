from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.users.permissions import IsCustomer
from apps.products.models import Product
from apps.orders.models import Order
from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer

def update_product_rating(product):
    stats = product.reviews.aggregate(avg=Avg('rating'), total=Count('id'))
    product.average_rating = float(stats['avg'] or 0.0)
    product.total_reviews = stats['total'] or 0
    product.save(update_fields=['average_rating', 'total_reviews'])

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomer])
def create_review(request):
    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        product = Product.objects.get(pk=serializer.validated_data['product_id'])
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    has_purchased = Order.objects.filter(
        customer=request.user,
        items__product=product,
        payment_status__in=['paid', 'completed']
    ).exists()
    if not has_purchased:
        return Response({'detail': "You can only review products you've purchased"}, status=status.HTTP_400_BAD_REQUEST)

    if Review.objects.filter(product=product, customer=request.user).exists():
        return Response({'detail': "You've already reviewed this product"}, status=status.HTTP_400_BAD_REQUEST)

    review = Review.objects.create(
        product=product,
        customer=request.user,
        customer_name=request.user.full_name,
        rating=serializer.validated_data['rating'],
        comment=serializer.validated_data.get('comment') or '',
    )
    update_product_rating(product)
    return Response({'message': 'Review added successfully', 'review': ReviewSerializer(review).data}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def product_reviews(request, product_id):
    reviews = Review.objects.filter(product_id=product_id).select_related('customer')
    return Response(ReviewSerializer(reviews, many=True).data)
