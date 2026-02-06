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

    // Check admin role using service client
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';

    console.log(`[admin-api] Admin ${userId} accessing: ${path}`);

    // GET /admin-api?action=orders
    // GET /admin-api?action=metrics
    // PUT /admin-api?action=order-status
    const action = url.searchParams.get('action');

    if (req.method === 'GET' && action === 'orders') {
      const { data: orders, error } = await serviceClient
        .from('orders')
        .select('*, order_items(*, product:products(title, image))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(orders), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET' && action === 'metrics') {
      // Total orders
      const { count: totalOrders } = await serviceClient
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Total revenue
      const { data: revenueData } = await serviceClient
        .from('orders')
        .select('total_amount');

      const totalRevenue = (revenueData || []).reduce(
        (sum: number, o: any) => sum + Number(o.total_amount),
        0
      );

      // Today's orders
      const today = new Date().toISOString().split('T')[0];
      const { count: todayOrders } = await serviceClient
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Pending orders
      const { count: pendingOrders } = await serviceClient
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return new Response(
        JSON.stringify({
          totalOrders: totalOrders || 0,
          totalRevenue,
          todayOrders: todayOrders || 0,
          pendingOrders: pendingOrders || 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT' && action === 'order-status') {
      const body = await req.json();
      const { orderId, status } = body;

      if (!orderId || !status) {
        return new Response(JSON.stringify({ error: 'orderId and status are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await serviceClient
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      console.log(`[admin-api] Order ${orderId} status updated to: ${status}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[admin-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
