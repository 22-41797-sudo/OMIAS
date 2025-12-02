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
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'enrollment_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('enrollment_requests columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
