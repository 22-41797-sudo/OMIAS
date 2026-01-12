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

async function testApiEndpoint() {
  const client = await pool.connect();
  
  try {
    // Find a student with a section
    const studentRes = await client.query(
      `SELECT id, section_id, grade_level, last_name, first_name 
       FROM students 
       WHERE enrollment_status = $1 AND section_id IS NOT NULL
       LIMIT 1`,
      ['active']
    );
    
    if (studentRes.rows.length === 0) {
      console.log('No active students with section found');
      return;
    }
    
    const student = studentRes.rows[0];
    console.log(`\n📚 Found student: ${student.id} - ${student.last_name}, ${student.first_name}`);
    console.log(`   Section ID: ${student.section_id}`);
    console.log(`   Current Grade: ${student.grade_level}`);
    
    // Test the API endpoint query
    console.log(`\n🔄 Running the API endpoint query...`);
    const apiRes = await client.query(`
      SELECT id, lrn, last_name, first_name, middle_name, ext_name, sex, age, grade_level, contact_number,
             COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as full_name
      FROM students
      WHERE section_id = $1 AND enrollment_status = 'active'
      ORDER BY last_name, first_name
    `, [student.section_id]);
    
    console.log(`   Found ${apiRes.rows.length} students in section ${student.section_id}`);
    
    const foundStudent = apiRes.rows.find(s => s.id === student.id);
    if (foundStudent) {
      console.log(`   Student found in API results:`);
      console.log(`     Full Name: ${foundStudent.full_name}`);
      console.log(`     Grade Level: ${foundStudent.grade_level}`);
    } else {
      console.log(`   ⚠️  Student NOT found in API results!`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testApiEndpoint();
