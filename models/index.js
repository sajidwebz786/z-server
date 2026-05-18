const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const defineTimestamps = {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const User = sequelize.define('User', {
  full_name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: DataTypes.STRING(255),
  phone: DataTypes.STRING(20),
  avatar_url: DataTypes.TEXT,
  oauth_provider: DataTypes.STRING(50),
  oauth_id: DataTypes.STRING(255),
  role: { type: DataTypes.ENUM('student', 'admin'), defaultValue: 'student' },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { ...defineTimestamps, tableName: 'users' });

const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  icon: DataTypes.STRING(100),
  description: DataTypes.TEXT,
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false, tableName: 'categories' });

const Course = sequelize.define('Course', {
  title: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  short_description: DataTypes.TEXT,
  full_description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  original_price: DataTypes.DECIMAL(10, 2),
  currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
  duration: DataTypes.STRING(100),
  level: { type: DataTypes.STRING(50), defaultValue: 'Beginner' },
  thumbnail_url: DataTypes.TEXT,
  banner_url: DataTypes.TEXT,
  instructor_name: DataTypes.STRING(255),
  instructor_bio: DataTypes.TEXT,
  instructor_avatar: DataTypes.TEXT,
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 4.5 },
  total_students: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_hours: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_lectures: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_bestseller: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { ...defineTimestamps, tableName: 'courses' });

const CourseHighlight = sequelize.define('CourseHighlight', {
  highlight: { type: DataTypes.TEXT, allowNull: false },
  icon: DataTypes.STRING(100),
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'course_highlights' });

const CourseCurriculum = sequelize.define('CourseCurriculum', {
  module_title: { type: DataTypes.STRING(255), allowNull: false },
  module_description: DataTypes.TEXT,
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'course_curriculum' });

const CurriculumLesson = sequelize.define('CurriculumLesson', {
  title: { type: DataTypes.STRING(255), allowNull: false },
  duration: DataTypes.STRING(50),
  type: { type: DataTypes.STRING(50), defaultValue: 'video' },
  is_preview: { type: DataTypes.BOOLEAN, defaultValue: false },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'curriculum_lessons' });

const CourseLearningOutcome = sequelize.define('CourseLearningOutcome', {
  outcome: { type: DataTypes.TEXT, allowNull: false },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'course_learning_outcomes' });

const CourseRequirement = sequelize.define('CourseRequirement', {
  requirement: { type: DataTypes.TEXT, allowNull: false },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'course_requirements' });

const Testimonial = sequelize.define('Testimonial', {
  name: { type: DataTypes.STRING(255), allowNull: false },
  role: DataTypes.STRING(255),
  company: DataTypes.STRING(255),
  avatar_url: DataTypes.TEXT,
  rating: { type: DataTypes.INTEGER, defaultValue: 5 },
  content: { type: DataTypes.TEXT, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false, tableName: 'testimonials' });

const Enrollment = sequelize.define('Enrollment', {
  enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'completed', 'cancelled'), defaultValue: 'active' },
}, { underscored: true, timestamps: false, tableName: 'enrollments', indexes: [{ unique: true, fields: ['user_id', 'course_id'] }] });

const Payment = sequelize.define('Payment', {
  razorpay_order_id: DataTypes.STRING(255),
  razorpay_payment_id: DataTypes.STRING(255),
  razorpay_signature: DataTypes.STRING(255),
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
}, { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false, tableName: 'payments' });

