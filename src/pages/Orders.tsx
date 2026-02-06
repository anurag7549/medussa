import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/Loader';
import type { Order } from '@/lib/types';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, product:products(title, image, category))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as unknown as Order[]) || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="section-container py-8">
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </nav>

        <h1 className="mb-8 font-display text-3xl font-semibold">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="mb-2 font-display text-xl font-semibold">No orders yet</h2>
            <p className="mb-6 text-muted-foreground">Start shopping to see your orders here.</p>
            <Link to="/products" className="btn-accent">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusColors[order.status] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-lg font-semibold">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                          <img
                            src={item.product?.image || '/placeholder.svg'}
                            alt={item.product?.title || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product?.title || 'Product'}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(item.quantity * item.price_at_purchase)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
