const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkStudentData() {
    try {
        const result = await pool.query(`
            SELECT id, full_name, gmail_address, father_name, mother_name, guardian_name 
            FROM students 
            WHERE full_name LIKE '%Darvin%' OR full_name LIKE '%Prudenciado%'
            LIMIT 5
        `);
        
        console.log(`Found ${result.rows.length} student(s):\n`);
        result.rows.forEach(student => {
            console.log('Student:', student.full_name);
            console.log('  ID:', student.id);
            console.log('  Gmail:', student.gmail_address || '(NULL)');
            console.log('  Father:', student.father_name || '(NULL)');
            console.log('  Mother:', student.mother_name || '(NULL)');
            console.log('  Guardian:', student.guardian_name || '(NULL)');
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkStudentData();
