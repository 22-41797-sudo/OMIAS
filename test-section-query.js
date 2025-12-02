#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
});

async function testSectionQuery() {
    try {
        console.log('\n🔍 Testing section students query...\n');
        
        // Test getting section students
        const sectionId = 1;
        const result = await pool.query(`
            SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
            FROM sections 
            WHERE id = $1
        `, [sectionId]);
        
        console.log(`Section found: ${result.rows.length > 0 ? 'YES ✅' : 'NO ❌'}`);
        if (result.rows.length > 0) {
            console.log(`Section: ${result.rows[0].section_name} (${result.rows[0].grade_level})`);
            console.log(`Current count: ${result.rows[0].current_count}`);
        }
        
        // Now test the students query
        const studentsResult = await pool.query(`
            SELECT 
                st.id,
                st.lrn,
                (st.last_name || ', ' || st.first_name || ' ' || COALESCE(st.middle_name, '') || ' ' || COALESCE(st.ext_name, '')) as full_name,
                st.last_name,
                st.first_name,
                COALESCE(st.sex, 'N/A') as sex,
                COALESCE(st.age, 0) as age,
                st.guardian_contact,
                COALESCE(st.created_at, CURRENT_TIMESTAMP)::date as enrollment_date,
                st.enrollment_status
            FROM students st
            WHERE st.section_id = $1 AND st.enrollment_status = 'active'
            ORDER BY st.last_name, st.first_name
        `, [sectionId]);
        
        console.log(`\nStudents found: ${studentsResult.rows.length}`);
        if (studentsResult.rows.length > 0) {
            studentsResult.rows.forEach(student => {
                console.log(`  - ${student.full_name} (LRN: ${student.lrn})`);
            });
        }
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Details:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testSectionQuery();
