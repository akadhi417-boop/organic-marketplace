from django.urls import path
from .admin_views import users_list, stats

urlpatterns = [
    path('users', users_list),
    path('stats', stats),
]
