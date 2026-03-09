const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all subscriptions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions ORDER BY renewal_date ASC'
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
      'SELECT * FROM subscriptions WHERE id = $1',
      [id]
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
      `INSERT INTO subscriptions (name, category, cost, billing_cycle, start_date, renewal_date, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
       WHERE id = $9
       RETURNING *`,
      [name, category, cost, billing_cycle, start_date, renewal_date, status, description, id]
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
      'DELETE FROM subscriptions WHERE id = $1 RETURNING *',
      [id]
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
