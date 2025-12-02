// Seed sections script
const { Pool } = require('pg');
require('dotenv').config();

const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.render.com');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDB ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

async function seedSections() {
    try {
        console.log('📚 Checking sections table...');
        
        // Check if sections exist
        const checkResult = await pool.query('SELECT COUNT(*) as cnt FROM sections');
        const sectionCount = parseInt(checkResult.rows[0].cnt);
        
        console.log(`   Found ${sectionCount} existing sections`);
        
        if (sectionCount < 18) {
            console.log('🌱 Seeding 18 sections...');
            
            await pool.query(`
                INSERT INTO sections (grade_level, section_name, max_capacity, adviser_name, room_number, is_active) VALUES
                -- Kindergarten sections
                ('Kindergarten', 'angel', 35, 'Mrs. Maria Santos', 'Room 101', true),
                ('Kindergarten', 'dahlia', 35, 'Mrs. Rosa Garcia', 'Room 102', true),
                ('Kindergarten', 'lily', 35, 'Mrs. Anna Reyes', 'Room 103', true),
                ('Kindergarten', 'santan', 35, 'Mrs. Isabel Cruz', 'Room 104', true),
                -- Grade 1 sections
                ('Grade 1', 'rosal', 40, 'Mr. Juan Dela Cruz', 'Room 201', true),
                ('Grade 1', 'rose', 40, 'Mrs. Maria Rodriguez', 'Room 202', true),
                -- Grade 2 sections
                ('Grade 2', 'camia', 40, 'Mr. Carlos Lopez', 'Room 301', true),
                ('Grade 2', 'daisy', 40, 'Mrs. Elena Martinez', 'Room 302', true),
                ('Grade 2', 'lirio', 40, 'Mr. Pedro Gonzales', 'Room 303', true),
                -- Grade 3 sections
                ('Grade 3', 'adelfa', 40, 'Mrs. Angela Fernandez', 'Room 401', true),
                ('Grade 3', 'orchids', 40, 'Mr. Ricardo Torres', 'Room 402', true),
                -- Grade 4 sections
                ('Grade 4', 'ilang-ilang', 40, 'Mrs. Sophia Ramirez', 'Room 501', true),
                ('Grade 4', 'sampaguita', 40, 'Mr. Daniel Flores', 'Room 502', true),
                -- Grade 5 sections
                ('Grade 5', 'blueberry', 45, 'Mrs. Jasmine Valdez', 'Room 601', true),
                ('Grade 5', 'everlasting', 45, 'Mr. Vincent Morales', 'Room 602', true),
                -- Grade 6 sections
                ('Grade 6', 'cattleya', 45, 'Mrs. Patricia Santos', 'Room 701', true),
                ('Grade 6', 'sunflower', 45, 'Mr. Christopher Ramos', 'Room 702', true),
                -- Non-Graded section
                ('Non-Graded', 'tulips', 30, 'Mrs. Elizabeth Ortega', 'Room 801', true)
                ON CONFLICT (section_name) DO NOTHING
            `);
            
            console.log('✅ Sections seeded successfully!');
        } else {
            console.log('✅ Sections already exist');
        }
        
        // Verify
        const verifyResult = await pool.query('SELECT COUNT(*) as cnt FROM sections');
        console.log(`\n✨ Total sections now: ${verifyResult.rows[0].cnt}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding sections:', err.message);
        process.exit(1);
    }
}

seedSections();
