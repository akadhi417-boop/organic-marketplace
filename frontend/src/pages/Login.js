import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Leaf, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Login successful!');
      
      // Redirect based on role
      if (result.user.role === 'customer') {
        navigate('/dashboard');
      } else if (result.user.role === 'farmer') {
        navigate('/farmer');
      } else if (result.user.role === 'admin') {
        navigate('/admin');
      }
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Leaf className="w-10 h-10 text-moss" />
            <span className="font-heading text-3xl font-bold text-moss">OrganicMarket</span>
          </Link>
          <h1 className="font-heading text-4xl font-bold text-moss mb-2" data-testid="login-title">Welcome Back</h1>
          <p className="text-muted">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-moss font-medium">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-moss font-medium">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-moss hover:bg-moss/90 text-white rounded-full h-12 text-base font-semibold btn-primary"
                data-testid="login-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-moss font-semibold hover:underline" data-testid="register-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}