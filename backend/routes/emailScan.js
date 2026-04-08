const express = require('express');
const router = express.Router();
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const pool = require('../db');

// ─── Subscription Pattern Database ──────────────────────────
// Maps known subscription senders to platform info
const SUBSCRIPTION_PATTERNS = [
  // ── Streaming ──
  { senderDomain: 'netflix.com',        name: 'Netflix',            category: 'Streaming',       defaultCost: 649,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'primevideo.com',     name: 'Amazon Prime Video', category: 'Streaming',       defaultCost: 299,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'amazon.in',          name: 'Amazon Prime',       category: 'Streaming',       defaultCost: 299,  billing: 'Monthly',   icon: '📦' },
  { senderDomain: 'hotstar.com',        name: 'Disney+ Hotstar',    category: 'Streaming',       defaultCost: 299,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'hulu.com',           name: 'Hulu',               category: 'Streaming',       defaultCost: 999,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'hbomax.com',         name: 'Max (HBO)',           category: 'Streaming',       defaultCost: 1299, billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'sonyliv.com',        name: 'SonyLIV',            category: 'Streaming',       defaultCost: 299,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'zee5.com',           name: 'ZEE5',               category: 'Streaming',       defaultCost: 99,   billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'jiocinema.com',      name: 'JioCinema',          category: 'Streaming',       defaultCost: 29,   billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'apple.com',          name: 'Apple TV+',          category: 'Streaming',       defaultCost: 99,   billing: 'Monthly',   icon: '🍎' },
  { senderDomain: 'disneyplus.com',     name: 'Disney+',            category: 'Streaming',       defaultCost: 899,  billing: 'Monthly',   icon: '🎬' },
  { senderDomain: 'mxplayer.in',        name: 'MX Player',          category: 'Streaming',       defaultCost: 199,  billing: 'Monthly',   icon: '🎬' },

  // ── Music ──
  { senderDomain: 'spotify.com',        name: 'Spotify',            category: 'Music',           defaultCost: 119,  billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'gaana.com',          name: 'Gaana Plus',         category: 'Music',           defaultCost: 99,   billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'jiosaavn.com',       name: 'JioSaavn Pro',       category: 'Music',           defaultCost: 99,   billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'wynk.in',            name: 'Wynk Music',         category: 'Music',           defaultCost: 49,   billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'tidal.com',          name: 'Tidal',              category: 'Music',           defaultCost: 999,  billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'deezer.com',         name: 'Deezer',             category: 'Music',           defaultCost: 499,  billing: 'Monthly',   icon: '🎵' },
  { senderDomain: 'youtubemusic.com',   name: 'YouTube Music',      category: 'Music',           defaultCost: 99,   billing: 'Monthly',   icon: '🎵' },

  // ── Productivity / Cloud ──
  { senderDomain: 'microsoft.com',      name: 'Microsoft 365',      category: 'Productivity',    defaultCost: 520,  billing: 'Monthly',   icon: '💼' },
  { senderDomain: 'google.com',         name: 'Google One',         category: 'Cloud Storage',   defaultCost: 130,  billing: 'Monthly',   icon: '☁️' },
  { senderDomain: 'dropbox.com',        name: 'Dropbox Plus',       category: 'Cloud Storage',   defaultCost: 999,  billing: 'Monthly',   icon: '☁️' },
  { senderDomain: 'notion.so',          name: 'Notion',             category: 'Productivity',    defaultCost: 999,  billing: 'Monthly',   icon: '📒' },
  { senderDomain: 'slack.com',          name: 'Slack Pro',          category: 'Productivity',    defaultCost: 875,  billing: 'Monthly',   icon: '💬' },
  { senderDomain: 'zoom.us',            name: 'Zoom Pro',           category: 'Productivity',    defaultCost: 1399, billing: 'Monthly',   icon: '📹' },
  { senderDomain: 'figma.com',          name: 'Figma',              category: 'Productivity',    defaultCost: 1200, billing: 'Monthly',   icon: '🎨' },
  { senderDomain: 'adobe.com',          name: 'Adobe Creative Cloud',category: 'Productivity',  defaultCost: 4230, billing: 'Monthly',   icon: '🎨' },
  { senderDomain: 'canva.com',          name: 'Canva Pro',          category: 'Productivity',    defaultCost: 499,  billing: 'Monthly',   icon: '🎨' },

  // ── Gaming ──
  { senderDomain: 'playstation.com',    name: 'PlayStation Plus',   category: 'Gaming',          defaultCost: 499,  billing: 'Monthly',   icon: '🎮' },
  { senderDomain: 'xbox.com',           name: 'Xbox Game Pass',     category: 'Gaming',          defaultCost: 499,  billing: 'Monthly',   icon: '🎮' },
  { senderDomain: 'ea.com',             name: 'EA Play',            category: 'Gaming',          defaultCost: 349,  billing: 'Monthly',   icon: '🎮' },
  { senderDomain: 'epicgames.com',      name: 'Epic Games Store',   category: 'Gaming',          defaultCost: 0,    billing: 'Monthly',   icon: '🎮' },
  { senderDomain: 'steam.com',          name: 'Steam',              category: 'Gaming',          defaultCost: 0,    billing: 'Monthly',   icon: '🎮' },

  // ── Education ──
  { senderDomain: 'udemy.com',          name: 'Udemy',              category: 'Education',       defaultCost: 455,  billing: 'Monthly',   icon: '📚' },
  { senderDomain: 'coursera.org',       name: 'Coursera Plus',      category: 'Education',       defaultCost: 3995, billing: 'Monthly',   icon: '📚' },
  { senderDomain: 'skillshare.com',     name: 'Skillshare',         category: 'Education',       defaultCost: 1530, billing: 'Yearly',    icon: '📚' },
  { senderDomain: 'duolingo.com',       name: 'Duolingo Plus',      category: 'Education',       defaultCost: 499,  billing: 'Monthly',   icon: '🦜' },
  { senderDomain: 'linkedin.com',       name: 'LinkedIn Premium',   category: 'Education',       defaultCost: 2499, billing: 'Monthly',   icon: '💼' },

  // ── News ──
  { senderDomain: 'nytimes.com',        name: 'NYT Digital',        category: 'News',            defaultCost: 999,  billing: 'Monthly',   icon: '📰' },
  { senderDomain: 'thehindu.com',       name: 'The Hindu',          category: 'News',            defaultCost: 199,  billing: 'Monthly',   icon: '📰' },

  // ── Fitness ──
  { senderDomain: 'cult.fit',           name: 'Cult.fit',           category: 'Fitness',         defaultCost: 2499, billing: 'Monthly',   icon: '🏋️' },
  { senderDomain: 'headspace.com',      name: 'Headspace',          category: 'Fitness',         defaultCost: 1299, billing: 'Monthly',   icon: '🧘' },
  { senderDomain: 'calm.com',           name: 'Calm',               category: 'Fitness',         defaultCost: 1499, billing: 'Yearly',    icon: '🧘' },

  // ── Developer / Other ──
  { senderDomain: 'github.com',         name: 'GitHub Pro',         category: 'Productivity',    defaultCost: 744,  billing: 'Monthly',   icon: '💻' },
  { senderDomain: 'heroku.com',         name: 'Heroku',             category: 'Productivity',    defaultCost: 550,  billing: 'Monthly',   icon: '💻' },
  { senderDomain: 'digitalocean.com',   name: 'DigitalOcean',       category: 'Productivity',    defaultCost: 600,  billing: 'Monthly',   icon: '💻' },
  { senderDomain: 'vercel.com',         name: 'Vercel Pro',         category: 'Productivity',    defaultCost: 2000, billing: 'Monthly',   icon: '💻' },
  { senderDomain: 'openai.com',         name: 'ChatGPT Plus',       category: 'Productivity',    defaultCost: 1660, billing: 'Monthly',   icon: '🤖' },
];

