from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.users.permissions import IsCustomer
from apps.products.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemActionSerializer, CartUpdateSerializer

def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(customer=user)
    return cart

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated, IsCustomer])
def cart_root(request):
    if request.method == 'GET':
        try:
            cart = Cart.objects.prefetch_related('items__product').get(customer=request.user)
            return Response(CartSerializer(cart).data)
        except Cart.DoesNotExist:
            return Response({'items': [], 'total': 0.0})

    Cart.objects.filter(customer=request.user).delete()
    return Response({'message': 'Cart cleared'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomer])
def add_item(request):
    serializer = CartItemActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product_id = serializer.validated_data['product_id']
    quantity = serializer.validated_data['quantity']
    try:
        product = Product.objects.get(pk=int(product_id))
    except (Product.DoesNotExist, TypeError, ValueError):
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    if product.stock_quantity < quantity:
        return Response({'detail': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_or_create_cart(request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': quantity})
    if not created:
        new_qty = item.quantity + quantity
        if product.stock_quantity < new_qty:
            return Response({'detail': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = new_qty
        item.save(update_fields=['quantity'])
    cart = Cart.objects.prefetch_related('items__product').get(pk=cart.pk)
    return Response({'message': 'Item added to cart', 'cart': CartSerializer(cart).data})

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsCustomer])
def item_detail(request, product_id):
    try:
        cart = Cart.objects.get(customer=request.user)
        item = CartItem.objects.get(cart=cart, product_id=product_id)
    except (Cart.DoesNotExist, CartItem.DoesNotExist):
        return Response({'detail': 'Item not in cart'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = CartUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']
        if item.product.stock_quantity < quantity:
            return Response({'detail': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = quantity
        item.save(update_fields=['quantity'])
        cart = Cart.objects.prefetch_related('items__product').get(pk=cart.pk)
        return Response({'message': 'Cart updated', 'cart': CartSerializer(cart).data})

    item.delete()
    return Response({'message': 'Item removed from cart'})
