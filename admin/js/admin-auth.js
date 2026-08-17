// Synergy Deals Admin — shared session storage & auth-aware fetch helper.
// Single trusted admin user, so localStorage is an acceptable place to keep the session token.

var SD_ADMIN_SESSION_KEY = 'sd_admin_session';

function sdSaveSession(session, user) {
  localStorage.setItem(SD_ADMIN_SESSION_KEY, JSON.stringify({ session: session, user: user }));
}

function sdGetSession() {
  var raw = localStorage.getItem(SD_ADMIN_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function sdClearSession() {
  localStorage.removeItem(SD_ADMIN_SESSION_KEY);
}

function sdIsSessionValid(stored) {
  if (!stored || !stored.session || !stored.session.access_token) return false;
  var expiresAt = stored.session.expires_at; // unix seconds, from Supabase
  if (!expiresAt) return true;
  return Date.now() / 1000 < expiresAt;
}

// Call at the top of any protected admin page.
function sdRequireAuth() {
  var stored = sdGetSession();
  if (!sdIsSessionValid(stored)) {
    sdClearSession();
    window.location.href = 'login.html';
    return null;
  }
  return stored;
}

// fetch() wrapper that attaches the bearer token and bounces to login on 401.
function sdAuthFetch(path, options) {
  options = options || {};
  var stored = sdGetSession();
  var headers = options.headers || {};

  if (stored && stored.session && stored.session.access_token) {
    headers['Authorization'] = 'Bearer ' + stored.session.access_token;
  }
  options.headers = headers;

  return fetch(window.SYNERGY_API_BASE + path, options).then(function (res) {
    if (res.status === 401) {
      sdClearSession();
      window.location.href = 'login.html';
      throw new Error('Session expired');
    }
    return res;
  });
}
