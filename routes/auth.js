const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, role',
      [fullName, email, passwordHash, phone || null, 'student', true]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use OAuth login for this account' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, avatar: user.avatar_url } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let result = await pool.query('SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2', [googleId, 'google']);
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        user = emailCheck.rows[0];
        await pool.query('UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = $3, is_verified = true WHERE id = $4',
          ['google', googleId, picture, user.id]);
      } else {
        result = await pool.query(
          'INSERT INTO users (full_name, email, oauth_provider, oauth_id, avatar_url, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [name, email, 'google', googleId, picture, 'student', true]
        );
        user = result.rows[0];
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, avatar: user.avatar_url } });
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, email, phone, avatar_url, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user enrollments
router.get('/enrollments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.title, c.slug, c.thumbnail_url, c.duration, c.instructor_name
       FROM enrollments e JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    res.json({ enrollments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

module.exports = router;
