import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, openCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.title} added to cart`);
    openCart();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <article className="product-card">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.title}
            className="product-card-image"
            loading="lazy"
          />
          
          {/* Overlay with Add to Cart */}
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-foreground/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="mb-4 flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-105"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
          </div>

          {/* Sale Badge */}
          {product.originalPrice && (
            <div className="badge-accent absolute left-3 top-3">
              Sale
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {product.category}
          </p>

          {/* Title */}
          <h3 className="mb-2 font-display text-lg font-medium text-foreground line-clamp-1 transition-colors group-hover:text-accent">
            {product.title}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="mb-2 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium">{product.rating}</span>
              {product.reviews && (
                <span className="text-sm text-muted-foreground">
                  ({product.reviews})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="price-display">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="price-strikethrough">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
