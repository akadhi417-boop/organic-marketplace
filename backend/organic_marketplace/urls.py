from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.products.views import products_view
from apps.carts.views import cart_root
from apps.orders.views import orders_list
from apps.reviews.views import create_review
from apps.users.admin_views import users_list, stats


@api_view(['GET'])
def root_view(request):
    return Response({'message': 'Organic Marketplace Django API is running'})


@api_view(['GET'])
def health_view(request):
    return Response({'status': 'healthy', 'service': 'Organic Marketplace Django API'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', root_view),
    path('api/health', health_view),

    # Compatibility aliases for collection endpoints without trailing slashes.
    path('api/products', products_view),
    path('api/cart', cart_root),
    path('api/orders', orders_list),
    path('api/reviews', create_review),
    path('api/admin/users', users_list),
    path('api/admin/users/', users_list),
    path('api/admin/stats', stats),
    path('api/admin/stats/', stats),

    path('api/auth/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/cart/', include('apps.carts.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/admin/', include('apps.users.admin_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
