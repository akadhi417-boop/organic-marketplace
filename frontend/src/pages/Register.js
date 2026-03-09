import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Leaf, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'customer';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: defaultRole,
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      toast.success('Registration successful!');
      
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
          <h1 className="font-heading text-4xl font-bold text-moss mb-2" data-testid="register-title">Create Account</h1>
          <p className="text-muted">Join our organic marketplace today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E0D8] p-8">
          <form onSubmit={handleSubmit} data-testid="register-form">
            <div className="space-y-5">
              <div>
                <Label htmlFor="full_name" className="text-moss font-medium">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="register-name-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-moss font-medium">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="register-email-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-moss font-medium">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="register-password-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role" className="text-moss font-medium">I am a</Label>
                <Select name="role" value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="h-12 mt-2 rounded-lg border-[#E5E0D8]" data-testid="register-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone" className="text-moss font-medium">Phone (Optional)</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="register-phone-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-moss font-medium">Address (Optional)</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Your address"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 h-12 rounded-lg border-[#E5E0D8] focus:ring-moss/20 focus:border-moss"
                    data-testid="register-address-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-moss hover:bg-moss/90 text-white rounded-full h-12 text-base font-semibold btn-primary"
                data-testid="register-submit-button"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-moss font-semibold hover:underline" data-testid="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}