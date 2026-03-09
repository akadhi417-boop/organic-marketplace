import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Leaf, ShoppingCart, Star, ArrowLeft, Award } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/api/reviews/product/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews');
    }
  };

  const addToCart = async () => {
    try {
      await api.post('/api/cart/items', { product_id: id, quantity });
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (user.role !== 'customer') {
      toast.error('Only customers can leave reviews');
      return;
    }
    
    try {
      await api.post('/api/reviews', { product_id: id, rating, comment });
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      fetchReviews();
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!product) return null;

  return (
    <div className="min-h-screen" data-testid="product-detail">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 text-moss hover:underline">
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
          <Link to="/cart">
            <Button className="bg-moss hover:bg-moss/90 text-white rounded-full px-6">
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart
            </Button>
          </Link>
        </div>
      </header>

      {/* Product Details */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Product Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E5E0D8]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-moss/5">
                  <Leaf className="w-32 h-32 text-moss/20" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.organic_certified && (
                <div className="inline-flex items-center gap-2 bg-moss text-white px-4 py-2 rounded-full mb-4">
                  <Award className="w-5 h-5" />
                  <span className="font-accent font-semibold">Certified Organic</span>
                </div>
              )}
              
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-moss mb-3" data-testid="product-name">
                {product.name}
              </h1>
              
              <p className="text-lg text-muted mb-4">Sold by <span className="font-semibold text-moss">{product.farmer_name}</span></p>
              
              {product.total_reviews > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(product.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{product.average_rating.toFixed(1)}</span>
                  <span className="text-muted">({product.total_reviews} reviews)</span>
                </div>
              )}
              
              <div className="bg-bone p-6 rounded-xl mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-moss">₹{product.price.toFixed(2)}</span>
                  <span className="text-xl text-muted">per {product.unit}</span>
                </div>
                {product.stock_quantity > 0 ? (
                  <p className="text-green-600 font-medium">In Stock ({product.stock_quantity} available)</p>
                ) : (
                  <p className="text-red-600 font-medium">Out of Stock</p>
                )}
              </div>
              
              <p className="text-lg text-muted mb-6 leading-relaxed">{product.description}</p>
              
              <div className="mb-6">
                <p className="text-sm font-medium text-moss mb-2">Quantity</p>
                <Input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-32 h-12 rounded-lg"
                  data-testid="quantity-input"
                />
              </div>
              
              <Button
                onClick={addToCart}
                disabled={product.stock_quantity === 0 || user.role !== 'customer'}
                size="lg"
                className="w-full md:w-auto bg-moss hover:bg-moss/90 text-white rounded-full px-12 py-6 text-lg btn-primary"
                data-testid="add-to-cart-button"
              >
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
            <h2 className="font-heading text-3xl font-bold text-moss mb-6">Customer Reviews</h2>
            
            {/* Review Form - Only for customers */}
            {user.role === 'customer' && (
              <form onSubmit={submitReview} className="mb-8 pb-8 border-b border-[#E5E0D8]">
                <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="rounded-lg"
                    data-testid="review-comment"
                  />
                </div>
                <Button type="submit" className="bg-moss hover:bg-moss/90 text-white rounded-lg" data-testid="submit-review-button">
                  Submit Review
                </Button>
              </form>
            )}
            
            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <p className="text-muted text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="pb-6 border-b border-[#E5E0D8] last:border-0" data-testid={`review-${review.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-moss">{review.customer_name}</p>
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-muted leading-relaxed">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}