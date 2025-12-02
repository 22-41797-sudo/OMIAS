require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

console.log('Checking teachers table schema...\n');

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
    
    // Now try a test query
    console.log('\n\nTrying to SELECT all columns from teachers...');
    return pool.query('SELECT * FROM teachers LIMIT 1');
}).then(result => {
    if (result.rows.length > 0) {
        console.log('\nFirst teacher record keys:');
        console.log(Object.keys(result.rows[0]));
        console.log('\nFirst teacher record:');
        console.log(result.rows[0]);
    } else {
        console.log('No teachers found');
    }
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    console.error('Details:', err);
    process.exit(1);
});
