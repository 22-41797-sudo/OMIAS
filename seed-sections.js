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
                INSERT INTO sections (grade_level, section_name, is_active) VALUES
                -- Kindergarten sections
                ('Kindergarten', 'angel', true),
                ('Kindergarten', 'dahlia', true),
                ('Kindergarten', 'lily', true),
                ('Kindergarten', 'santan', true),
                -- Grade 1 sections
                ('Grade 1', 'rosal', true),
                ('Grade 1', 'rose', true),
                -- Grade 2 sections
                ('Grade 2', 'camia', true),
                ('Grade 2', 'daisy', true),
                ('Grade 2', 'lirio', true),
                -- Grade 3 sections
                ('Grade 3', 'adelfa', true),
                ('Grade 3', 'orchids', true),
                -- Grade 4 sections
                ('Grade 4', 'ilang-ilang', true),
                ('Grade 4', 'sampaguita', true),
                -- Grade 5 sections
                ('Grade 5', 'blueberry', true),
                ('Grade 5', 'everlasting', true),
                -- Grade 6 sections
                ('Grade 6', 'cattleya', true),
                ('Grade 6', 'sunflower', true),
                -- Non-Graded section
                ('Non-Graded', 'tulips', true)
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
