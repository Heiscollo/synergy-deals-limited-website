document.addEventListener('DOMContentLoaded', function () {
  // Already signed in? Skip straight to the dashboard.
  var existing = sdGetSession();
  if (sdIsSessionValid(existing)) {
    window.location.href = 'dashboard.html';
    return;
  }

  var form = document.getElementById('login-form');
  var messageEl = document.getElementById('form-message');
  var btn = document.getElementById('login-btn');
  var btnText = document.getElementById('login-btn-text');

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.className =
      'text-sm font-medium rounded-lg px-3 py-2 ' +
      (isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    btn.disabled = true;
    btnText.textContent = 'Signing in…';

    fetch(window.SYNERGY_API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || 'Login failed');
        }
        sdSaveSession(result.data.session, result.data.user);
        window.location.href = 'dashboard.html';
      })
      .catch(function (err) {
        showMessage(err.message || 'Unable to reach the server. Is the backend running?', true);
        btn.disabled = false;
        btnText.textContent = 'Sign In';
      });
  });
});
