const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'bello0517',
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb'
});

async function getAllStudents() {
  try {
    const students = await pool.query(`
      SELECT id, 
             CONCAT(last_name, ', ', first_name) as full_name,
             lrn,
             grade_level,
             section_id,
             enrollment_status
      FROM students 
      WHERE enrollment_status = 'active'
      LIMIT 10
    `);

    console.log('\n👥 All active students:');
    if (students.rows.length === 0) {
      console.log('   No active students found');
    } else {
      students.rows.forEach((s, i) => {
        console.log(`\n[${i + 1}] ${s.full_name}`);
        console.log(`    ID: ${s.id}`);
        console.log(`    LRN: ${s.lrn}`);
        console.log(`    Grade: ${s.grade_level}`);
        console.log(`    Section: ${s.section_id}`);
      });
    }

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

getAllStudents();
