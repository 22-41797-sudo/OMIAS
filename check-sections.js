const { pool } = require('./init-db.js');

async function checkSections() {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as cnt FROM sections');
    console.log('Total sections in DB:', countResult.rows[0].cnt);
    
    const selectResult = await pool.query('SELECT id, section_name, grade_level, is_active FROM sections ORDER BY grade_level, section_name LIMIT 10');
    console.log('\nFirst 10 sections:');
    selectResult.rows.forEach(s => {
      console.log(`  ID: ${s.id}, ${s.grade_level} - ${s.section_name} (Active: ${s.is_active})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSections();
