const { Pool } = require('pg');
const pool = new Pool({
  host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
  port: 5432,
  user: 'omias_user',
  password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
  database: 'omias',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Update all NULL statuses to 'pending'
    const result = await pool.query(
      'UPDATE enrollment_requests SET status = $1 WHERE status IS NULL RETURNING id, request_token, status',
      ['pending']
    );
    
    console.log(`Updated ${result.rows.length} enrollment records with NULL status to 'pending':`);
    result.rows.forEach(row => {
      console.log(`  - Token: ${row.request_token}, Status: ${row.status}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
