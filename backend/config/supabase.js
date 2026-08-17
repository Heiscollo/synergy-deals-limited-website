const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase configuration. Ensure SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env'
  );
}

// This API doesn't use Supabase Realtime, but the client still needs a WebSocket
// implementation to construct on Node < 22 (no native WebSocket support).
const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket },
};

// Service-role client: bypasses RLS, used server-side only for admin writes/deletes and token verification.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOptions);

// Anon client: respects RLS, used for public reads and password login.
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);

const PRODUCT_IMAGE_BUCKET = 'product-images';

module.exports = { supabaseAdmin, supabasePublic, PRODUCT_IMAGE_BUCKET };
