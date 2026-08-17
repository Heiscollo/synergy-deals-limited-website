require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');

const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the configured frontend origin plus common local dev origins;
// also allow requests with no Origin header (e.g. static HTML opened via file://).
const allowedOrigins = [process.env.FRONTEND_ORIGIN, 'http://localhost:5500', 'http://127.0.0.1:5500'].filter(
  Boolean
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);

// Multer errors (file too large, wrong type) land here instead of the generic 500 handler.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Synergy Deals backend listening on port ${PORT}`);
});