const ContactMessage = sequelize.define('ContactMessage', {
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: DataTypes.STRING(20),
  subject: DataTypes.STRING(255),
  message: { type: DataTypes.TEXT, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false, tableName: 'contact_messages' });

const SiteSetting = sequelize.define('SiteSetting', {
  setting_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  setting_value: DataTypes.TEXT,
}, { underscored: true, timestamps: true, createdAt: false, updatedAt: 'updated_at', tableName: 'site_settings' });

const Gallery = sequelize.define('Gallery', {
  title: DataTypes.STRING(255),
  image_url: { type: DataTypes.TEXT, allowNull: false },
  category: DataTypes.STRING(100),
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: false, tableName: 'gallery' });

const FAQ = sequelize.define('FAQ', {
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING(100), defaultValue: 'general' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { underscored: true, timestamps: false, tableName: 'faqs' });

const Stat = sequelize.define('Stat', {
  label: { type: DataTypes.STRING(255), allowNull: false },
  value: { type: DataTypes.INTEGER, allowNull: false },
  icon: DataTypes.STRING(100),
  suffix: { type: DataTypes.STRING(20), defaultValue: '+' },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { underscored: true, timestamps: false, tableName: 'stats' });

const TrainingProgram = sequelize.define('TrainingProgram', {
  title: { type: DataTypes.STRING(255), allowNull: false },
  duration: { type: DataTypes.STRING(100), allowNull: false },
  tagline: DataTypes.STRING(255),
  color: { type: DataTypes.STRING(50), defaultValue: '#0066cc' },
  features: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
  is_popular: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { ...defineTimestamps, tableName: 'training_programs' });

Category.hasMany(Course, { foreignKey: 'category_id' });
Course.belongsTo(Category, { foreignKey: 'category_id' });
Course.hasMany(CourseHighlight, { foreignKey: 'course_id' });
Course.hasMany(CourseCurriculum, { foreignKey: 'course_id' });
Course.hasMany(CourseLearningOutcome, { foreignKey: 'course_id' });
Course.hasMany(CourseRequirement, { foreignKey: 'course_id' });
CourseCurriculum.hasMany(CurriculumLesson, { foreignKey: 'module_id' });
User.hasMany(Enrollment, { foreignKey: 'user_id' });
Course.hasMany(Enrollment, { foreignKey: 'course_id' });
User.hasMany(Payment, { foreignKey: 'user_id' });
Course.hasMany(Payment, { foreignKey: 'course_id' });

const categories = [
  ['Student Pass', 'student-pass', 'FaGraduationCap', 'Trial pass learning with selected courses and participation certificate', 1],
  ['Career Pass', 'career-pass', 'FaBriefcase', 'Career Boost with resume support, mock interviews, internship projects, and placement training', 2],
  ['Success Pass', 'success-pass', 'FaStar', 'Elite Success Pro with mentorship, live domain projects, portfolio building, and priority support', 3],
  ['AI Implementation', 'ai-implementation', 'FaBrain', 'AI-powered tools and future-ready practical learning', 4],
  ['Live Domain Projects', 'live-domain-projects', 'FaLaptopCode', 'Real project work that builds portfolios and job confidence', 5],
  ['Career & Placement', 'career-placement', 'FaBriefcase', 'Interview, resume, communication, and placement readiness', 6],
  ['Industry-Ready Courses', 'industry-ready-courses', 'FaBook', 'Industry-ready courses listed in the Zulanex source materials', 7],
];

const courses = [
  ['Zulanex Student Pass - Trial Pass', 'trial-pass', 'Explore selected courses, limited live classes, skill assessments, community support, and certificate of participation.', 'A 7-day trial pass based on the Zulanex Student Pass source materials.', 1, 99, null, '7 Days', 'Trial', '/src/assets/zulanex-student-pass.jpeg', 'Zulanex Mentors', 'Mentor support for practical, job-ready learning.', 4.6, 0, 0, 0, true, false, 1],
  ['Zulanex Career Boost', 'career-boost', 'Six months access with trending tech courses, resume building support, mock interviews, internship projects, placement training, and dedicated support.', 'A career pass based on the Student Pass source materials: skill up, stand out, get hired.', 2, 2999, null, '6 Months', 'Job Ready', '/src/assets/zulanex-student-pass.jpeg', 'Zulanex Career Team', 'Career mentors, trainers, and placement support.', 4.8, 0, 0, 0, true, true, 2],
  ['Zulanex Elite Success Pro', 'elite-success-pro', 'One year access with 1:1 mentorship, live domain projects, portfolio building, HR interview mastery, global job-ready program, and priority support.', 'A success pass based on the Student Pass source materials: master, build, and succeed globally.', 3, 4999, null, '1 Year', 'Advanced', '/src/assets/zulanex-student-pass.jpeg', 'Zulanex Elite Mentors', 'Mentors supporting portfolio, HR interview, and job-ready preparation.', 4.9, 0, 0, 0, true, true, 3],
  ['AI-Powered Job Ready Bootcamp', 'ai-job-ready-bootcamp', 'Affordable, practical, job-focused AI implementation learning for rural and urban students.', 'A job-focused bootcamp model based on practical learning, real projects, expert mentors, AI tools, resume building, mock interviews, and placement support.', 4, 99, null, 'Bootcamp', 'Job Ready', '/src/assets/zulanex-student-pass.jpeg', 'Zulanex AI Mentors', 'AI implementation trainers and career mentors.', 4.9, 0, 0, 0, true, true, 4],
];

async function seedDefaults() {
  for (const [name, slug, icon, description, display_order] of categories) {
    await Category.findOrCreate({ where: { slug }, defaults: { name, icon, description, display_order } });
  }

  for (const item of courses) {
    const [title, slug, short_description, full_description, category_id, price, original_price, duration, level, thumbnail_url, instructor_name, instructor_bio, rating, total_students, total_hours, total_lectures, is_featured, is_bestseller, display_order] = item;
    await Course.findOrCreate({
      where: { slug },
      defaults: { title, short_description, full_description, category_id, price, original_price, duration, level, thumbnail_url, instructor_name, instructor_bio, rating, total_students, total_hours, total_lectures, is_featured, is_bestseller, display_order },
    });
  }

  const programs = [
    ['Trial Pass', '7 Days', 'Explore. Learn. Experience.', '#0b8f45', ['Access to selected courses', 'Limited live classes', 'Skill assessments', 'Community support', 'Certificate of participation'], false, 1],
    ['Career Boost', '6 Months', 'Skill up. Stand out. Get hired.', '#0057d8', ['Trending tech courses', 'Resume building support', 'Mock interviews', 'Internship projects', 'Placement training', 'Dedicated support'], true, 2],
    ['Elite Success Pro', '1 Year', 'Master. Build. Succeed globally.', '#5a18a8', ['1:1 mentorship', 'Live domain projects', 'Portfolio building', 'HR interview mastery', 'Global job-ready program', 'Priority support'], false, 3],
  ];

  for (const [title, duration, tagline, color, features, is_popular, display_order] of programs) {
    await TrainingProgram.findOrCreate({ where: { title }, defaults: { duration, tagline, color, features, is_popular, display_order } });
  }

  const settings = {
    site_name: 'Zulanex',
    site_tagline: 'Learn skills. Get job ready. Grow career.',
    contact_email: 'info@zulanex.com',
    contact_phone: '+91 93815 56648',
    whatsapp_number: '9381556648',
    address: 'India - Online learning for rural and urban students',
    google_maps_embed: '',
    facebook_url: '#',
    twitter_url: '#',
    linkedin_url: '#',
    instagram_url: '#',
    youtube_url: '#',
    lms_portal_url: '/lms',
  };
  for (const [setting_key, setting_value] of Object.entries(settings)) {
    await SiteSetting.findOrCreate({ where: { setting_key }, defaults: { setting_value } });
  }

  const statRows = [
    ['Learners', 500, 'FaGraduationCap', '+', 1],
    ['Hiring Partners', 25, 'FaBook', '+', 2],
    ['Training Experts', 40, 'FaChalkboardTeacher', '+', 3],
    ['Project Tracks', 80, 'FaChartLine', '+', 4],
  ];
  for (const [label, value, icon, suffix, display_order] of statRows) {
    const [stat] = await Stat.findOrCreate({ where: { label }, defaults: { value, icon, suffix, display_order } });
    await stat.update({ value, icon, suffix, display_order, is_active: true });
  }
}

async function initModels() {
  await sequelize.sync();
  await seedDefaults();
}

module.exports = {
  sequelize,
  initModels,
  User,
  Category,
  Course,
  CourseHighlight,
  CourseCurriculum,
  CurriculumLesson,
  CourseLearningOutcome,
  CourseRequirement,
  Testimonial,
  Enrollment,
  Payment,
  ContactMessage,
  SiteSetting,
  Gallery,
  FAQ,
  Stat,
  TrainingProgram,
};
