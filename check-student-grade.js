const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'bello0517',
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb'
});

async function checkSpecificStudent() {
  try {
    // Get the student from the screenshot
    const student = await pool.query(`
      SELECT id, 
             CONCAT(last_name, ', ', first_name) as full_name,
             lrn,
             grade_level,
             section_id,
             enrollment_status
      FROM students 
      WHERE lrn = '22222222222'
    `);

    if (student.rows.length > 0) {
      const s = student.rows[0];
      console.log('\n👤 Student: ' + s.full_name);
      console.log('   LRN: ' + s.lrn);
      console.log('   ID: ' + s.id);
      console.log('   Current Grade Level: ' + s.grade_level);
      console.log('   Section ID: ' + s.section_id);
      console.log('   Status: ' + s.enrollment_status);

      // Check the section
      if (s.section_id) {
        const section = await pool.query(`
          SELECT id, section_name, grade_level FROM sections WHERE id = $1
        `, [s.section_id]);

        if (section.rows.length > 0) {
          console.log('\n   📚 Section: ' + section.rows[0].section_name);
          console.log('      Grade Level: ' + section.rows[0].grade_level);
        }
      }
    } else {
      console.log('Student with LRN 22222222222 not found');
    }

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkSpecificStudent();
