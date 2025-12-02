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
    const token = 'ZBC5-5696-2J8S';
    const result = await pool.query(`
      SELECT id, request_token, status, gmail_address,
             COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name, '') as learner_name,
             grade_level, created_at, reviewed_at, rejection_reason
      FROM enrollment_requests 
      WHERE request_token = $1
    `, [token]);
    
    console.log('Query result:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
