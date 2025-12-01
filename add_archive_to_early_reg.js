const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function addArchiveColumn() {
    const client = await pool.connect();
    try {
        // Check if column exists
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='early_registration' AND column_name='is_archived'
        `);

        if (checkResult.rows.length === 0) {
            console.log('Adding is_archived column to early_registration table...');
            await client.query('ALTER TABLE early_registration ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false');
            await client.query('CREATE INDEX IF NOT EXISTS idx_early_reg_is_archived ON early_registration(is_archived)');
            console.log('✅ Column added successfully!');
        } else {
            console.log('✅ is_archived column already exists in early_registration table');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addArchiveColumn();
