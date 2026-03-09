import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Leaf, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      setCart(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await api.put(`/api/cart/items/${productId}`, { quantity: newQuantity });
      fetchCart();
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/api/cart/items/${productId}`);
      toast.success('Item removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (!cart?.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const total = cart?.total || 0;
  const itemCount = cart?.items?.length || 0;

  return (
    <div className="min-h-screen" data-testid="cart-page">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-moss hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>
      </header>

      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-moss mb-8" data-testid="cart-title">
            Your Cart
          </h1>

          {itemCount === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-12 text-center" data-testid="empty-cart">
              <Leaf className="w-24 h-24 text-moss/20 mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-semibold text-moss mb-4">Your cart is empty</h2>
              <p className="text-muted mb-6">Start adding some organic goodness!</p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-moss hover:bg-moss/90 text-white rounded-full px-8"
                data-testid="shop-now-button"
              >
                Shop Now
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6 flex gap-6"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <div className="w-24 h-24 bg-moss/5 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-12 h-12 text-moss/20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-semibold text-moss mb-1">{item.product_name}</h3>
                      <p className="text-muted mb-3">₹{item.price.toFixed(2)} per {item.unit}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border border-[#E5E0D8] rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-2 hover:bg-moss/5 rounded-l-lg"
                            data-testid={`decrease-quantity-${item.product_id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-medium" data-testid={`quantity-${item.product_id}`}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="p-2 hover:bg-moss/5 rounded-r-lg"
                            data-testid={`increase-quantity-${item.product_id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-2"
                          data-testid={`remove-item-${item.product_id}`}
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-heading text-2xl font-bold text-moss" data-testid={`item-total-${item.product_id}`}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6 sticky top-6">
                  <h2 className="font-heading text-2xl font-bold text-moss mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b border-[#E5E0D8]">
                    <div className="flex justify-between">
                      <span className="text-muted">Subtotal ({itemCount} items)</span>
                      <span className="font-medium">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Delivery</span>
                      <span className="font-medium text-green-600">FREE</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-6">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-moss" data-testid="cart-total">₹{total.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-moss hover:bg-moss/90 text-white rounded-full py-6 text-lg btn-primary"
                    data-testid="checkout-button"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}