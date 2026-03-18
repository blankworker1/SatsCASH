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
    return new Response(JSON.stringify({ error: 'nfc
