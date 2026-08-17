const express = require('express');
const { supabasePublic } = require('../config/supabase');

const router = express.Router();

// POST /api/auth/login — email/password login, returns the Supabase session.
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    session: data.session,
    user: { id: data.user.id, email: data.user.email },
  });
});

module.exports = router;
