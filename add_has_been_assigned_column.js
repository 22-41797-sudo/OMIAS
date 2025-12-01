// Script to add has_been_assigned flag to students table
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ICTCOORdb',
    password: process.env.DB_PASSWORD || 'bello0517',
    port: process.env.DB_PORT || 5432
});

async function addHasBeenAssignedColumn() {
    const client = await pool.connect();
    try {
        console.log('Adding has_been_assigned column to students table...');
        
        // Add the column if it doesn't exist
        await client.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS has_been_assigned BOOLEAN DEFAULT false
        `);
        
        // Set has_been_assigned = true for students who currently have a section_id
        await client.query(`
            UPDATE students 
            SET has_been_assigned = true 
            WHERE section_id IS NOT NULL
        `);
        
        console.log('✅ Column added and updated successfully!');
        
        // Show the result
        const result = await client.query('SELECT COUNT(*) as total, SUM(CASE WHEN has_been_assigned THEN 1 ELSE 0 END) as assigned FROM students');
        console.log(`Total students: ${result.rows[0].total}, Ever assigned: ${result.rows[0].assigned}`);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addHasBeenAssignedColumn();
