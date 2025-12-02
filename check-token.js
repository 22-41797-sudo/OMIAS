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
    const token = '7QUY-UFEZ-QFKZ';
    const result = await pool.query('SELECT * FROM enrollment_requests WHERE request_token = $1', [token]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Token ${token} NOT found in database`);
    } else {
      console.log(`✅ Token ${token} found:`);
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