// Subject line keywords that indicate a subscription receipt/confirmation
const SUBSCRIPTION_SUBJECT_KEYWORDS = [
  'subscription', 'receipt', 'invoice', 'payment confirmation',
  'billing', 'renewal', 'auto-renew', 'charged', 'confirmation',
  'your order', 'your purchase', 'payment received', 'thank you for subscribing',
  'membership', 'plan', 'account confirmed',
];

// ─── Helper: extract cost from email body ────────────────────
function extractCost(text) {
  // Match patterns like ₹199, Rs. 299, $9.99, INR 499, USD 12.99
  const patterns = [
    /(?:₹|rs\.?\s*|inr\s*)(\d+(?:[,\.]\d+)*)/gi,
    /\$\s*(\d+(?:\.\d{1,2})?)/gi,
    /(?:usd|eur|gbp)\s*(\d+(?:\.\d{1,2})?)/gi,
    /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs|inr)/gi,
  ];
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 0 && val < 100000) return val;
    }
  }
  return null;
}

// ─── Helper: extract date from email text ───────────────────
function extractRenewalDate(text, emailDate) {
  // Look for "next billing date", "renews on", etc.
  const patterns = [
    /(?:next billing|renewal|renews?\s+on|next charge)\s*:?\s*([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
    /(?:valid until|expires?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    if (m) {
      const parsed = new Date(m[1]);
      if (!isNaN(parsed)) return parsed.toISOString().split('T')[0];
    }
  }
  // Default: 30 days from email date
  const base = emailDate ? new Date(emailDate) : new Date();
  base.setDate(base.getDate() + 30);
  return base.toISOString().split('T')[0];
}

// ─── POST /api/email-scan/connect ───────────────────────────
// Server-Sent Events stream — emits progress updates while scanning
router.post('/connect', async (req, res) => {
  const { host, port, user, password, tls } = req.body;

  if (!host || !user || !password) {
    return res.status(400).json({ error: 'host, user, and password are required.' });
  }

  // ── Set up SSE ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const config = {
    imap: {
      host,
      port: port || 993,
      user,
      password,
      tls: tls !== false,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection;
  try {
    send({ type: 'status', message: 'Connecting to mail server...', percent: 2 });

    connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    send({ type: 'status', message: 'Connected! Fetching email list...', percent: 8 });

    // Search for emails from the last 365 days
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceStr = since.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const searchCriteria = [['SINCE', sinceStr]];
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'],
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    const total = messages.length;

    send({ type: 'status', message: `Found ${total} emails. Scanning...`, percent: 12, total });

    const detectedMap = new Map();
    const startTime = Date.now();
    const PROGRESS_START = 12;
    const PROGRESS_END   = 95;

    for (let idx = 0; idx < messages.length; idx++) {
      const msg = messages[idx];
      const headerPart = msg.parts.find(p => p.which === 'HEADER.FIELDS (FROM SUBJECT DATE)');
      const bodyPart   = msg.parts.find(p => p.which === 'TEXT');

      if (!headerPart) continue;

      const from    = (headerPart.body.from?.[0] || '').toLowerCase();
      const subject = (headerPart.body.subject?.[0] || '').toLowerCase();
      const dateStr = headerPart.body.date?.[0];
      const body    = bodyPart?.body || '';

      const isSubscriptionEmail = SUBSCRIPTION_SUBJECT_KEYWORDS.some(kw => subject.includes(kw));
      if (isSubscriptionEmail) {
        const match = SUBSCRIPTION_PATTERNS.find(p => from.includes(p.senderDomain));
        if (match && !detectedMap.has(match.name)) {
          let parsed;
          try { parsed = await simpleParser(body); } catch (_) {}
          const bodyText = parsed?.text || body || '';
          const cost = extractCost(bodyText) || match.defaultCost;
          const renewalDate = extractRenewalDate(bodyText, dateStr);
          const startDate = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          // ── Determine status from renewal date ──────────────
          const today      = new Date();
          today.setHours(0, 0, 0, 0);
          const renewal    = new Date(renewalDate);
          const daysOverdue = Math.floor((today - renewal) / (1000 * 60 * 60 * 24));

          let status;
          if (daysOverdue <= 0) {
            status = 'Active';       // renewal is today or in the future
          } else if (daysOverdue <= 90) {
            status = 'Paused';       // overdue but within 90 days — likely just lapsed
          } else {
            status = 'Expired';      // overdue by more than 90 days — subscription has expired
          }

          detectedMap.set(match.name, {
            name: match.name,
            category: match.category,
            cost,
            billing_cycle: match.billing,
            start_date: startDate,
            renewal_date: renewalDate,
            status,
            description: `Auto-detected from email (${from.substring(0, 40)})`,
            icon: match.icon,
            source_email: user,
          });
        }
      }

      // ── Emit progress every 10 emails (or on last) ──────────
      if (idx % 10 === 0 || idx === total - 1) {
        const done    = idx + 1;
        const percent = Math.round(PROGRESS_START + ((done / total) * (PROGRESS_END - PROGRESS_START)));
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        const rate    = done / elapsed;                   // emails per second
        const remaining = rate > 0 ? Math.ceil((total - done) / rate) : null;

        send({
          type: 'progress',
          scanned: done,
          total,
          percent,
          found: detectedMap.size,
          secondsRemaining: remaining,
        });
      }
    }

    await connection.end();

    const results = Array.from(detectedMap.values());
    send({
      type: 'done',
      success: true,
      email: user,
      totalScanned: total,
      detected: results,
      percent: 100,
      message: `Scanned ${total} emails. Found ${results.length} subscription(s).`,
    });

    res.end();

  } catch (err) {
    if (connection) try { await connection.end(); } catch (_) {}
    console.error('Email scan error:', err.message);
    send({ type: 'error', error: `Failed to connect or scan email: ${err.message}` });
    res.end();
  }
});

// ─── POST /api/email-scan/import ────────────────────────────
// Saves a list of detected subscriptions into the DB for the current user
router.post('/import', async (req, res) => {
  const { subscriptions } = req.body;
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return res.status(400).json({ error: 'subscriptions array is required.' });
  }

  const results = [];
  const errors  = [];

  for (const sub of subscriptions) {
    try {
      const { name, category, cost, billing_cycle, start_date, renewal_date, status, description } = sub;
      if (!name || !start_date || !renewal_date) {
        errors.push({ name, error: 'Missing required fields' });
        continue;
      }

      // Skip if already exists for this user
      const existing = await pool.query(
        'SELECT id FROM subscriptions WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
        [req.user.id, name]
      );
      if (existing.rows.length > 0) {
        errors.push({ name, error: 'Already exists' });
        continue;
      }

      const result = await pool.query(
        `INSERT INTO subscriptions (name, category, cost, billing_cycle, start_date, renewal_date, status, description, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          name,
          category || 'Other',
          parseFloat(cost) || 0,
          billing_cycle || 'Monthly',
          start_date,
          renewal_date,
          status || 'Active',
          description || null,
          req.user.id,
        ]
      );
      results.push(result.rows[0]);
    } catch (err) {
      errors.push({ name: sub.name, error: err.message });
    }
  }

  return res.json({
    success: true,
    imported: results.length,
    skipped: errors.length,
    subscriptions: results,
    skippedDetails: errors,
  });
});

module.exports = router;
