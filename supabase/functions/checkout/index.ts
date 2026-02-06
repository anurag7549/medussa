import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`[checkout] Processing checkout for user: ${userId}`);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse address from request body
    const body = await req.json();
    const { address } = body;

    if (!address || !address.email || !address.firstName || !address.lastName || !address.address || !address.city || !address.state || !address.zipCode || !address.country) {
      return new Response(JSON.stringify({ error: 'Invalid address data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId);

    if (cartError) {
      console.error('[checkout] Error fetching cart:', cartError);
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[checkout] Cart has ${cartItems.length} items`);

    // 2. Validate stock and calculate total from DB prices (never trust frontend)
    let totalAmount = 0;
    const orderItemsData: { product_id: string; quantity: number; price_at_purchase: number }[] = [];

    for (const item of cartItems) {
      const product = item.product;
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found for cart item` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (product.stock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for "${product.title}". Available: ${product.stock}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;

      orderItemsData.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_purchase: product.price,
      });
    }

    console.log(`[checkout] Total amount: ${totalAmount}`);

    // Use service role for atomic operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 3. Create order
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        address: address,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('[checkout] Error creating order:', orderError);
      throw orderError;
    }

    console.log(`[checkout] Order created: ${order.id}`);

    // 4. Create order items
    const orderItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await serviceClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[checkout] Error creating order items:', itemsError);
      // Rollback order
      await serviceClient.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // 5. Update product stock
    for (const item of orderItemsData) {
      const cartItem = cartItems.find(ci => ci.product_id === item.product_id);
      if (cartItem?.product) {
        const newStock = Math.max(0, cartItem.product.stock - item.quantity);
        await serviceClient
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);
      }
    }

    // 6. Clear cart
    const { error: clearError } = await serviceClient
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (clearError) {
      console.error('[checkout] Error clearing cart:', clearError);
    }

    console.log(`[checkout] Checkout complete. Order: ${order.id}`);

    return new Response(
      JSON.stringify({ order_id: order.id, total_amount: totalAmount, status: 'pending' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[checkout] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
