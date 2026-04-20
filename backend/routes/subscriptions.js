const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all subscriptions (for the authenticated user)
// Auto-classifies status based on renewal_date:
//   Active    → renewal_date >= today
//   Paused    → renewal_date is 1–90 days overdue
//   Expired   → renewal_date is 90+ days overdue
//   Cancelled → kept as-is (user explicitly set it)
router.get('/', async (req, res) => {
  try {
    // Auto-update only subscriptions NOT manually set to Paused or Cancelled.
    // This preserves user intent: if they paused a subscription, keep it paused.
    await pool.query(
      `UPDATE subscriptions
       SET status = CASE
         WHEN renewal_date >= CURRENT_DATE                                          THEN 'Active'
         WHEN renewal_date <  CURRENT_DATE AND (CURRENT_DATE - renewal_date) > 90  THEN 'Expired'
         ELSE status
       END
       WHERE user_id = $1
         AND status NOT IN ('Paused', 'Cancelled')`,
      [req.user.id]
    );

    // Step 2: Return updated subscriptions
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY renewal_date ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET a single subscription by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST create a new subscription
router.post('/', async (req, res) => {
  try {
    const { name, category, cost, billing_cycle, start_date, renewal_date, status, description } = req.body;
    if (!name || !start_date || !renewal_date) {
      return res.status(400).json({ error: 'name, start_date and renewal_date are required' });
    }
    const result = await pool.query(
      `INSERT INTO subscriptions (name, category, cost, billing_cycle, start_date, renewal_date, status, description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        category || 'Other',
        cost || 0.00,
        billing_cycle || 'Monthly',
        start_date,
        renewal_date,
        status || 'Active',
        description || null,
        req.user.id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// PUT update a subscription by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, cost, billing_cycle, start_date, renewal_date, status, description } = req.body;
    const result = await pool.query(
      `UPDATE subscriptions
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           cost = COALESCE($3, cost),
           billing_cycle = COALESCE($4, billing_cycle),
           start_date = COALESCE($5, start_date),
           renewal_date = COALESCE($6, renewal_date),
           status = COALESCE($7, status),
           description = COALESCE($8, description)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [name, category, cost, billing_cycle, start_date, renewal_date, status, description, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// DELETE a subscription by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription deleted successfully', subscription: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

module.exports = router;
