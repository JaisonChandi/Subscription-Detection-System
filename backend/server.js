require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const subscriptionsRouter = require('./routes/subscriptions');
const authRouter = require('./routes/auth');
const emailScanRouter = require('./routes/emailScan');
const { authenticateToken } = require('./middleware/auth');
const fs = require('fs');
const path = require('path');

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
  validate: { trustProxy: false },
});
app.use('/api/', limiter);

// ─── Auto-create database tables on startup ─────────────────
async function initDatabase() {
  try {
    console.log('🔍 Starting database initialization...');
    
    // Create users table FIRST (subscriptions references users)
    const userSchema = fs.readFileSync(
      path.join(__dirname, 'db', 'userSchema.sql'),
      'utf8'
    );
    await pool.query(userSchema);
    console.log('✅ Users table ready');

    // Create subscriptions table
    const subscriptionSchema = fs.readFileSync(
      path.join(__dirname, 'db', 'schema.sql'),
      'utf8'
    );
    await pool.query(subscriptionSchema);
    console.log('✅ Subscriptions table ready');

    // Migration: add user_id column if it doesn't exist (for existing databases)
    try {
      console.log('📝 Checking for user_id column in subscriptions table...');
      const checkColumn = await pool.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions' AND column_name = 'user_id'
      `);
      
      if (checkColumn.rows.length === 0) {
        console.log('📝 Adding user_id column to subscriptions table...');
        await pool.query(`
          ALTER TABLE subscriptions 
          ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
        `);
        console.log('✅ Database migration complete - user_id column added');
      } else {
        console.log('✅ user_id column already exists');
      }
    } catch (migrationErr) {
      console.error('❌ Migration error:', migrationErr.message);
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    console.error('   Stack:', err.stack);
  }
}

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
      auth: '/api/auth',
      subscriptions: '/api/subscriptions',
    },
  });
});

// ─── Auth Routes (public) ───────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Protected Routes ───────────────────────────────────────
app.use('/api/subscriptions', authenticateToken, subscriptionsRouter);
app.use('/api/email-scan', authenticateToken, emailScanRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`\n🚀 Subscription Detection System API running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
  await initDatabase();
});

module.exports = app;
