import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { MapPin, Phone, CreditCard } from 'lucide-react';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    delivery_address: user?.address || '',
    phone: user?.phone || '',
    notes: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/api/cart');
      if (!response.data.items || response.data.items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/dashboard');
        return;
      }
      setCart(response.data);
    } catch (error) {
      toast.error('Failed to load cart');
      navigate('/cart');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/orders/create', formData);
      const { checkout_url, session_id } = response.data;
      
      // Redirect to Stripe checkout
      window.location.href = checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
      setLoading(false);
    }
  };

  if (!cart) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-12 px-6" data-testid="checkout-page">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-moss mb-8" data-testid="checkout-title">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
              <h2 className="font-heading text-2xl font-bold text-moss mb-6">Delivery Information</h2>
              
              <form onSubmit={handleSubmit} data-testid="checkout-form">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="delivery_address" className="text-moss font-medium">Delivery Address *</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <Input
                        id="delivery_address"
                        type="text"
                        placeholder="Enter your full delivery address"
                        value={formData.delivery_address}
                        onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                        required
                        className="pl-10 h-12 rounded-lg"
                        data-testid="delivery-address-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-moss font-medium">Phone Number *</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="pl-10 h-12 rounded-lg"
                        data-testid="phone-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-moss font-medium">Delivery Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions for delivery..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={4}
                      className="mt-2 rounded-lg"
                      data-testid="notes-input"
                    />
                  </div>

                  <div className="pt-6 border-t border-[#E5E0D8]">
                    <div className="bg-bone p-4 rounded-lg mb-6">
                      <div className="flex items-center gap-3 text-moss">
                        <CreditCard className="w-6 h-6" />
                        <p className="font-medium">You'll be redirected to Stripe for secure payment</p>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-moss hover:bg-moss/90 text-white rounded-full py-6 text-lg btn-primary"
                      data-testid="place-order-button"
                    >
                      {loading ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6 sticky top-6">
              <h2 className="font-heading text-2xl font-bold text-moss mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-muted">{item.product_name} x {item.quantity}</span>
                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 mb-6 pb-6 border-t border-b border-[#E5E0D8] pt-6">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">₹{cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-3xl font-bold text-moss" data-testid="checkout-total">₹{cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}