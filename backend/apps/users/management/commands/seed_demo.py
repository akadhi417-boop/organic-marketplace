from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.products.models import Product

class Command(BaseCommand):
    help = 'Seed demo users and products for Organic Marketplace'

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(email='admin@organicmarket.com', defaults={
            'full_name': 'Marketplace Admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True
        })
        admin.set_password('admin123')
        admin.save()

        farmer, _ = User.objects.get_or_create(email='farmer@organicmarket.com', defaults={
            'full_name': 'Green Farm', 'role': 'farmer', 'phone': '9876543210', 'address': 'Local Farm Road'
        })
        farmer.set_password('farmer123')
        farmer.save()

        customer, _ = User.objects.get_or_create(email='customer@organicmarket.com', defaults={
            'full_name': 'Demo Customer', 'role': 'customer', 'phone': '9999999999', 'address': 'Demo Address'
        })
        customer.set_password('customer123')
        customer.save()

        samples = [
            ('Organic Tomatoes', 'Fresh red tomatoes', 'vegetables', 60, 'kg', 40, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=1200&auto=format&fit=crop'),
            ('Farm Bananas', 'Sweet ripe bananas', 'fruits', 55, 'dozen', 25, 'https://images.unsplash.com/photo-1574226516831-e1dff420e37f?q=80&w=1200&auto=format&fit=crop'),
            ('Spinach Bundle', 'Fresh green spinach', 'vegetables', 30, 'bunch', 50, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=1200&auto=format&fit=crop'),
            ('Organic Apples', 'Crisp apples from the hills', 'fruits', 180, 'kg', 18, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=1200&auto=format&fit=crop'),
            ('Carrots', 'Crunchy orange carrots', 'vegetables', 45, 'kg', 35, 'https://images.unsplash.com/photo-1447175008436-054170c2e979?q=80&w=1200&auto=format&fit=crop'),
            ('Mangoes', 'Seasonal sweet mangoes', 'fruits', 220, 'kg', 15, 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=1200&auto=format&fit=crop'),
        ]
        for name, desc, cat, price, unit, stock, image in samples:
            Product.objects.get_or_create(
                farmer=farmer,
                name=name,
                defaults={
                    'description': desc,
                    'category': cat,
                    'price': price,
                    'unit': unit,
                    'stock_quantity': stock,
                    'image_url': image,
                    'organic_certified': True,
                }
            )
        self.stdout.write(self.style.SUCCESS('Demo data created.'))
