import { Router } from 'itty-router';

// Create a new router
const router = Router();

// CORS preflight response
router.options('*', () => new Response(null, { status: 200 }));

// Helper to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// --- API Endpoints ---

// POST /api/v2/create-pin
// Called by the Mint to create a PIN for a new coin.
router.post('/api/v2/create-pin', async (request, env) => {
  const { nfc_uid } = await request.json();
  if (!nfc_uid) {
    return new Response(JSON.stringify({ error: 'nfc_uid is required' }), { status: 400, headers: corsHeaders });
  }

  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const pin_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const stmt = env.DB.prepare('INSERT INTO coin_pins (nfc_uid, pin_hash) VALUES (?1, ?2)');
  try {
    await stmt.bind(nfc_uid, pin_hash).run();
    console.log(`Created PIN for UID: ${nfc_uid}`);
    return new Response(JSON.stringify({ pin_hash }), { status: 201, headers: corsHeaders });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'PIN already exists for this UID' }), { status: 409, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Failed to create pin' }), { status: 500, headers: corsHeaders });
  }
});

// POST /api/v2/verify-pin
// Called by the Mint to check a PIN during user authentication.
router.post('/api/v2/verify-pin', async (request, env) => {
  const { nfc_uid, pin_to_check } = await request.json();
  if (!nfc_uid || !pin_to_check) {
    return new Response(JSON.stringify({ error: 'nfc_uid and pin_to_check are required' }), { status: 400, headers: corsHeaders });
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(pin_to_check);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const pin_hash_to_check = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const stmt = env.DB.prepare('SELECT pin_hash FROM coin_pins WHERE nfc_uid = ?1');
  try {
    const result = await stmt.bind(nfc_uid).first();
    if (!result) {
      return new Response(JSON.stringify({ is_valid: false }), { status: 404, headers: corsHeaders });
    }
    const isValid = result.pin_hash === pin_hash_to_check;
    return new Response(JSON.stringify({ is_valid: isValid }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to verify pin' }), { status: 500, headers: corsHeaders });
  }
});

// 404 for everything else
router.all('*', () => new Response('Not Found', { status: 404 }));

// Fetch event handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    const response = await router.handle(request, env, ctx);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  },
};
