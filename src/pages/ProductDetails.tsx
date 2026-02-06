import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Shield, Heart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/ProductCard';
import { QuantitySelector } from '@/components/QuantitySelector';
import { PageLoader } from '@/components/Loader';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/useProducts';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, openCart, items } = useCart();
  const { user } = useAuth();
  const { product, relatedProducts, loading } = useProduct(id);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      navigate('/auth');
      return;
    }

    if (product) {
      try {
        for (let i = 0; i < quantity; i++) {
          await addToCart(product);
        }
        toast.success(`${quantity} × ${product.title} added to cart`);
        openCart();
      } catch {
        toast.error('Failed to add item to cart');
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Check if item is already in cart
  const cartItem = items.find((item) => item.product_id === product?.id);

  if (loading) return <PageLoader />;

  if (!product) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/products" className="btn-primary mt-4 inline-block">
          Back to Shop
        </Link>
      </div>
    );
  }

  const galleryImages = [product.image, product.image, product.image].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in">
      <div className="section-container py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </nav>

        {/* Product Section */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <img
                src={galleryImages[selectedImage] || '/placeholder.svg'}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square w-20 overflow-hidden rounded-md bg-secondary transition-all ${
                    selectedImage === index
                      ? 'ring-2 ring-accent ring-offset-2'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.category}
            </p>

            <h1 className="mb-4 font-display text-3xl font-semibold lg:text-4xl">{product.title}</h1>

            {product.rating && (
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating!)
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating}</span>
                {product.reviews && (
                  <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                )}
              </div>
            )}

            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {product.original_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="badge-accent">
                    Save {Math.round((1 - product.price / product.original_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="mb-8 text-muted-foreground">{product.description}</p>

            {/* Stock info */}
            {product.stock <= 5 && product.stock > 0 && (
              <p className="mb-4 text-sm text-destructive">Only {product.stock} left in stock!</p>
            )}
            {product.stock === 0 && (
              <p className="mb-4 text-sm text-destructive font-medium">Out of stock</p>
            )}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity((q) => Math.min(q + 1, product.stock))}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
              />

              <button
                onClick={handleAddToCart}
                className="btn-accent flex-1"
                disabled={product.stock === 0}
              >
                {product.stock === 0
                  ? 'Out of Stock'
                  : `Add to Cart — ${formatPrice(product.price * quantity)}`}
              </button>

              <button className="btn-secondary px-4" aria-label="Add to wishlist">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {cartItem && (
              <p className="mb-6 text-sm text-muted-foreground">
                You have {cartItem.quantity} of this item in your cart
              </p>
            )}

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">On orders over $150</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-sm text-muted-foreground">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-border pt-16">
            <h2 className="mb-8 font-display text-2xl font-semibold">You May Also Like</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
