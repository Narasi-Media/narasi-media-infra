/**
 * Cloudflare Worker Gateway for Narasi Media Platform
 * Routes requests to Supabase PostgreSQL Database with Cloudflare D1 fallback
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Security & CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    const isSupabase = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
    const sbHeaders = isSupabase ? {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    } : null;

    try {
      // Root info
      if (url.pathname === '/' || url.pathname === '/api') {
        return json({
          name: 'Narasi Media API',
          version: '1.0.0',
          database_driver: isSupabase ? 'Supabase PostgreSQL' : 'Cloudflare D1',
          runtime: 'cloudflare_workers',
          endpoints: [
            '/health',
            '/api/categories',
            '/api/services',
            '/api/users/profile',
            '/api/orders',
            '/api/deposits',
          ],
        });
      }

      // Health check
      if (url.pathname === '/health') {
        return json({
          status: 'ok',
          runtime: 'cloudflare_workers',
          database: isSupabase ? 'supabase_postgres' : 'cloudflare_d1',
          service: 'narasi-media-api'
        });
      }

      // Categories
      if (url.pathname === '/api/categories') {
        if (isSupabase) {
          const res = await fetch(`${env.SUPABASE_URL}/rest/v1/categories?select=*&order=sort_order.asc`, { headers: sbHeaders });
          const data = await res.json();
          return json({ success: true, data });
        } else {
          const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
          return json({ success: true, data: results });
        }
      }

      // Services
      if (url.pathname === '/api/services') {
        const catId = url.searchParams.get('category_id');
        if (isSupabase) {
          let sUrl = `${env.SUPABASE_URL}/rest/v1/services?select=*&is_active=eq.true`;
          if (catId) sUrl += `&category_id=eq.${catId}`;
          const res = await fetch(sUrl, { headers: sbHeaders });
          const data = await res.json();
          return json({ success: true, data });
        } else {
          let query = 'SELECT * FROM services WHERE is_active = 1';
          let params = [];
          if (catId) {
            query += ' AND category_id = ?';
            params.push(catId);
          }
          const { results } = await env.DB.prepare(query).bind(...params).all();
          return json({ success: true, data: results });
        }
      }

      // User profile
      if (url.pathname === '/api/users/profile') {
        const username = url.searchParams.get('username') || 'regiami';
        if (isSupabase) {
          const res = await fetch(`${env.SUPABASE_URL}/rest/v1/users?select=id,username,full_name,email,whatsapp_number,balance,role&username=ilike.${username}`, { headers: sbHeaders });
          const users = await res.json();
          if (!users || users.length === 0) {
            return json({ success: false, error: 'User tidak ditemukan' }, 404);
          }
          return json({ success: true, data: users[0] });
        } else {
          const user = await env.DB.prepare('SELECT id, username, full_name, email, whatsapp_number, balance, role FROM users WHERE username = ? OR id = ?')
            .bind(username, username)
            .first();
          if (!user) {
            return json({ success: false, error: 'User tidak ditemukan' }, 404);
          }
          return json({ success: true, data: user });
        }
      }

      // Orders
      if (url.pathname === '/api/orders') {
        if (request.method === 'GET') {
          if (isSupabase) {
            const res = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=50`, { headers: sbHeaders });
            const data = await res.json();
            return json({ success: true, data });
          } else {
            const { results } = await env.DB.prepare(
              `SELECT o.*, s.name as service_name 
               FROM orders o 
               LEFT JOIN services s ON o.service_id = s.id 
               ORDER BY o.created_at DESC LIMIT 50`
            ).all();
            return json({ success: true, data: results });
          }
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const { user_id, service_id, target, quantity, custom_comments } = body;

          if (!target || typeof target !== 'string' || !target.trim() || target.length > 500) {
            return json({ success: false, error: 'Target link/username tidak valid (wajib diisi, maksimal 500 karakter)' }, 400);
          }

          let user, service;
          if (isSupabase) {
            const uRes = await fetch(`${env.SUPABASE_URL}/rest/v1/users?select=id,balance&username=ilike.${user_id}`, { headers: sbHeaders });
            const uList = await uRes.json();
            user = uList && uList[0];

            const sRes = await fetch(`${env.SUPABASE_URL}/rest/v1/services?select=id,price_user,min_order,max_order&id=eq.${service_id}`, { headers: sbHeaders });
            const sList = await sRes.json();
            service = sList && sList[0];
          } else {
            user = await env.DB.prepare('SELECT id, balance FROM users WHERE username = ? OR id = ?')
              .bind(user_id, user_id)
              .first();
            service = await env.DB.prepare('SELECT id, price_user, min_order, max_order FROM services WHERE id = ?')
              .bind(service_id)
              .first();
          }

          if (!user) {
            return json({ success: false, error: `Entity dengan ID User ${user_id} tidak ditemukan` }, 404);
          }
          if (!service) {
            return json({ success: false, error: 'Layanan tidak ditemukan' }, 404);
          }

          const qty = parseInt(quantity);
          if (qty < service.min_order || qty > service.max_order) {
            return json({ success: false, error: `Jumlah pesanan harus antara ${service.min_order} dan ${service.max_order}` }, 400);
          }

          const totalPrice = Math.round((qty / 1000) * service.price_user);
          if (user.balance < totalPrice) {
            return json({ success: false, error: `Saldo tidak mencukupi (Kurang Rp ${(totalPrice - user.balance).toLocaleString('id-ID')})` }, 400);
          }

          const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
          const now = new Date().toISOString();

          if (isSupabase) {
            // Deduct balance
            await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
              method: 'PATCH',
              headers: sbHeaders,
              body: JSON.stringify({ balance: user.balance - totalPrice, updated_at: now }),
            });

            // Insert order
            await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
              method: 'POST',
              headers: sbHeaders,
              body: JSON.stringify({
                id: orderId,
                user_id: user.id,
                service_id: service.id,
                target,
                quantity: qty,
                unit_price: service.price_user,
                total_price: totalPrice,
                status: 'Pending',
                created_at: now,
                updated_at: now,
              }),
            });
          } else {
            await env.DB.batch([
              env.DB.prepare('UPDATE users SET balance = balance - ?, updated_at = ? WHERE id = ?')
                .bind(totalPrice, now, user.id),
              env.DB.prepare(
                `INSERT INTO orders (id, user_id, service_id, target, quantity, price_per_k, total_price, custom_comments, status, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
              ).bind(orderId, user.id, service.id, target, qty, service.price_user, totalPrice, custom_comments || null, now, now)
            ]);
          }

          return json({
            success: true,
            message: 'Pesanan berhasil dibuat',
            data: {
              order_id: orderId,
              service_id: service.id,
              target,
              quantity: qty,
              total_price: totalPrice,
              status: 'pending',
              created_at: now,
            },
          });
        }
      }

      // Deposits
      if (url.pathname === '/api/deposits') {
        if (request.method === 'GET') {
          if (isSupabase) {
            const res = await fetch(`${env.SUPABASE_URL}/rest/v1/deposits?select=*&order=created_at.desc&limit=50`, { headers: sbHeaders });
            const data = await res.json();
            return json({ success: true, data });
          } else {
            const { results } = await env.DB.prepare('SELECT * FROM deposits ORDER BY created_at DESC LIMIT 50').all();
            return json({ success: true, data: results });
          }
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const { user_id, method, amount, proof_image_url, sender_name } = body;

          let user;
          if (isSupabase) {
            const uRes = await fetch(`${env.SUPABASE_URL}/rest/v1/users?select=id&username=ilike.${user_id}`, { headers: sbHeaders });
            const uList = await uRes.json();
            user = uList && uList[0];
          } else {
            user = await env.DB.prepare('SELECT id FROM users WHERE username = ? OR id = ?')
              .bind(user_id, user_id)
              .first();
          }

          if (!user) {
            return json({ success: false, error: `User ${user_id} tidak ditemukan` }, 404);
          }

          const depositId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
          const reqAmount = parseInt(amount);
          const uniqueCode = Math.floor(100 + Math.random() * 900);
          const totalToPay = reqAmount + uniqueCode;
          const credited = reqAmount;
          const now = new Date().toISOString();

          if (isSupabase) {
            await fetch(`${env.SUPABASE_URL}/rest/v1/deposits`, {
              method: 'POST',
              headers: sbHeaders,
              body: JSON.stringify({
                id: depositId,
                user_id: user.id,
                method: method || 'manual_qris',
                requested_amount: reqAmount,
                unique_code: uniqueCode,
                total_to_pay: totalToPay,
                balance_credited: credited,
                status: 'Pending',
                sender_name: sender_name || null,
                proof_image_url: proof_image_url || null,
                created_at: now,
              }),
            });
          } else {
            await env.DB.prepare(
              `INSERT INTO deposits (id, user_id, method, requested_amount, unique_code, total_to_pay, balance_credited, proof_image_url, sender_name, status, created_at, updated_at, expired_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
            ).bind(depositId, user.id, method, reqAmount, uniqueCode, totalToPay, credited, proof_image_url || null, sender_name || null, now, now, now).run();
          }

          return json({
            success: true,
            message: 'Permintaan deposit berhasil dibuat',
            data: {
              deposit_id: depositId,
              method,
              requested_amount: reqAmount,
              unique_code: uniqueCode,
              total_to_pay: totalToPay,
              balance_credited: credited,
              status: 'pending',
            },
          });
        }
      }

      // Default 404
      return json({ error: 'Endpoint not found on Worker' }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  },
};
