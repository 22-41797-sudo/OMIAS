const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'bello0517',
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb'
});

async function checkGradeData() {
  try {
    // Check columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name ILIKE '%grade%'
      ORDER BY column_name
    `);
    
    console.log('\n📋 Grade-related columns in students table:');
    columns.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check student data
    const students = await pool.query(`
      SELECT id, 
             CONCAT(last_name, ', ', first_name) as full_name,
             grade_level,
             previous_grade_level,
             grade_level_updated_date,
             grade_level_updated_by
      FROM students 
      WHERE section_id IS NOT NULL
      LIMIT 5
    `);

    console.log('\n👥 Sample student records:');
    if (students.rows.length === 0) {
      console.log('   No students found');
    } else {
      students.rows.forEach((row, i) => {
        console.log(`\n   [${i + 1}] ${row.full_name}`);
        console.log(`       Current Grade: ${row.grade_level || 'NULL'}`);
        console.log(`       Previous Grade: ${row.previous_grade_level || 'NULL'}`);
        console.log(`       Updated: ${row.grade_level_updated_date || 'Never'}`);
        console.log(`       Updated By: ${row.grade_level_updated_by || 'N/A'}`);
      });
    }

    pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    pool.end();
  }
}

checkGradeData();
