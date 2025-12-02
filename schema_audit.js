require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        console.log('=== DATABASE SCHEMA AUDIT ===\n');
        
        // Check teachers table
        console.log('TEACHERS TABLE:');
        const teachersCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='teachers' ORDER BY ordinal_position
        `);
        console.log(teachersCols.rows.map(r => r.column_name).join(', '));
        
        // Check students table
        console.log('\nSTUDENTS TABLE:');
        const studentsCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='students' ORDER BY ordinal_position
        `);
        console.log(studentsCols.rows.map(r => r.column_name).join(', '));
        
        // Check sections table
        console.log('\nSECTIONS TABLE:');
        const sectionsCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='sections' ORDER BY ordinal_position
        `);
        console.log(sectionsCols.rows.map(r => r.column_name).join(', '));
        
        // Check early_registration table
        console.log('\nEARLY_REGISTRATION TABLE:');
        const erCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='early_registration' ORDER BY ordinal_position
        `);
        console.log(erCols.rows.map(r => r.column_name).join(', '));
        
        // Check teachers_archive table exists
        console.log('\nTEACHERS_ARCHIVE TABLE EXISTS?');
        const archExists = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name='teachers_archive'
            ) AS exists
        `);
        console.log(archExists.rows[0].exists ? 'YES' : 'NO');
        
        if (archExists.rows[0].exists) {
            console.log('TEACHERS_ARCHIVE COLUMNS:');
            const archCols = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='teachers_archive' ORDER BY ordinal_position
            `);
            console.log(archCols.rows.map(r => r.column_name).join(', '));
        }
        
        console.log('\n✅ Schema audit complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkSchema();
