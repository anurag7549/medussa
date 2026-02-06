import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { Product } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { PageLoader } from '@/components/Loader';
import productsData from '@/data/products.json';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with axios
    const fetchProducts = async () => {
      try {
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Using imported JSON data as if from API
        const featured = productsData.filter(p => p.featured).slice(0, 4);
        setFeaturedProducts(featured as Product[]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $150',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: '100% protected checkout',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day return policy',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="section-container">
          <div className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center lg:min-h-[80vh]">
            <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              New Collection Available
            </span>
            <h1 className="mb-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Timeless Essentials for the Modern Wardrobe
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              Discover our curated collection of premium clothing and accessories. 
              Crafted with care, designed to last.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/products" className="btn-accent group">
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/products" className="btn-outline">
                View Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border bg-background py-12">
        <div className="section-container">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 lg:py-24">
        <div className="section-container">
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="mb-4 font-display text-3xl font-semibold lg:text-4xl">
              Featured Products
            </h2>
            <p className="max-w-lg text-muted-foreground">
              Handpicked pieces from our latest collection, chosen for their exceptional quality and timeless appeal.
            </p>
          </div>

          {loading ? (
            <PageLoader />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/products" className="btn-primary group">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground lg:py-24">
        <div className="section-container text-center">
          <h2 className="mb-4 font-display text-3xl font-semibold lg:text-4xl">
            Join Our Newsletter
          </h2>
          <p className="mx-auto mb-8 max-w-lg opacity-90">
            Subscribe to receive updates on new arrivals, special offers, and style inspiration.
          </p>
          <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="input-field flex-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground/50"
              required
            />
            <button type="submit" className="btn-accent whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
