const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'bello0517',
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb'
});

async function checkStudent35() {
  try {
    const student = await pool.query(`
      SELECT id, 
             CONCAT(last_name, ', ', first_name) as full_name,
             grade_level,
             previous_grade_level,
             grade_level_updated_date,
             grade_level_updated_by
      FROM students 
      WHERE id = 35
    `);

    if (student.rows.length > 0) {
      const s = student.rows[0];
      console.log('\n👤 Student: ' + s.full_name);
      console.log('   Current Grade: ' + s.grade_level);
      console.log('   Previous Grade: ' + s.previous_grade_level);
      console.log('   Updated Date: ' + s.grade_level_updated_date);
      console.log('   Updated By: ' + s.grade_level_updated_by);
    }

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkStudent35();
