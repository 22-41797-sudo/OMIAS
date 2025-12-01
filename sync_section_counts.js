// Script to sync section counts with actual student assignments
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ICTCOORdb',
    password: process.env.DB_PASSWORD || 'bello0517',
    port: process.env.DB_PORT || 5432
});

async function syncSectionCounts() {
    const client = await pool.connect();
    try {
        console.log('Syncing section counts...\n');
        
        // Get all sections with their real student count
        const sectionsResult = await client.query(`
            SELECT 
                s.id, 
                s.section_name,
                s.current_count as stored_count,
                COUNT(st.id) as real_count
            FROM sections s
            LEFT JOIN students st ON st.section_id = s.id AND st.enrollment_status = 'active'
            GROUP BY s.id, s.section_name, s.current_count
            ORDER BY s.id
        `);
        
        console.log('Current section counts:');
        console.log(sectionsResult.rows);
        console.log('\n');
        
        // Fix mismatches
        let fixed = 0;
        for (const section of sectionsResult.rows) {
            if (parseInt(section.stored_count) !== parseInt(section.real_count)) {
                console.log(`Fixing ${section.section_name}: ${section.stored_count} → ${section.real_count}`);
                await client.query(
                    'UPDATE sections SET current_count = $1 WHERE id = $2',
                    [section.real_count, section.id]
                );
                fixed++;
            }
        }
        
        if (fixed === 0) {
            console.log('✅ All section counts are already in sync!');
        } else {
            console.log(`\n✅ Fixed ${fixed} section(s)`);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

syncSectionCounts();
