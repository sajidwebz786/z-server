const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Get all site settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

module.exports = router;
