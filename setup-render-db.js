// Setup Render Database - Run this to initialize the Render PostgreSQL database
// Usage: DATABASE_URL="your_render_url" node setup-render-db.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
    try {
        console.log('🔄 Setting up Render database schema...\n');

        // Create students table
        console.log('📋 Creating students table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100),
                middle_name VARCHAR(100),
                last_name VARCHAR(100),
                grade_level VARCHAR(50),
                section_id INTEGER,
                current_address TEXT,
                enrollment_status VARCHAR(50) DEFAULT 'active',
                has_been_assigned BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ students table ready');

        // Create sections table
        console.log('📋 Creating sections table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                section_name VARCHAR(100) UNIQUE,
                grade_level VARCHAR(50),
                adviser_id INTEGER,
                max_capacity INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ sections table ready');

        // Create users table
        console.log('📋 Creating users table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ users table ready');

        // Create ictcoor account if it doesn't exist
        console.log('👤 Creating ictcoor account...');
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await pool.query(
            `INSERT INTO users (username, password, role) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (username) DO NOTHING`,
            ['ictcoor', hashedPassword, 'ictcoor']
        );
        console.log('   ✅ ictcoor account ready');

        // Create snapshot tables
        console.log('📋 Creating snapshot tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name VARCHAR(255) NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT false
            )
        `);
        console.log('   ✅ section_snapshot_groups ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name VARCHAR(100),
                grade_level VARCHAR(50),
                count INTEGER,
                adviser_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_items ready');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_students (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name VARCHAR(100),
                student_name VARCHAR(255),
                current_address TEXT,
                barangay VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('   ✅ section_snapshot_students ready');

        console.log('\n✨ Database initialization completed successfully!');
        console.log('📍 You can now log in at https://omias-1.onrender.com/login');
        console.log('   Username: ictcoor');
        console.log('   Password: admin123\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up database:', err.message);
        process.exit(1);
    }
}

setupDatabase();
