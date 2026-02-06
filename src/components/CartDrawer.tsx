import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { QuantitySelector } from './QuantitySelector';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    totalItems,
  } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeCart]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="overlay animate-fade-in" 
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside 
        className="cart-drawer fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-background sm:max-w-md animate-slide-in-right"
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="font-display text-lg font-semibold">
              Your Cart ({totalItems})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="btn-ghost -mr-2"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Content */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-display text-lg font-medium">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover our collection and find something you'll love.
              </p>
            </div>
            <Link
              to="/products"
              onClick={closeCart}
              className="btn-primary mt-2"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              <ul className="space-y-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    {/* Image */}
                    <Link 
                      to={`/product/${item.id}`}
                      onClick={closeCart}
                      className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <div>
                          <Link 
                            to={`/product/${item.id}`}
                            onClick={closeCart}
                            className="font-medium hover:text-accent"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantitySelector
                          quantity={item.quantity}
                          onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                          onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                          size="sm"
                        />
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="btn-accent w-full"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={closeCart}
                className="btn-ghost mt-2 w-full"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
