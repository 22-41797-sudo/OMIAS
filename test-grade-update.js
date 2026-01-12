const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ictcoor',
  user: process.env.DB_USER || 'ictcoor_user',
  password: process.env.DB_PASSWORD || 'ictcoor123'
});

async function testGradeUpdate() {
  const client = await pool.connect();
  
  try {
    // Find a student
    const studentRes = await client.query(
      'SELECT id, grade_level, last_name, first_name FROM students WHERE enrollment_status = $1 LIMIT 1',
      ['active']
    );
    
    if (studentRes.rows.length === 0) {
      console.log('No active students found');
      return;
    }
    
    const student = studentRes.rows[0];
    console.log(`\n📚 Found student: ${student.id} - ${student.last_name}, ${student.first_name}`);
    console.log(`   Current Grade: ${student.grade_level}`);
    
    // Get new grade (just pick something different)
    const newGrade = student.grade_level === 'Grade 1' ? 'Grade 2' : 'Grade 1';
    console.log(`   New Grade: ${newGrade}`);
    
    // Update the grade
    console.log(`\n🔄 Updating grade level...`);
    const updateRes = await client.query(
      `UPDATE students 
       SET grade_level = $1, 
           previous_grade_level = $2,
           grade_level_updated_date = CURRENT_TIMESTAMP,
           grade_level_updated_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newGrade, student.grade_level, 'Test User', student.id]
    );
    
    console.log(`   Rows updated: ${updateRes.rowCount}`);
    
    // Immediately read back the value
    console.log(`\n✅ Reading back the updated value...`);
    const checkRes = await client.query(
      'SELECT id, grade_level, previous_grade_level, grade_level_updated_by FROM students WHERE id = $1',
      [student.id]
    );
    
    const updated = checkRes.rows[0];
    console.log(`   Grade Level: ${updated.grade_level}`);
    console.log(`   Previous Grade: ${updated.previous_grade_level}`);
    console.log(`   Updated By: ${updated.grade_level_updated_by}`);
    
    if (updated.grade_level === newGrade) {
      console.log(`\n✅ SUCCESS! Grade was updated correctly.`);
    } else {
      console.log(`\n❌ FAILED! Grade is still: ${updated.grade_level}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testGradeUpdate();
