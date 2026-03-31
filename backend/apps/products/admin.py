from django.contrib import admin
from .models import Product
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock_quantity', 'farmer', 'organic_certified')
    list_filter = ('category', 'organic_certified')
    search_fields = ('name', 'description', 'farmer__full_name')
