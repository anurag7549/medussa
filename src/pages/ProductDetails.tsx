import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Truck, Shield, Heart } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { QuantitySelector } from '@/components/QuantitySelector';
import { PageLoader } from '@/components/Loader';
import { toast } from 'sonner';
import productsData from '@/data/products.json';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, openCart, items } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const foundProduct = productsData.find(p => p.id === Number(id));
        
        if (foundProduct) {
          setProduct(foundProduct as Product);
          
          // Get related products from same category
          const related = productsData
            .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
            .slice(0, 4);
          setRelatedProducts(related as Product[]);
        } else {
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      toast.success(`${quantity} × ${product.title} added to cart`);
      openCart();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Check if item is already in cart
  const cartItem = items.find(item => item.id === product?.id);

  if (loading) {
    return <PageLoader />;
  }

  if (!product) {
    return null;
  }

  // Create gallery images (using same image for demo)
  const galleryImages = [product.image, product.image, product.image];

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
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <img
                src={galleryImages[selectedImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Thumbnails */}
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
            {/* Category */}
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.category}
            </p>

            {/* Title */}
            <h1 className="mb-4 font-display text-3xl font-semibold lg:text-4xl">
              {product.title}
            </h1>

            {/* Rating */}
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
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="badge-accent">
                    Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="mb-8 text-muted-foreground">{product.description}</p>

            {/* Quantity & Add to Cart */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity(q => q + 1)}
                onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
              />
              
              <button
                onClick={handleAddToCart}
                className="btn-accent flex-1"
              >
                Add to Cart — {formatPrice(product.price * quantity)}
              </button>

              <button
                className="btn-secondary px-4"
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* Cart info */}
            {cartItem && (
              <p className="mb-6 text-sm text-muted-foreground">
                You have {cartItem.quantity} of this item in your cart
              </p>
            )}

            {/* Features */}
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
            <h2 className="mb-8 font-display text-2xl font-semibold">
              You May Also Like
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
