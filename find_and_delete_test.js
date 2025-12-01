const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ICTCOORdb',
    password: 'bello0517',
    port: 5432
});

async function findTestStudent() {
    try {
        const res = await pool.query(`
            SELECT id, lrn, last_name, first_name, grade_level 
            FROM early_registration 
            WHERE lrn LIKE '%333%' OR last_name LIKE '%333%'
        `);
        console.log('Found records:');
        console.log(res.rows);
        
        if (res.rows.length > 0) {
            const id = res.rows[0].id;
            console.log(`\nDeleting record with ID ${id}...`);
            await pool.query('DELETE FROM early_registration WHERE id = $1', [id]);
            console.log('✅ Deleted successfully');
        }
        
        await pool.end();
    } catch (e) { 
        console.error(e.message);
        process.exit(1);
    }
}

findTestStudent();
