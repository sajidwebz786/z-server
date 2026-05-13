const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

let razorpay = null;
const hasValidRazorpay = process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_') && 
  process.env.RAZORPAY_KEY_ID !== 'rzp_test_YOUR_KEY_ID';

if (hasValidRazorpay) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay initialized with valid keys');
} else {
  console.log('Razorpay not configured - payments will be in test mode');
}

// Create Razorpay order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'Course ID required' });

    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1 AND is_active = true', [courseId]);
    if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

    const course = courseResult.rows[0];

    const existingEnrollment = await pool.query('SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2', [req.user.id, courseId]);
    if (existingEnrollment.rows.length > 0) return res.status(400).json({ error: 'Already enrolled in this course' });

    let order;
    if (razorpay) {
      const options = {
        amount: Math.round(course.price * 100),
        currency: course.currency || 'INR',
        receipt: `order_${course.slug}_${Date.now()}`,
        notes: { courseId: course.id, userId: req.user.id, courseName: course.title },
      };
      order = await razorpay.orders.create(options);
      await pool.query(
        'INSERT INTO payments (user_id, course_id, razorpay_order_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, courseId, order.id, course.price, course.currency || 'INR', 'pending']
      );
    } else {
      order = {
        id: `test_order_${Date.now()}`,
        amount: Math.round(course.price * 100),
        currency: course.currency || 'INR',
      };
      await pool.query(
        'INSERT INTO payments (user_id, course_id, razorpay_order_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, courseId, order.id, course.price, course.currency || 'INR', 'pending']
      );
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseName: course.title,
      keyId: process.env.RAZORPAY_KEY_ID,
      testMode: !razorpay,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await pool.query("UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1", [razorpay_order_id]);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    await pool.query(
      "UPDATE payments SET razorpay_payment_id = $1, razorpay_signature = $2, status = 'completed' WHERE razorpay_order_id = $3",
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    await pool.query(
      'INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO NOTHING',
      [req.user.id, courseId, 'active']
    );

    await pool.query('UPDATE courses SET total_students = total_students + 1 WHERE id = $1', [courseId]);

    res.json({ message: 'Payment successful! You are now enrolled.', enrolled: true });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.title as course_title FROM payments p
       LEFT JOIN courses c ON p.course_id = c.id
       WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;
