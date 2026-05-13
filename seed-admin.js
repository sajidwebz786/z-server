const bcrypt = require('bcryptjs');
const pool = require('./config/db');
require('dotenv').config();

async function seedAdmin() {
  try {
    const adminEmail = 'admin@zulanex.com';
    const adminPassword = 'Admin@123456';
    const adminName = 'Zulanex Admin';

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (existing.rows.length > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role, is_verified, created_at, updated_at) VALUES ($1, $2, $3, 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      [adminName, adminEmail, passwordHash]
    );

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Please change the password after first login.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
