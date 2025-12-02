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
    // Get ANY request
    const result = await pool.query(`
      SELECT * FROM enrollment_requests ORDER BY created_at DESC LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('No requests found');
      await pool.end();
      return;
    }

    const request = result.rows[0];
    console.log('Request record:');
    console.log(JSON.stringify(request, null, 2));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
})();
