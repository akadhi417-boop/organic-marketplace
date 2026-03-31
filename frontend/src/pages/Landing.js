import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Leaf, ShoppingBag, Users, Award } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'customer') navigate('/dashboard');
      else if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'admin') navigate('/admin');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-bone">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1754891144113-8a8d092a7dbf" 
            alt="Fresh vegetables" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-moss" />
            <span className="font-heading text-2xl font-bold text-moss">OrganicMarket</span>
          </div>
          <div className="flex gap-4">
            {user ? (
              <Button 
                onClick={handleGetStarted}
                className="bg-moss hover:bg-moss/90 text-white rounded-full px-6"
                data-testid="nav-dashboard-button"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  data-testid="nav-login-button"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-moss hover:bg-moss/90 text-white rounded-full px-6"
                  data-testid="nav-register-button"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="font-heading text-5xl md:text-7xl font-bold text-moss mb-6 leading-tight" data-testid="hero-title">
              Fresh Organic Produce, Straight from Farm to Table
            </h1>
            <p className="text-lg md:text-xl text-muted mb-8 leading-relaxed" data-testid="hero-subtitle">
              Connect with local organic farmers and enjoy the freshest fruits and vegetables delivered to your door. Support sustainable agriculture while enjoying nature's best.
            </p>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-moss hover:bg-moss/90 text-white rounded-full px-8 py-6 text-lg btn-primary shadow-lg"
              data-testid="hero-cta-button"
            >
              Start Shopping Now
            </Button>
          </div>
        </div>
      </header>

      {/* Features Bento Grid */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto" data-testid="features-section">
        <h2 className="font-heading text-4xl md:text-5xl font-semibold text-moss mb-4 text-center">
          Why Choose Organic?
        </h2>
        <p className="text-center text-muted mb-16 text-lg max-w-2xl mx-auto">
          We connect you directly with certified organic farmers, ensuring quality, freshness, and sustainability.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-[#E5E0D8] hover:shadow-xl transition-all" data-testid="feature-fresh">
            <div className="w-14 h-14 bg-moss/10 rounded-full flex items-center justify-center mb-6">
              <Leaf className="w-7 h-7 text-moss" />
            </div>
            <h3 className="font-heading text-2xl font-medium text-moss mb-3">100% Organic Certified</h3>
            <p className="text-muted leading-relaxed">
              All our products are certified organic, grown without harmful pesticides or chemicals.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-lg border border-[#E5E0D8] hover:shadow-xl transition-all" data-testid="feature-farmers">
            <div className="w-14 h-14 bg-terracotta/10 rounded-full flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-terracotta" />
            </div>
            <h3 className="font-heading text-2xl font-medium text-moss mb-3">Support Local Farmers</h3>
            <p className="text-muted leading-relaxed">
              Buy directly from farmers in your region and help strengthen local agriculture.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-10 shadow-lg border border-[#E5E0D8] hover:shadow-xl transition-all" data-testid="feature-delivery">
            <div className="w-14 h-14 bg-moss/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-7 h-7 text-moss" />
            </div>
            <h3 className="font-heading text-2xl font-medium text-moss mb-3">Farm Fresh Delivery</h3>
            <p className="text-muted leading-relaxed">
              Get the freshest produce delivered to your doorstep within 24-48 hours of harvest.
            </p>
          </div>
        </div>
      </section>

      {/* Farmer Spotlight */}
      <section className="py-24 md:py-32 px-6 bg-white" data-testid="farmer-section">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <img 
            src="https://images.unsplash.com/photo-1670012015063-14a6f2102a50" 
            alt="Local organic farmer" 
            className="w-full h-[500px] object-cover rounded-2xl shadow-lg"
          />
          <div>
            <span className="font-accent text-2xl text-terracotta mb-4 block">Meet Your Farmers</span>
            <h2 className="font-heading text-4xl md:text-5xl font-semibold text-moss mb-6">
              Grown with Care, Delivered with Love
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-6">
              Our platform empowers organic farmers to sell directly to consumers, eliminating middlemen and ensuring fair prices. Every purchase supports sustainable farming practices and local communities.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <Award className="w-12 h-12 text-terracotta" />
              <div>
                <h4 className="font-semibold text-moss text-lg">Certified Organic</h4>
                <p className="text-muted">All farmers are verified and certified</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/register?role=farmer')}
              className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6"
              data-testid="become-farmer-button"
            >
              Become a Farmer Partner
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 px-6 bg-moss text-white relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1666631740055-8d3a093960b5" 
            alt="Farm landscape" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-6xl font-bold mb-6">
            Start Your Organic Journey Today
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Join thousands of customers enjoying fresh, healthy, and sustainable produce.
          </p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="bg-white text-moss hover:bg-white/90 rounded-full px-10 py-6 text-lg font-semibold shadow-xl"
            data-testid="cta-button"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6" />
            <span className="font-heading text-xl font-bold">OrganicMarket</span>
          </div>
          <p className="text-white/70">© 2026 OrganicMarket. Supporting sustainable agriculture.</p>
          <p className="text-white/50 text-sm mt-2">Connecting Farmers with Customers for Fresh Organic Produce</p>
        </div>
      </footer>
    </div>
  );
}