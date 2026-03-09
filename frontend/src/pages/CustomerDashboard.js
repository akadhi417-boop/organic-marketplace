import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Leaf, ShoppingCart, LogOut, Search, Star, Package } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.get('/api/products', { params });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const addToCart = async (productId) => {
    try {
      await api.post('/api/cart/items', { product_id: productId, quantity: 1 });
      toast.success('Added to cart!');
      fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const cartItemCount = cart?.items?.length || 0;

  return (
    <div className="min-h-screen" data-testid="customer-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-moss" />
            <span className="font-heading text-2xl font-bold text-moss">OrganicMarket</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2"
              data-testid="orders-button"
            >
              <Package className="w-5 h-5" />
              Orders
            </Button>
            <Button
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 bg-moss hover:bg-moss/90 text-white rounded-full px-6"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart ({cartItemCount})
            </Button>
            <Button variant="ghost" onClick={logout} data-testid="logout-button">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-moss text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3" data-testid="welcome-message">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xl text-white/90">Discover fresh organic produce from local farmers</p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="bg-white border-b border-[#E5E0D8] py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-lg"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="bg-moss hover:bg-moss/90 text-white rounded-lg px-8" data-testid="search-button">
              Search
            </Button>
          </form>
          
          <div className="flex gap-3">
            <Button
              variant={categoryFilter === '' ? 'default' : 'outline'}
              onClick={() => setCategoryFilter('')}
              className={categoryFilter === '' ? 'bg-moss hover:bg-moss/90 text-white' : ''}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              variant={categoryFilter === 'fruits' ? 'default' : 'outline'}
              onClick={() => setCategoryFilter('fruits')}
              className={categoryFilter === 'fruits' ? 'bg-moss hover:bg-moss/90 text-white' : ''}
              data-testid="filter-fruits"
            >
              Fruits
            </Button>
            <Button
              variant={categoryFilter === 'vegetables' ? 'default' : 'outline'}
              onClick={() => setCategoryFilter('vegetables')}
              className={categoryFilter === 'vegetables' ? 'bg-moss hover:bg-moss/90 text-white' : ''}
              data-testid="filter-vegetables"
            >
              Vegetables
            </Button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12" data-testid="no-products">
              <p className="text-muted text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] overflow-hidden product-card-hover"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-moss/5">
                        <Leaf className="w-16 h-16 text-moss/20" />
                      </div>
                    )}
                    {product.organic_certified && (
                      <div className="absolute top-3 left-3 bg-moss text-white px-3 py-1 rounded-full text-xs font-accent font-semibold organic-badge">
                        Certified Organic
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-heading text-xl font-semibold text-moss mb-1">{product.name}</h3>
                    <p className="text-sm text-muted mb-2">by {product.farmer_name}</p>
                    
                    {product.total_reviews > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.average_rating.toFixed(1)}</span>
                        <span className="text-sm text-muted">({product.total_reviews})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-moss">₹{product.price.toFixed(2)}</span>
                        <span className="text-muted text-sm">/{product.unit}</span>
                      </div>
                      {product.stock_quantity > 0 ? (
                        <span className="text-sm text-green-600 font-medium">In Stock</span>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/product/${product.id}`)}
                        variant="outline"
                        className="flex-1 rounded-lg"
                        data-testid={`view-product-${product.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock_quantity === 0}
                        className="flex-1 bg-moss hover:bg-moss/90 text-white rounded-lg"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}