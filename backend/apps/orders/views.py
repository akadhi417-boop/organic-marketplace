import uuid
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.users.permissions import IsCustomer, IsFarmerOrAdmin
from apps.carts.models import Cart
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderSerializer


def frontend_base_url(request):
    origin = request.headers.get('Origin')
    if origin:
        return origin.rstrip('/')
    referer = request.headers.get('Referer')
    if referer:
        parts = referer.split('/')
        if len(parts) >= 3:
            return '/'.join(parts[:3])
    return settings.FRONTEND_URL


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCustomer])
def create_order(request):
    serializer = OrderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        cart = Cart.objects.prefetch_related('items__product__farmer').get(customer=request.user)
    except Cart.DoesNotExist:
        return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
    if not cart.items.exists():
        return Response({'detail': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        total = Decimal('0.00')
        for item in cart.items.select_related('product').all():
            if item.product.stock_quantity < item.quantity:
                return Response({'detail': f'Insufficient stock for {item.product.name}'}, status=status.HTTP_400_BAD_REQUEST)
            total += item.product.price * item.quantity

        session_id = f'sim_{uuid.uuid4().hex}'
        order = Order.objects.create(
            customer=request.user,
            customer_name=request.user.full_name,
            customer_email=request.user.email,
            total_amount=total,
            delivery_address=serializer.validated_data['delivery_address'],
            phone=serializer.validated_data['phone'],
            notes=serializer.validated_data.get('notes') or '',
            status='pending',
            payment_status='pending',
            payment_session_id=session_id,
        )

        for item in cart.items.select_related('product__farmer').all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_id_str=str(item.product.id),
                farmer_id=str(item.product.farmer_id),
                farmer_name=item.product.farmer.full_name,
                price=item.product.price,
                quantity=item.quantity,
                unit=item.product.unit,
                subtotal=item.product.price * item.quantity,
            )

    checkout_url = f"{frontend_base_url(request)}/payment-success?session_id={session_id}&order_id={order.id}"
    return Response({
        'message': 'Order created successfully',
        'order_id': order.id,
        'checkout_url': checkout_url,
        'session_id': session_id,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orders_list(request):
    orders = Order.objects.prefetch_related('items').all()
    if request.user.role == 'customer':
        orders = orders.filter(customer=request.user)
    elif request.user.role == 'farmer':
        orders = orders.filter(items__farmer_id=str(request.user.id)).distinct()
    return Response(OrderSerializer(orders, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role == 'customer' and order.customer_id != request.user.id:
        return Response({'detail': 'Not authorized to view this order'}, status=status.HTTP_403_FORBIDDEN)
    return Response(OrderSerializer(order).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsFarmerOrAdmin])
def update_order_status(request, order_id):
    status_value = request.GET.get('status')
    if status_value not in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role == 'farmer' and not order.items.filter(farmer_id=str(request.user.id)).exists():
        return Response({'detail': 'Not authorized to update this order'}, status=status.HTTP_403_FORBIDDEN)
    order.status = status_value
    order.save(update_fields=['status', 'updated_at'])
    return Response({'message': 'Order status updated', 'order': OrderSerializer(order).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCustomer])
def payment_status(request, session_id):
    try:
        order = Order.objects.prefetch_related('items__product').get(payment_session_id=session_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Payment transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_status == 'pending':
        with transaction.atomic():
            for item in order.items.select_related('product').all():
                if item.product and item.product.stock_quantity >= item.quantity:
                    item.product.stock_quantity -= item.quantity
                    item.product.save(update_fields=['stock_quantity'])
            order.payment_status = 'paid'
            order.status = 'processing'
            order.save(update_fields=['payment_status', 'status', 'updated_at'])
            Cart.objects.filter(customer=request.user).delete()

    return Response({
        'status': 'completed',
        'payment_status': order.payment_status,
        'order': OrderSerializer(order).data,
    })
