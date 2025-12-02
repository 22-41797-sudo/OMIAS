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

async function testAllSectionQueries() {
    try {
        console.log('\n🔍 Testing all section management queries...\n');
        
        // Test 1: Get all sections
        console.log('📋 Test 1: Get all sections');
        const sectionsResult = await pool.query(`
            SELECT id, section_name, grade_level, max_capacity, current_count
            FROM sections 
            WHERE is_active = true
            ORDER BY grade_level, section_name
        `);
        console.log(`   ✅ Found ${sectionsResult.rows.length} sections`);
        
        // Test 2: Get section with students
        console.log('\n📋 Test 2: Get section 1 with students');
        const section1 = await pool.query(`
            SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
            FROM sections 
            WHERE id = $1
        `, [1]);
        
        if (section1.rows.length > 0) {
            console.log(`   ✅ Section: ${section1.rows[0].section_name}`);
            console.log(`      Current count: ${section1.rows[0].current_count}`);
            
            // Get students in section 1
            const students1 = await pool.query(`
                SELECT 
                    st.id,
                    st.lrn,
                    (st.last_name || ', ' || st.first_name) as full_name,
                    COALESCE(st.sex, 'N/A') as sex,
                    COALESCE(st.age, 0) as age
                FROM students st
                WHERE st.section_id = $1 AND st.enrollment_status = 'active'
                ORDER BY st.last_name, st.first_name
            `, [1]);
            
            console.log(`   ✅ Found ${students1.rows.length} students in this section`);
            students1.rows.forEach(s => {
                console.log(`      - ${s.full_name} (${s.sex}, Age: ${s.age})`);
            });
        }
        
        // Test 3: Get unassigned students
        console.log('\n📋 Test 3: Get unassigned students');
        const unassigned = await pool.query(`
            SELECT 
                st.id,
                st.lrn,
                (st.last_name || ', ' || st.first_name) as full_name,
                st.grade_level
            FROM students st
            WHERE st.section_id IS NULL 
            ORDER BY st.grade_level, st.last_name, st.first_name
        `);
        console.log(`   ✅ Found ${unassigned.rows.length} unassigned students`);
        
        // Test 4: Get pending early registrations
        console.log('\n📋 Test 4: Get pending early registrations (not yet assigned)');
        const pending = await pool.query(`
            SELECT 
                er.id,
                er.lrn,
                (er.last_name || ', ' || er.first_name) as full_name,
                er.grade_level,
                er.status
            FROM early_registration er
            WHERE er.assigned_section IS NULL AND er.status = 'pending'
            ORDER BY er.grade_level, er.last_name, er.first_name
        `);
        console.log(`   ✅ Found ${pending.rows.length} pending registrations`);
        pending.rows.slice(0, 3).forEach(p => {
            console.log(`      - ${p.full_name} (Status: ${p.status})`);
        });
        
        // Test 5: Section statistics
        console.log('\n📋 Test 5: Section capacity statistics');
        const stats = await pool.query(`
            SELECT 
                section_name,
                grade_level,
                max_capacity,
                COALESCE(current_count, 0) as current_count,
                (max_capacity - COALESCE(current_count, 0)) as available_seats
            FROM sections
            WHERE is_active = true
            ORDER BY grade_level, section_name
        `);
        
        console.log(`   ✅ Section statistics:`);
        stats.rows.forEach(s => {
            const usage = Math.round((s.current_count / s.max_capacity) * 100);
            console.log(`      ${s.section_name}: ${s.current_count}/${s.max_capacity} (${usage}%) - ${s.available_seats} available`);
        });
        
        console.log('\n✅ All tests passed!\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testAllSectionQueries();
