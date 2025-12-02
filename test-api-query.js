#!/usr/bin/env node

const { Pool } = require('pg');

const renderDB = {
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
};

async function testApiQuery() {
    const pool = new Pool(renderDB);
    
    try {
        console.log('🔬 Testing /api/students/all enrollees query...\n');
        
        const result = await pool.query(`
            SELECT 
                'ER' || er.id::text as id,
                er.id::text as enrollment_id,
                er.lrn,
                er.grade_level,
                er.last_name,
                er.first_name,
                er.middle_name,
                COALESCE(er.ext_name, '') as ext_name,
                CONCAT(er.last_name, ', ', er.first_name, ' ', COALESCE(er.middle_name, ''), ' ', COALESCE(er.ext_name, '')) as full_name,
                COALESCE(er.age, 0) as age,
                COALESCE(er.sex, 'N/A') as sex,
                er.contact_number,
                NULL as assigned_section,
                er.created_at as enrollment_date,
                'pending' as enrollment_status,
                false as is_archived
            FROM early_registration er
            WHERE NOT EXISTS (
                SELECT 1 FROM students st WHERE st.enrollment_id = er.id::text
            )
            ORDER BY 
                CASE 
                    WHEN er.grade_level = 'Kindergarten' THEN 1
                    WHEN er.grade_level = 'Grade 1' THEN 2
                    WHEN er.grade_level = 'Grade 2' THEN 3
                    WHEN er.grade_level = 'Grade 3' THEN 4
                    WHEN er.grade_level = 'Grade 4' THEN 5
                    WHEN er.grade_level = 'Grade 5' THEN 6
                    WHEN er.grade_level = 'Grade 6' THEN 7
                    WHEN er.grade_level = 'Non-Graded' THEN 8
                    ELSE 9
                END,
                er.last_name, er.first_name
        `);
        
        console.log(`✅ Query successful! Records: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            console.log('\n📋 First record:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        }
        
    } catch (err) {
        console.error('❌ Query failed:', err.message);
    } finally {
        await pool.end();
    }
}

testApiQuery();
