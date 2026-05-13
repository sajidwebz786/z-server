const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public: Get all active training programs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM training_programs WHERE is_active = true ORDER BY display_order'
    );
    res.json({ programs: result.rows });
  } catch (err) {
    console.error('Get training programs error:', err);
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

// Admin: Get all training programs (including inactive)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM training_programs ORDER BY display_order'
    );
    res.json({ programs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

// Admin: Create training program
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, duration, tagline, color, features, isPopular, isActive, displayOrder } = req.body;
    const result = await pool.query(
      `INSERT INTO training_programs (title, duration, tagline, color, features, is_popular, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, duration, tagline || '', color || '#42a5f5', features || [], isPopular || false, isActive !== false, displayOrder || 0]
    );
    res.status(201).json({ program: result.rows[0] });
  } catch (err) {
    console.error('Create training program error:', err);
    res.status(500).json({ error: 'Failed to create training program' });
  }
});

// Admin: Update training program
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, duration, tagline, color, features, isPopular, isActive, displayOrder } = req.body;
    const result = await pool.query(
      `UPDATE training_programs SET title=$1, duration=$2, tagline=$3, color=$4, features=$5,
       is_popular=$6, is_active=$7, display_order=$8, updated_at=CURRENT_TIMESTAMP
       WHERE id=$9 RETURNING *`,
      [title, duration, tagline || '', color || '#42a5f5', features || [], isPopular || false, isActive !== false, displayOrder || 0, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Program not found' });
    res.json({ program: result.rows[0] });
  } catch (err) {
    console.error('Update training program error:', err);
    res.status(500).json({ error: 'Failed to update training program' });
  }
});

// Admin: Delete training program
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM training_programs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Training program deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete training program' });
  }
});

module.exports = router;
