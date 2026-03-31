import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { Leaf, Plus, Edit, Trash2, Package, LogOut } from 'lucide-react';

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'vegetables',
    price: '',
    unit: 'kg',
    stock_quantity: '',
    image_url: '',
    organic_certified: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/', {
        params: { farmer_id: user?.id },
      });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load products:', error?.response?.data || error.message);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error?.response?.data || error.message);
      setOrders([]);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      category: 'vegetables',
      price: '',
      unit: 'kg',
      stock_quantity: '',
      image_url: '',
      organic_certified: true,
    });
    setEditingProduct(null);
  };

  const normalizePayload = () => ({
    name: productForm.name.trim(),
    description: productForm.description.trim(),
    category: String(productForm.category).toLowerCase(),
    price: Number(productForm.price),
    unit: productForm.unit,
    stock_quantity: Number(productForm.stock_quantity),
    image_url: productForm.image_url?.trim() || '',
    organic_certified: Boolean(productForm.organic_certified),
  });

  const validateForm = () => {
    const payload = normalizePayload();

    if (!payload.name) {
      toast.error('Product name is required');
      return false;
    }
    if (!payload.description) {
      toast.error('Description is required');
      return false;
    }
    if (!payload.category) {
      toast.error('Category is required');
      return false;
    }
    if (!payload.unit) {
      toast.error('Unit is required');
      return false;
    }
    if (Number.isNaN(payload.price) || payload.price <= 0) {
      toast.error('Enter a valid price');
      return false;
    }
    if (Number.isNaN(payload.stock_quantity) || payload.stock_quantity < 0) {
      toast.error('Enter a valid stock quantity');
      return false;
    }

    return true;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = normalizePayload();
      await api.post('/api/products/', payload);

      toast.success('Product added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Add product error:', error?.response?.data || error.message);
      const errorData = error?.response?.data;
      let message = 'Failed to add product';

      if (typeof errorData === 'string') {
        message = 'Server error while adding product';
      } else if (errorData?.detail) {
        message = errorData.detail;
      } else if (typeof errorData === 'object' && errorData !== null) {
        message = Object.values(errorData).flat().join(', ');
      }

      toast.error(message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = normalizePayload();
      await api.put(`/api/products/${editingProduct}`, payload);

      toast.success('Product updated successfully!');
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Update product error:', error?.response?.data || error.message);
      const errorData = error?.response?.data;
      let message = 'Failed to update product';

      if (errorData?.detail) {
        message = errorData.detail;
      } else if (typeof errorData === 'object' && errorData !== null) {
        message = Object.values(errorData).flat().join(', ');
      }

      toast.error(message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/api/products/${productId}`);
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Delete product error:', error?.response?.data || error.message);
      toast.error(error?.response?.data?.detail || 'Failed to delete product');
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      category: String(product.category || 'vegetables').toLowerCase(),
      price: String(product.price ?? ''),
      unit: product.unit || 'kg',
      stock_quantity: String(product.stock_quantity ?? ''),
      image_url: product.image_url || '',
      organic_certified: Boolean(product.organic_certified),
    });
    setIsAddDialogOpen(true);
  };

  const completedRevenue = Array.isArray(orders)
    ? orders
        .filter((o) => o?.payment_status === 'completed')
        .reduce((sum, o) => sum + Number(o?.total_amount ?? 0), 0)
    : 0;

  const placeholderImage =
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="min-h-screen" data-testid="farmer-dashboard">
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-moss" />
            <span className="font-heading text-2xl font-bold text-moss">
              OrganicMarket
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/orders')}
              data-testid="orders-button"
            >
              <Package className="w-5 h-5 mr-2" />
              Orders
            </Button>

            <Button
              variant="ghost"
              onClick={logout}
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-moss text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1
            className="font-heading text-4xl md:text-5xl font-bold mb-3"
            data-testid="welcome-message"
          >
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-xl text-white/90">
            Manage your organic products and orders
          </p>
        </div>
      </section>

      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <p className="text-muted text-sm mb-2">Total Products</p>
              <p
                className="font-heading text-4xl font-bold text-moss"
                data-testid="total-products"
              >
                {products.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <p className="text-muted text-sm mb-2">Total Orders</p>
              <p
                className="font-heading text-4xl font-bold text-moss"
                data-testid="total-orders"
              >
                {orders.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-6">
              <p className="text-muted text-sm mb-2">Revenue</p>
              <p
                className="font-heading text-4xl font-bold text-moss"
                data-testid="total-revenue"
              >
                ₹{completedRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-3xl font-bold text-moss">
                My Products
              </h2>

              <Dialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-moss hover:bg-moss/90 text-white rounded-full px-6"
                    data-testid="add-product-button"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl text-moss">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>

                  <form
                    onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
                    className="space-y-4"
                    data-testid="add-product-form"
                  >
                    <div>
                      <Label>Product Name *</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        required
                        data-testid="product-name-input"
                      />
                    </div>

                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        required
                        rows={3}
                        data-testid="product-description-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category *</Label>
                        <Select
                          value={productForm.category}
                          onValueChange={(value) =>
                            setProductForm({
                              ...productForm,
                              category: value,
                            })
                          }
                        >
                          <SelectTrigger data-testid="product-category-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fruits">Fruits</SelectItem>
                            <SelectItem value="vegetables">Vegetables</SelectItem>
                            <SelectItem value="dairy">Dairy</SelectItem>
                            <SelectItem value="grains">Grains</SelectItem>
                            <SelectItem value="herbs">Herbs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Unit *</Label>
                        <Select
                          value={productForm.unit}
                          onValueChange={(value) =>
                            setProductForm({
                              ...productForm,
                              unit: value,
                            })
                          }
                        >
                          <SelectTrigger data-testid="product-unit-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="piece">piece</SelectItem>
                            <SelectItem value="dozen">dozen</SelectItem>
                            <SelectItem value="bunch">bunch</SelectItem>
                            <SelectItem value="pack">pack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (INR) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: e.target.value,
                            })
                          }
                          required
                          data-testid="product-price-input"
                        />
                      </div>

                      <div>
                        <Label>Stock Quantity *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={productForm.stock_quantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              stock_quantity: e.target.value,
                            })
                          }
                          required
                          data-testid="product-stock-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Image URL (Optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={productForm.image_url}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            image_url: e.target.value,
                          })
                        }
                        data-testid="product-image-input"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="flex-1 bg-moss hover:bg-moss/90 text-white"
                        data-testid="submit-product-button"
                      >
                        {editingProduct ? 'Save Changes' : 'Add Product'}
                      </Button>

                      {editingProduct && (
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            resetForm();
                            setIsAddDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12" data-testid="no-products">
                <p className="text-muted text-lg">
                  No products yet. Add your first product!
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="products-list">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-[#E5E0D8] rounded-xl p-6 flex items-center gap-6"
                    data-testid={`product-${product.id}`}
                  >
                    <div className="w-24 h-24 bg-moss/5 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product.image_url || placeholderImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = placeholderImage;
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-xl font-semibold text-moss mb-1">
                        {product.name}
                      </h3>

                      <p className="text-sm text-muted mb-2 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-muted">
                          Category:{' '}
                          <span className="font-medium text-foreground">
                            {product.category}
                          </span>
                        </span>

                        <span className="text-muted">
                          Price:{' '}
                          <span className="font-medium text-foreground">
                            ₹{Number(product?.price ?? 0).toFixed(2)}/{product.unit}
                          </span>
                        </span>

                        <span className="text-muted">
                          Stock:{' '}
                          <span className="font-medium text-foreground">
                            {product.stock_quantity}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(product)}
                        size="sm"
                        variant="outline"
                        data-testid={`edit-${product.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        onClick={() => handleDeleteProduct(product.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
