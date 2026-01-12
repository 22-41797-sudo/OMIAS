const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb',
  user: 'postgres',
  password: 'bello0517'
});

(async () => {
  try {
    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students'
      ORDER BY ordinal_position
    `);
    console.log('📋 Students table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Test updating student 35
    console.log(`\n🔄 Testing UPDATE on student 35...`);
    const before = await pool.query('SELECT id, grade_level FROM students WHERE id = 35');
    console.log(`  Before: grade_level = ${before.rows[0].grade_level}`);
    
    // Try a simple update
    const updateResult = await pool.query(
      'UPDATE students SET grade_level = $1 WHERE id = $2',
      ['TEST_GRADE_LEVEL', 35]
    );
    console.log(`  UPDATE affected ${updateResult.rowCount} rows`);
    
    // Check again
    const after = await pool.query('SELECT id, grade_level FROM students WHERE id = 35');
    console.log(`  After: grade_level = ${after.rows[0].grade_level}`);
    
    // Restore original
    await pool.query(
      'UPDATE students SET grade_level = $1 WHERE id = $2',
      ['Grade 1', 35]
    );
    console.log(`  Restored to Grade 1`);
    
  } catch (err) {
    console.log('Error:', err.message);
  }
  await pool.end();
})();
