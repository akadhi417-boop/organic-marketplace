import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Leaf, Package, ArrowLeft } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen" data-testid="orders-page">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={user.role === 'customer' ? '/dashboard' : user.role === 'farmer' ? '/farmer' : '/admin'} className="flex items-center gap-2 text-moss hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-10 h-10 text-moss" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-moss" data-testid="orders-title">
              {user.role === 'customer' ? 'My Orders' : 'Orders'}
            </h1>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-12 text-center" data-testid="no-orders">
              <Package className="w-24 h-24 text-moss/20 mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-semibold text-moss mb-4">No orders yet</h2>
              <p className="text-muted mb-6">Start shopping for organic produce!</p>
              {user.role === 'customer' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-moss hover:bg-moss/90 text-white rounded-full px-8"
                >
                  Start Shopping
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6"
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted mb-1">Order ID</p>
                      <p className="font-mono font-semibold text-moss">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Date</p>
                      <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Total</p>
                      <p className="font-heading text-2xl font-bold text-moss">₹{order.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Status</p>
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E0D8] pt-6">
                    <h3 className="font-semibold text-moss mb-4">Items</h3>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-moss/5 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Leaf className="w-6 h-6 text-moss/30" />
                            </div>
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {user.role === 'customer' && (
                    <div className="border-t border-[#E5E0D8] pt-6 mt-6">
                      <p className="text-sm text-muted mb-1">Delivery Address</p>
                      <p className="font-medium">{order.delivery_address}</p>
                      <p className="text-sm text-muted mt-2">Phone: {order.phone}</p>
                      {order.notes && (
                        <p className="text-sm text-muted mt-2">Notes: {order.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}