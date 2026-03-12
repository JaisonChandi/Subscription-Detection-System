require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const subscriptionsRouter = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

// Rate limiting – 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator (req.ip) without trust proxy for local dev
  validate: { trustProxy: false },
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Subscription Detection System API' });
});

// API entrypoint for browser visits to the backend base URL
app.get('/', (req, res) => {
  res.json({
    message: 'Subscription Detection System API',
    endpoints: {
      health: '/health',
      subscriptions: '/api/subscriptions',
    },
  });
});

// Routes
app.use('/api/subscriptions', subscriptionsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Subscription Detection System API running on port ${PORT}`);
});

module.exports = app;
