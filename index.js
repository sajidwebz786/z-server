const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const pool = require('./config/db');
const { initModels } = require('./models');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const settingsRoutes = require('./routes/settings');
const trainingProgramsRoutes = require('./routes/trainingPrograms');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/training-programs', trainingProgramsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Initialize database and start server
async function initDB() {
  try {
    await initModels();
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected at:', result.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Starting server without DB connection...');
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Zulanex server running on port ${PORT}`);
  });
});

module.exports = app;
