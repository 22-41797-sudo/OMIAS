require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='teachers' 
    ORDER BY ordinal_position
`).then(result => {
    console.log('Teachers table columns:');
    result.rows.forEach(row => {
        console.log(`  ${row.column_name} (${row.data_type})`);
    });
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
