import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Leaf, Users, ShoppingBag, Package, DollarSign, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/products'),
        api.get('/api/orders')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, null, { params: { status: newStatus } });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-moss" />
            <span className="font-heading text-2xl font-bold text-moss">OrganicMarket Admin</span>
          </div>
          <Button variant="ghost" onClick={logout} data-testid="logout-button">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="bg-moss text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3" data-testid="welcome-message">
            Admin Dashboard
          </h1>
          <p className="text-xl text-white/90">Manage your marketplace platform</p>
        </div>
      </section>

      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-moss" />
              </div>
              <p className="text-muted text-sm mb-2">Total Users</p>
              <p className="font-heading text-4xl font-bold text-moss" data-testid="stat-users">{stats?.total_users || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-10 h-10 text-terracotta" />
              </div>
              <p className="text-muted text-sm mb-2">Total Products</p>
              <p className="font-heading text-4xl font-bold text-moss" data-testid="stat-products">{stats?.total_products || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-10 h-10 text-moss" />
              </div>
              <p className="text-muted text-sm mb-2">Total Orders</p>
              <p className="font-heading text-4xl font-bold text-moss" data-testid="stat-orders">{stats?.total_orders || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-10 h-10 text-terracotta" />
              </div>
              <p className="text-muted text-sm mb-2">Total Revenue</p>
              <p className="font-heading text-4xl font-bold text-moss" data-testid="stat-revenue">₹{stats?.total_revenue.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Users Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8 mb-8">
            <h2 className="font-heading text-3xl font-bold text-moss mb-6">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E0D8]">
                    <th className="text-left py-3 px-4 font-semibold text-moss">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-moss">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-moss">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-moss">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#E5E0D8] last:border-0" data-testid={`user-${user.id}`}>
                      <td className="py-3 px-4">{user.full_name}</td>
                      <td className="py-3 px-4 text-muted">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'farmer' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-3xl font-bold text-moss">Recent Orders</h2>
              <Button onClick={() => navigate('/orders')} variant="outline" data-testid="view-all-orders-button">
                View All Orders
              </Button>
            </div>
            <div className="space-y-4">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="border border-[#E5E0D8] rounded-xl p-6" data-testid={`order-${order.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono font-semibold text-moss mb-1">{order.id}</p>
                      <p className="text-sm text-muted">{order.customer_name} • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-heading text-2xl font-bold text-moss">₹{order.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="border border-[#E5E0D8] rounded-lg px-4 py-2 font-medium"
                        data-testid={`order-status-${order.id}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
                    <p className="text-sm text-muted mb-2">Items: {order.items.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs bg-moss/5 text-moss px-3 py-1 rounded-full">
                          {item.product_name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
