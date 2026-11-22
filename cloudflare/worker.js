/**
 * Cloudflare Worker Gateway for Buzzer Media Platform
 * Routes requests to D1 database and SMM provider API on Cloudflare Free Tier
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', runtime: 'cloudflare_workers' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Categories
    if (url.pathname === '/api/categories') {
      const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Services
    if (url.pathname === '/api/services') {
      const { results } = await env.DB.prepare('SELECT * FROM services WHERE is_active = 1').all();
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Default 404
    return new Response(JSON.stringify({ error: 'Endpoint not found on Worker' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
