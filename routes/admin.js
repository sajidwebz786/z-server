const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SOURCE_COURSE_SLUGS = ['trial-pass', 'career-boost', 'elite-success-pro', 'ai-job-ready-bootcamp'];
const SOURCE_CATEGORY_SLUGS = ['student-pass', 'career-pass', 'success-pass', 'ai-implementation', 'live-domain-projects', 'career-placement', 'industry-ready-courses', 'trending-tech'];
const SITE_SETTING_KEYS = [
  'site_name',
  'site_tagline',
  'contact_email',
  'contact_phone',
  'whatsapp_number',
  'address',
  'google_maps_embed',
  'facebook_url',
  'twitter_url',
  'linkedin_url',
  'instagram_url',
  'youtube_url',
  'lms_portal_url',
];

// All admin routes require authentication + admin role
router.use(authenticateToken, requireAdmin);

// ---- DASHBOARD ----
router.get('/dashboard', async (req, res) => {
  try {
    const [users, courses, enrollments, payments, messages] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query('SELECT COUNT(*) as total FROM courses WHERE is_active = true AND slug = ANY($1)', [SOURCE_COURSE_SLUGS]),
      pool.query("SELECT COUNT(*) as total FROM enrollments WHERE status = 'active'"),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'completed'"),
      pool.query('SELECT COUNT(*) as total FROM contact_messages WHERE is_read = false'),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].total),
      totalCourses: parseInt(courses.rows[0].total),
      totalEnrollments: parseInt(enrollments.rows[0].total),
      totalRevenue: parseFloat(payments.rows[0].total),
      unreadMessages: parseInt(messages.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ---- SITE SETTINGS ----
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body.settings || {};
    const entries = Object.entries(settings).filter(([key]) => SITE_SETTING_KEYS.includes(key));

    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, value ?? '']
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ---- COURSES CRUD ----
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, cat.name as category_name FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.slug = ANY($1) ORDER BY c.created_at DESC`,
      [SOURCE_COURSE_SLUGS]
    );
    res.json({ courses: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { title, slug, shortDescription, fullDescription, categoryId, price, originalPrice,
      duration, level, thumbnailUrl, bannerUrl, instructorName, instructorBio, instructorAvatar,
      rating, totalHours, totalLectures, isFeatured, isBestseller, displayOrder } = req.body;

    const result = await pool.query(
      `INSERT INTO courses (title, slug, short_description, full_description, category_id, price,
        original_price, duration, level, thumbnail_url, banner_url, instructor_name, instructor_bio,
        instructor_avatar, rating, total_hours, total_lectures, is_featured, is_bestseller, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [title, slug, shortDescription, fullDescription, categoryId, price, originalPrice || null,
        duration, level, thumbnailUrl || null, bannerUrl || null, instructorName, instructorBio || null,
        instructorAvatar || null, rating || 4.5, totalHours || 0, totalLectures || 0,
        isFeatured || false, isBestseller || false, displayOrder || 0]
    );
    res.status(201).json({ course: result.rows[0] });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const { title, slug, shortDescription, fullDescription, categoryId, price, originalPrice,
      duration, level, thumbnailUrl, bannerUrl, instructorName, instructorBio, instructorAvatar,
      rating, totalHours, totalLectures, isFeatured, isBestseller, isActive, displayOrder } = req.body;

    const result = await pool.query(
      `UPDATE courses SET title=$1, slug=$2, short_description=$3, full_description=$4, category_id=$5,
        price=$6, original_price=$7, duration=$8, level=$9, thumbnail_url=$10, banner_url=$11,
        instructor_name=$12, instructor_bio=$13, instructor_avatar=$14, rating=$15, total_hours=$16,
        total_lectures=$17, is_featured=$18, is_bestseller=$19, is_active=$20, display_order=$21,
        updated_at=CURRENT_TIMESTAMP WHERE id=$22 RETURNING *`,
      [title, slug, shortDescription, fullDescription, categoryId, price, originalPrice || null,
        duration, level, thumbnailUrl || null, bannerUrl || null, instructorName, instructorBio || null,
        instructorAvatar || null, rating || 4.5, totalHours || 0, totalLectures || 0,
        isFeatured || false, isBestseller || false, isActive !== false, displayOrder || 0, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json({ course: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ---- COURSE HIGHLIGHTS ----
router.get('/courses/:id/highlights', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM course_highlights WHERE course_id = $1 ORDER BY display_order', [req.params.id]);
    res.json({ highlights: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

router.post('/courses/:id/highlights', async (req, res) => {
  try {
    const { highlight, icon, displayOrder } = req.body;
    const result = await pool.query(
      'INSERT INTO course_highlights (course_id, highlight, icon, display_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, highlight, icon || null, displayOrder || 0]
    );
    res.status(201).json({ highlight: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

router.put('/highlights/:id', async (req, res) => {
  try {
    const { highlight, icon, displayOrder } = req.body;
    const result = await pool.query(
      'UPDATE course_highlights SET highlight=$1, icon=$2, display_order=$3 WHERE id=$4 RETURNING *',
      [highlight, icon || null, displayOrder || 0, req.params.id]
    );
    res.json({ highlight: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update highlight' });
  }
});

router.delete('/highlights/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM course_highlights WHERE id = $1', [req.params.id]);
    res.json({ message: 'Highlight deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// ---- CURRICULUM ----
router.get('/courses/:id/curriculum', async (req, res) => {
  try {
    const modules = await pool.query(
      `SELECT cc.*, 
        (SELECT json_agg(cl.* ORDER BY cl.display_order) FROM curriculum_lessons cl WHERE cl.module_id = cc.id) as lessons
       FROM course_curriculum cc WHERE cc.course_id = $1 ORDER BY cc.display_order`,
      [req.params.id]
    );
    res.json({ curriculum: modules.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
});

router.post('/courses/:id/curriculum', async (req, res) => {
  try {
    const { moduleTitle, moduleDescription, displayOrder, lessons } = req.body;
    const module = await pool.query(
      'INSERT INTO course_curriculum (course_id, module_title, module_description, display_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, moduleTitle, moduleDescription || null, displayOrder || 0]
    );

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        await pool.query(
          'INSERT INTO curriculum_lessons (module_id, title, duration, type, is_preview, display_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [module.rows[0].id, lesson.title, lesson.duration || null, lesson.type || 'video', lesson.isPreview || false, lesson.displayOrder || 0]
        );
      }
    }
    res.status(201).json({ module: module.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create curriculum module' });
  }
});

router.delete('/curriculum/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM course_curriculum WHERE id = $1', [req.params.id]);
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

// ---- CATEGORIES ----
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE slug = ANY($1) ORDER BY display_order', [SOURCE_CATEGORY_SLUGS]);
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, slug, icon, description, displayOrder } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, slug, icon, description, display_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, slug, icon, description, displayOrder || 0]
    );
    res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, slug, icon, description, isActive, displayOrder } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name=$1, slug=$2, icon=$3, description=$4, is_active=$5, display_order=$6 WHERE id=$7 RETURNING *',
      [name, slug, icon, description, isActive !== false, displayOrder || 0, req.params.id]
    );
    res.json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ---- TESTIMONIALS ----
router.get('/testimonials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials ORDER BY display_order');
    res.json({ testimonials: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

router.post('/testimonials', async (req, res) => {
  try {
    const { name, role, company, avatarUrl, rating, content, displayOrder } = req.body;
    const result = await pool.query(
      'INSERT INTO testimonials (name, role, company, avatar_url, rating, content, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, role, company, avatarUrl, rating || 5, content, displayOrder || 0]
    );
    res.status(201).json({ testimonial: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

router.put('/testimonials/:id', async (req, res) => {
  try {
    const { name, role, company, avatarUrl, rating, content, isActive, displayOrder } = req.body;
    const result = await pool.query(
      'UPDATE testimonials SET name=$1, role=$2, company=$3, avatar_url=$4, rating=$5, content=$6, is_active=$7, display_order=$8 WHERE id=$9 RETURNING *',
      [name, role, company, avatarUrl, rating, content, isActive !== false, displayOrder || 0, req.params.id]
    );
    res.json({ testimonial: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

// ---- FAQs ----
router.get('/faqs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM faqs ORDER BY display_order');
    res.json({ faqs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

router.post('/faqs', async (req, res) => {
  try {
    const { question, answer, category, displayOrder } = req.body;
    const result = await pool.query(
      'INSERT INTO faqs (question, answer, category, display_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [question, answer, category || 'general', displayOrder || 0]
    );
    res.status(201).json({ faq: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

router.put('/faqs/:id', async (req, res) => {
  try {
    const { question, answer, category, isActive, displayOrder } = req.body;
    const result = await pool.query(
      'UPDATE faqs SET question=$1, answer=$2, category=$3, is_active=$4, display_order=$5 WHERE id=$6 RETURNING *',
      [question, answer, category, isActive !== false, displayOrder || 0, req.params.id]
    );
    res.json({ faq: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

router.delete('/faqs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ---- STATS ----
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stats ORDER BY display_order');
    res.json({ stats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.put('/stats/:id', async (req, res) => {
  try {
    const { label, value, icon, suffix, isActive, displayOrder } = req.body;
    const result = await pool.query(
      'UPDATE stats SET label=$1, value=$2, icon=$3, suffix=$4, is_active=$5, display_order=$6 WHERE id=$7 RETURNING *',
      [label, value, icon, suffix, isActive !== false, displayOrder || 0, req.params.id]
    );
    res.json({ stat: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stat' });
  }
});

// ---- USERS ----
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ---- ENROLLMENTS ----
router.get('/enrollments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.full_name, u.email, c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       ORDER BY e.enrolled_at DESC`
    );
    res.json({ enrollments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// ---- PAYMENTS ----
router.get('/payments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name, u.email, c.title as course_title
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN courses c ON p.course_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ---- MESSAGES ----
router.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ messages: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.put('/messages/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
