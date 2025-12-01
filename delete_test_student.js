// Script to delete test student record
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ICTCOORdb',
    password: process.env.DB_PASSWORD || 'bello0517',
    port: process.env.DB_PORT || 5432
});

async function deleteTestStudent() {
    const client = await pool.connect();
    try {
        console.log('Searching for test student with LRN "33333"...');
        
        // Check early_registration table
        const earlyRegCheck = await client.query(
            'SELECT id, lrn, last_name, first_name FROM early_registration WHERE lrn = $1',
            ['33333']
        );
        
        if (earlyRegCheck.rows.length > 0) {
            console.log('Found in early_registration:', earlyRegCheck.rows);
            const id = earlyRegCheck.rows[0].id;
            await client.query('DELETE FROM early_registration WHERE id = $1', [id]);
            console.log(`✅ Deleted from early_registration (ID: ${id})`);
        }
        
        // Check students table
        const studentsCheck = await client.query(
            'SELECT id, lrn, last_name, first_name FROM students WHERE lrn = $1',
            ['33333']
        );
        
        if (studentsCheck.rows.length > 0) {
            console.log('Found in students:', studentsCheck.rows);
            const id = studentsCheck.rows[0].id;
            await client.query('DELETE FROM students WHERE id = $1', [id]);
            console.log(`✅ Deleted from students (ID: ${id})`);
        }
        
        if (earlyRegCheck.rows.length === 0 && studentsCheck.rows.length === 0) {
            console.log('❌ No test student found with LRN "33333"');
        }
        
    } catch (err) {
        console.error('Error deleting test student:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

deleteTestStudent();
