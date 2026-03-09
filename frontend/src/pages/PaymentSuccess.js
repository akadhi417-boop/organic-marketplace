import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [order, setOrder] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }
    checkPaymentStatus();
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2000;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setStatus('failed');
        toast.error('Payment verification timed out');
        return;
      }

      try {
        const response = await api.get(`/api/orders/payment-status/${sessionId}`);
        const { payment_status, order: orderData } = response.data;

        if (payment_status === 'paid') {
          setStatus('success');
          setOrder(orderData);
          toast.success('Payment successful!');
        } else if (response.data.status === 'expired') {
          setStatus('failed');
          toast.error('Payment session expired');
        } else {
          attempts++;
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setStatus('failed');
          toast.error('Failed to verify payment');
        }
      }
    };

    poll();
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="payment-checking">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-moss animate-spin mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-moss mb-2">Verifying Payment...</h2>
          <p className="text-muted">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" data-testid="payment-failed">
        <div className="max-w-md text-center">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✕</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-moss mb-4">Payment Failed</h1>
          <p className="text-muted mb-8">There was an issue processing your payment. Please try again.</p>
          <Button
            onClick={() => navigate('/cart')}
            className="bg-moss hover:bg-moss/90 text-white rounded-full px-8"
          >
            Return to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" data-testid="payment-success">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-12 text-center">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="font-heading text-4xl font-bold text-moss mb-4" data-testid="success-title">
            Payment Successful!
          </h1>
          
          <p className="text-lg text-muted mb-8">
            Thank you for your order. Your organic produce will be delivered soon!
          </p>
          
          {order && (
            <div className="bg-bone rounded-xl p-6 mb-8 text-left">
              <h3 className="font-heading text-xl font-bold text-moss mb-4">Order Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Amount:</span>
                  <span className="font-bold text-moss text-lg">₹{order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status:</span>
                  <span className="font-medium text-green-600 capitalize">{order.status}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/orders')}
              className="bg-moss hover:bg-moss/90 text-white rounded-full px-8"
              data-testid="view-orders-button"
            >
              View My Orders
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="rounded-full px-8"
              data-testid="continue-shopping-button"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}