from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.users.permissions import IsFarmerOrAdmin
from .models import Product
from .serializers import ProductSerializer

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def products_view(request):
    if request.method == 'GET':
        products = Product.objects.select_related('farmer').all()
        category = request.GET.get('category')
        farmer_id = request.GET.get('farmer_id')
        search = request.GET.get('search')
        if category:
            products = products.filter(category=category)
        if farmer_id:
            products = products.filter(farmer_id=farmer_id)
        if search:
            products = products.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return Response(ProductSerializer(products, many=True).data)

    if not request.user.is_authenticated or request.user.role not in ['farmer', 'admin']:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product = Product.objects.create(farmer=request.user, **serializer.validated_data)
    return Response({'message': 'Product created successfully', 'product': ProductSerializer(product).data}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def product_detail_view(request, product_id):
    try:
        product = Product.objects.select_related('farmer').get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductSerializer(product).data)

    if not request.user.is_authenticated or request.user.role not in ['farmer', 'admin']:
        return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.user.role == 'farmer' and product.farmer_id != request.user.id:
        return Response({'detail': 'Not authorized to modify this product'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Product updated successfully', 'product': ProductSerializer(product).data})

    product.delete()
    return Response({'message': 'Product deleted successfully'})
