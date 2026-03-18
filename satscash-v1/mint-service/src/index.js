import { Router } from 'itty-router';

const router = Router();
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// --- Configuration ---
// IMPORTANT: Update this URL to your deployed Custodian service
const CUSTODIAN_API_URL = 'https://satscash-custodian.your-subdomain.workers.dev';

// --- API Endpoints ---

// GET /api/v1/public/coin-info
router.get('/api/v1/public/coin-info', async (request, env) => {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid query parameter is required' }), { status: 400, headers: corsHeaders });
  }
  const stmt = env.DB.prepare('SELECT value_sats, status FROM coins WHERE nfc_uid = ?1');
  const result = await stmt.bind(uid).first();
  if (result) {
    return new Response(JSON.stringify({ uid, ...result }), { status: 200, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ error: 'Coin not found' }), { status: 404, headers: corsHeaders });
});

// GET /api/v1/public/dashboard-stats
router.get('/api/v1/public/dashboard-stats', async (request, env) => {
  const totalMintedStmt = env.DB.prepare('SELECT SUM(value_sats) as total FROM coins');
  const inCirculationStmt = env.DB.prepare('SELECT SUM(value_sats) as total FROM coins WHERE status = \'minted\'');
  const spentStmt = env.DB.prepare('SELECT COUNT(*) as count FROM coins WHERE status = \'spent\'');
  const byDenomStmt = env.DB.prepare('SELECT value_sats, COUNT(*) as count FROM coins GROUP BY value_sats');

  const [totalMinted, inCirculation, spent, byDenom] = await Promise.all([
    totalMintedStmt.first(),
    inCirculationStmt.first(),
    spentStmt.first(),
    byDenomStmt.all()
  ]);

  const stats = {
    total_value_minted: totalMinted.total || 0,
    total_value_in_circulation: inCirculation.total || 0,
    coins_spent: spent.count || 0,
    coins_by_denomination: byDenom.results.reduce((acc, row) => {
      acc[row.value_sats] = row.count;
      return acc;
    }, {})
  };
  return new Response(JSON.stringify(stats), { status: 200, headers: corsHeaders });
});

// POST /api/v1/authenticate
router.post('/api/v1/authenticate', async (request, env) => {
  const { nfc_uid, pin } = await request.json();
  if (!nfc_uid || !pin) {
    return new Response(JSON.stringify({ error: 'nfc_uid and pin are required' }), { status: 400, headers: corsHeaders });
  }

  // 1. Verify PIN with Custodian
  let isPinValid;
  try {
    const verifyResponse = await fetch(`${CUSTODIAN_API_URL}/api/v2/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nfc_uid, pin_to_check: pin })
    });
    const verifyResult = await verifyResponse.json();
    isPinValid = verifyResult.is_valid;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Could not verify PIN with Custodian' }), { status: 503, headers: corsHeaders });
  }

  if (!isPinValid) {
    return new Response(JSON.stringify({ error: 'Invalid UID or PIN' }), { status: 401, headers: corsHeaders });
  }

  // 2. Check coin status and lock it
  const selectStmt = env.DB.prepare('SELECT status FROM coins WHERE nfc_uid = ?1');
  const coin = await selectStmt.bind(nfc_uid).first();

  if (!coin) {
    return new Response(JSON.stringify({ error: 'Coin not found' }), { status: 404, headers: corsHeaders });
  }
  if (coin.status !== 'minted') {
    return new Response(JSON.stringify({ error: 'Coin has already been spent or is locked' }), { status: 410, headers: corsHeaders });
  }

  const updateStmt = env.DB.prepare('UPDATE coins SET status = ?1 WHERE nfc_uid = ?2');
  await updateStmt.bind('spent', nfc_uid).run();

  // 3. In V1, this is where you would generate a real LNURL-withdraw link via Blink API.
  // For now, we return a success message.
  console.log(`Coin ${nfc_uid} successfully spent.`);
  return new Response(JSON.stringify({ message: 'Coin spent successfully.' }), { status: 200, headers: corsHeaders });
});

// POST /api/v1/admin/create-coin
// A temporary endpoint to create coins for testing.
router.post('/api/v1/admin/create-coin', async (request, env) => {
  const { nfc_uid, value_sats, pin_hash } = await request.json();
  if (!nfc_uid || !value_sats || !pin_hash) {
    return new Response(JSON.stringify({ error: 'nfc_uid, value_sats, and pin_hash are required' }), { status: 400, headers: corsHeaders });
  }

  const stmt = env.DB.prepare('INSERT INTO coins (nfc_uid, value_sats, status, pin_hash) VALUES (?1, ?2, ?3, ?4)');
  try {
    await stmt.bind(nfc_uid, value_sats, 'minted', pin_hash).run();
    console.log(`Coin successfully minted in Mint database with UID: ${nfc_uid}`);
    return new Response(JSON.stringify({ message: 'Coin created successfully', nfc_uid }), { status: 201, headers: corsHeaders });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Coin with this UID already exists' }), { status: 409, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: 'Failed to create coin' }), { status: 500, headers: corsHeaders });
  }
});

// 404 for API routes
router.all('/api/*', () => new Response('API Endpoint Not Found', { status: 404 }));

// --- Static Asset Handler ---
// This handles all other requests, serving files from the `public` directory.
router.all('*', async (request, env) => {
  const url = new URL(request.url);
  let assetPath = url.pathname.substring(1); // Remove leading '/'

  // Default to index.html for root path
  if (assetPath === '') {
    assetPath = 'index.html';
  }
  
  try {
    // Use the ASSETS binding to fetch the file
    const asset = await env.ASSETS.fetch(new Request(assetPath));
    if (asset.status === 404) {
      // If the file isn't found, serve index.html for SPA routing
      const indexAsset = await env.ASSETS.fetch(new Request('index.html'));
      return indexAsset;
    }
    return asset;
  } catch (e) {
    return new Response('Asset not found.', { status: 404 });
  }
});


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
