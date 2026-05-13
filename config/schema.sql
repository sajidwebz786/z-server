-- Zulanex Database Schema
-- Database: academydb

-- Create database (run this first if not exists)
-- CREATE DATABASE academydb;

-- Users table (students and admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  duration VARCHAR(100),
  level VARCHAR(50) DEFAULT 'Beginner',
  thumbnail_url TEXT,
  banner_url TEXT,
  instructor_name VARCHAR(255),
  instructor_bio TEXT,
  instructor_avatar TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  total_students INT DEFAULT 0,
  total_hours INT DEFAULT 0,
  total_lectures INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course highlights/features
CREATE TABLE IF NOT EXISTS course_highlights (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  highlight TEXT NOT NULL,
  icon VARCHAR(100),
  display_order INT DEFAULT 0
);

-- Course curriculum (modules and lessons)
CREATE TABLE IF NOT EXISTS course_curriculum (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  module_title VARCHAR(255) NOT NULL,
  module_description TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id SERIAL PRIMARY KEY,
  module_id INT REFERENCES course_curriculum(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration VARCHAR(50),
  type VARCHAR(50) DEFAULT 'video',
  is_preview BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0
);

-- Course what-you-learn items
CREATE TABLE IF NOT EXISTS course_learning_outcomes (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Course requirements
CREATE TABLE IF NOT EXISTS course_requirements (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  company VARCHAR(255),
  avatar_url TEXT,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  UNIQUE(user_id, course_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  course_id INT REFERENCES courses(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site settings
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success stories / Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  image_url TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0
);

-- Stats / Counters
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  value INT NOT NULL,
  icon VARCHAR(100),
  suffix VARCHAR(20) DEFAULT '+',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Training Programs (Trial Pass, Career Boost, Elite Success Pro)
CREATE TABLE IF NOT EXISTS training_programs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  tagline VARCHAR(255),
  color VARCHAR(50) DEFAULT '#42a5f5',
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default training programs
INSERT INTO training_programs (title, duration, tagline, color, features, is_popular, display_order) VALUES
  ('Trial Pass', '7 Days', 'Explore. Learn. Experience.', '#42a5f5',
   ARRAY['Access to selected courses','Limited live classes','Skill assessments','Community support','Certificate of participation'], false, 1),
  ('Career Boost', '6 Months', 'Skill Up. Stand Out. Get Hired.', '#00e676',
   ARRAY['Trending tech courses','Resume building support','Mock interviews','Internship projects','Placement training','Dedicated support'], true, 2),
  ('Elite Success Pro', '1 Year', 'Master. Build. Succeed Globally.', '#ce93d8',
   ARRAY['1:1 mentorship','Live domain projects','Portfolio building','HR interview mastery','Global job-ready program','Priority support'], false, 3)
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, icon, description, display_order) VALUES
  ('Fullstack Development', 'fullstack', 'FaCode', 'Master full-stack development with modern frameworks', 1),
  ('Python', 'python', 'FaPython', 'Learn Python for web, data science, and automation', 2),
  ('AI Implementation', 'ai-implementation', 'FaBrain', 'AI-powered tools and future-ready practical learning', 3),
  ('Data Science & AI', 'data-science-ai', 'FaBrain', 'Data science, machine learning, and artificial intelligence', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert default courses
INSERT INTO courses (title, slug, short_description, full_description, category_id, price, original_price, duration, level, thumbnail_url, instructor_name, instructor_bio, rating, total_students, total_hours, total_lectures, is_featured, is_bestseller) VALUES
  ('Python Full Stack', 'python-full-stack', 'Python Full Stack listed in source materials', 'Industry-ready Python Full Stack learning listed in the source materials.', 1, 5999.00, 12999.00, '6 Months', 'Beginner to Advanced', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600', 'Zulanex Mentors', 'Industry mentors focused on job-ready learning', 4.8, 1250, 120, 85, true, true),
  ('Fullstack Java Development', 'fullstack-java', 'Java, Spring Boot, Microservices & React', 'Complete Java fullstack development with Spring Boot, REST APIs, Microservices architecture, and React frontend. Industry-ready skills.', 1, 6999.00, 14999.00, '6 Months', 'Beginner to Advanced', 'https://images.unsplash.com/photo-1517694712202-14dd9938aa97?w=600', 'Priya Sharma', 'Java Architect with 10+ years at top MNCs', 4.7, 980, 130, 92, true, false),
  ('AI Implementation', 'ai-implementation-course', 'AI implementation and practical learning', 'AI-powered tools and future-ready learning listed in the source materials.', 1, 6499.00, 13999.00, '6 Months', 'Intermediate', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600', 'Zulanex AI Mentors', 'AI implementation trainers and career mentors', 4.6, 720, 125, 88, true, false),
  ('Python Fullstack Development', 'python-fullstack', 'Python, Django, Flask & React Frontend', 'Master Python for full-stack web development. Django, Flask, REST APIs, PostgreSQL, and modern React frontend development.', 2, 5499.00, 11999.00, '6 Months', 'Beginner to Advanced', 'https://images.unsplash.com/photo-1526379099098-d400fd0bf935?w=600', 'Sneha Reddy', 'Python Developer & Data Engineer, IIT Alumni', 4.9, 1580, 115, 80, true, true),
  ('Python for Data Science', 'python-data-science', 'Python, Pandas, NumPy, Matplotlib & Scikit-learn', 'Data analysis and visualization with Python. Pandas, NumPy, Matplotlib, Seaborn, and machine learning basics with Scikit-learn.', 2, 4999.00, 9999.00, '7 Days', 'Beginner', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', 'Vikram Singh', 'Data Scientist at Fortune 500, PhD in ML', 4.8, 2100, 80, 60, false, false),
  ('Live Domain Projects', 'live-domain-projects-course', 'Live domain projects and industry tools', 'Work on live domain projects, industry tools, and reviewed project tasks.', 3, 7999.00, 16999.00, '7 Days', 'Beginner to Intermediate', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'Zulanex Project Mentors', 'Live project and internship mentors', 4.7, 650, 100, 70, true, true),
  ('Career & Placement Support', 'career-placement-support', 'Resume, mock interviews, and placement support', 'Advanced Career & Placement Support. Server-side & client-side scripting, Scoped Apps, REST APIs, and MID Server configuration.', 3, 8999.00, 18999.00, '6 Months', 'Intermediate to Advanced', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600', 'Zulanex Career Team', 'Career mentors and placement support', 4.6, 420, 110, 78, false, false),
  ('Data Science with AI', 'data-science-ai', 'ML, Skill Up. Stand Out. Get Hired., NLP & Computer Vision', 'Complete Data Science and AI bootcamp. Machine Learning, Skill Up. Stand Out. Get Hired. with TensorFlow/PyTorch, NLP, Computer Vision, and GenAI.', 4, 9999.00, 21999.00, '6 Months', 'Intermediate to Advanced', 'https://images.unsplash.com/photo-1677442136019-21780ecad999?w=600', 'Dr. Meera Krishnan', 'AI Researcher, Former Google Brain Team', 4.9, 1850, 150, 110, true, true),
  ('AI & Machine Learning', 'ai-machine-learning', 'TensorFlow, PyTorch & Production ML', 'Hands-on AI and ML engineering. Build, train, and deploy machine learning models in production. MLOps and cloud deployment.', 4, 8499.00, 17999.00, '6 Months', 'Advanced', 'https://images.unsplash.com/photo-1485827404703-89b55fcc599e?w=600', 'Rohan Iyer', 'ML Engineer at FAANG, Stanford Alumni', 4.8, 780, 120, 85, false, false)
ON CONFLICT (slug) DO NOTHING;

-- Insert course highlights
INSERT INTO course_highlights (course_id, highlight, icon, display_order)
SELECT c.id, h.highlight, h.icon, h.ord
FROM courses c
CROSS JOIN (VALUES
  ('Live Project Training', 'FaCalendar', 1),
  ('Industry Training Experts', 'FaUserTie', 2),
  ('Hands-on Real Projects', 'FaProjectDiagram', 3),
  ('Placement Assistance', 'FaBriefcase', 4),
  ('Certificate of Completion', 'FaCertificate', 5),
  ('Learn Anytime Anywhere', 'FaInfinity', 6)
) AS h(highlight, icon, ord)
WHERE c.slug = 'python-full-stack'
ON CONFLICT DO NOTHING;

INSERT INTO course_highlights (course_id, highlight, icon, display_order)
SELECT c.id, h.highlight, h.icon, h.ord
FROM courses c
CROSS JOIN (VALUES
  ('100 Days Live Project Training', 'FaCalendar', 1),
  ('Spring Boot & Microservices', 'FaCogs', 2),
  ('Industry Training Experts', 'FaUserTie', 3),
  ('Placement Assistance', 'FaBriefcase', 4),
  ('Certificate of Completion', 'FaCertificate', 5),
  ('Learn Anytime Anywhere', 'FaInfinity', 6)
) AS h(highlight, icon, ord)
WHERE c.slug = 'fullstack-java'
ON CONFLICT DO NOTHING;

-- Insert testimonials
INSERT INTO testimonials (name, role, company, avatar_url, rating, content, display_order) VALUES
  ('Ravi Teja', 'Software Engineer', 'TCS', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 5, 'Zulanex transformed my career. The practical learning and project support helped me prepare with confidence.', 1),
  ('Priyanka Das', 'Full Stack Developer', 'Infosys', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 5, 'Best investment I ever made. The hands-on projects gave me real-world experience that helped me crack interviews easily.', 2),
  ('Mohammed Imran', 'Data Scientist', 'Wipro', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 5, 'The Data Science with AI course is top-notch. Dr. Meera explains complex concepts so simply. Highly recommended!', 3),
  ('Sruthi Menon', 'Project Intern', 'Capgemini', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 4, 'The certification and project internship support helped me build a stronger profile.', 4),
  ('Aditya Sharma', 'Java Developer', 'HCL', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 5, 'The Java Fullstack course is comprehensive and practical. The instructors are very supportive and knowledgeable.', 5),
  ('Kavitha Rao', 'Python Developer', 'Tech Mahindra', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 5, 'From zero coding knowledge to a Python developer in 3 months. Zulanex made it possible!', 6)
ON CONFLICT DO NOTHING;

-- Insert FAQs
INSERT INTO FAQs (question, answer, category, display_order) VALUES
  ('What is included in the Trial Pass?', 'Our Trial Pass is a focused 2-month program covering core fundamentals of your chosen technology. It includes hands-on mini projects, industry best practices, and a certificate of completion.', 'general', 1),
  ('What is included in Career Boost?', 'The Career Boost is a comprehensive 4-month program with an advanced curriculum, live industry projects, 1-on-1 mentorship from experts, and dedicated placement assistance. You get lifetime access to all course materials.', 'general', 2),
  ('What is included in Elite Success Pro?', 'Elite Success Pro includes 1:1 mentorship, live domain projects, portfolio building, HR interview mastery, global job-ready program, and priority support.', 'general', 3),
  ('Does Zulanex include project internships?', 'Yes. The source materials describe live domain specific project internships, project documents, task list plans, internship certificate, and reviewed project work.', 'general', 4),
  ('What prices are shown in the source materials?', 'The source materials show Trial Pass at ₹99, Career Boost at ₹3999, and Elite Success Pro at ₹5999.', 'payment', 5),
  ('Do I get certificates?', 'The source materials mention certified courses, industry-recognized certificates, certificate of participation, and internship certificates.', 'general', 6),
  ('What are the payment options?', 'We accept online payments through Razorpay supporting UPI, Credit/Debit Cards, Net Banking, and EMI options.', 'payment', 7),
  ('Is there any prerequisite for joining?', 'No specific prerequisites are needed. Our programs are designed for beginners as well as those looking to upskill. Basic computer literacy is sufficient.', 'general', 8)
ON CONFLICT DO NOTHING;

-- Insert stats
INSERT INTO stats (label, value, icon, suffix, display_order) VALUES
  ('Learners', 10000000, 'FaGraduationCap', '', 1),
  ('Top MNCs', 100, 'FaBook', '+', 2),
  ('Training Experts', 300, 'FaChalkboardTeacher', '+', 3),
  ('Start Ups', 2500, 'FaChartLine', '+', 4)
ON CONFLICT DO NOTHING;

-- Insert site settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('site_name', 'Zulanex'),
  ('site_tagline', 'Transform Your Career with Industry-Ready Skills'),
  ('contact_email', 'info@zulanex.com'),
  ('contact_phone', '9381556648'),
  ('whatsapp_number', '9381556648'),
  ('address', 'India - Online learning for rural and urban students'),
  ('google_maps_embed', ''),
  ('facebook_url', '#'),
  ('twitter_url', '#'),
  ('linkedin_url', '#'),
  ('instagram_url', '#'),
  ('youtube_url', '#'),
  ('lms_portal_url', '/lms')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);


