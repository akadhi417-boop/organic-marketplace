from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdmin
from .models import User
from apps.products.models import Product
from apps.orders.models import Order
from .serializers import UserSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def users_list(request):
    users = User.objects.order_by('-created_at')
    return Response(UserSerializer(users, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def stats(request):
    total_users = User.objects.count()
    total_products = Product.objects.count()
    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(payment_status__in=['paid', 'completed']).count()
    total_revenue = Order.objects.filter(payment_status__in=['paid', 'completed']).aggregate(total=Sum('total_amount'))['total'] or 0
    return Response({
        'total_users': total_users,
        'total_products': total_products,
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'total_revenue': float(total_revenue),
    })
