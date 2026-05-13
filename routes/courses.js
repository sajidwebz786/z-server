const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const SOURCE_COURSE_SLUGS = ['trial-pass', 'career-boost', 'elite-success-pro', 'ai-job-ready-bootcamp'];
const SOURCE_CATEGORY_SLUGS = ['student-pass', 'career-pass', 'success-pass', 'ai-implementation', 'live-domain-projects', 'career-placement', 'industry-ready-courses', 'trending-tech'];

// Get all active courses
router.get('/', async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    let query = `SELECT c.*, cat.name as category_name, cat.slug as category_slug
                 FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.is_active = true AND c.slug = ANY($1)`;
    const params = [SOURCE_COURSE_SLUGS];

    if (category) {
      params.push(category);
      query += ` AND cat.slug = $${params.length}`;
    }
    if (featured === 'true') {
      query += ` AND c.is_featured = true`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.short_description ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.display_order ASC, c.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE is_active = true AND slug = ANY($1) ORDER BY display_order', [SOURCE_CATEGORY_SLUGS]);
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get testimonials
router.get('/meta/testimonials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials WHERE is_active = true ORDER BY display_order');
    res.json({ testimonials: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get FAQs
router.get('/meta/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM faqs WHERE is_active = true';
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY display_order';
    const result = await pool.query(query, params);
    res.json({ faqs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Get stats
router.get('/meta/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stats WHERE is_active = true ORDER BY display_order');
    res.json({ stats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single course by slug
router.get('/:slug', async (req, res) => {
  try {
    const courseResult = await pool.query(
      `SELECT c.*, cat.name as category_name, cat.slug as category_slug
       FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = $1 AND c.slug = ANY($2) AND c.is_active = true`,
      [req.params.slug, SOURCE_COURSE_SLUGS]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    const [highlights, curriculum, outcomes, requirements] = await Promise.all([
      pool.query('SELECT * FROM course_highlights WHERE course_id = $1 ORDER BY display_order', [course.id]),
      pool.query(`SELECT cc.*, 
        (SELECT json_agg(cl.* ORDER BY cl.display_order) FROM curriculum_lessons cl WHERE cl.module_id = cc.id) as lessons
        FROM course_curriculum cc WHERE cc.course_id = $1 ORDER BY cc.display_order`, [course.id]),
      pool.query('SELECT * FROM course_learning_outcomes WHERE course_id = $1 ORDER BY display_order', [course.id]),
      pool.query('SELECT * FROM course_requirements WHERE course_id = $1 ORDER BY display_order', [course.id]),
    ]);

    // Get related courses
    const related = await pool.query(
      `SELECT id, title, slug, short_description, price, original_price, thumbnail_url, rating, duration, instructor_name
       FROM courses WHERE category_id = $1 AND id != $2 AND slug = ANY($3) AND is_active = true LIMIT 4`,
      [course.category_id, course.id, SOURCE_COURSE_SLUGS]
    );

    res.json({
      course,
      highlights: highlights.rows,
      curriculum: curriculum.rows,
      outcomes: outcomes.rows,
      requirements: requirements.rows,
      relatedCourses: related.rows,
    });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Get testimonials
router.get('/meta/testimonials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonials WHERE is_active = true ORDER BY display_order');
    res.json({ testimonials: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get FAQs
router.get('/meta/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM faqs WHERE is_active = true';
    const params = [];
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    query += ' ORDER BY display_order';
    const result = await pool.query(query, params);
    res.json({ faqs: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Get stats
router.get('/meta/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stats WHERE is_active = true ORDER BY display_order');
    res.json({ stats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
