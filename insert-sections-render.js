#!/usr/bin/env node

const { Pool } = require('pg');

// Render PostgreSQL connection
const pool = new Pool({
    host: 'dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: 'IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj',
    database: 'omias',
    ssl: { rejectUnauthorized: false }
});

async function insertSections() {
    try {
        console.log('\n🔧 Inserting sections into Render database...\n');
        
        const sections = [
            { grade: 'Kindergarten', name: 'angel', capacity: 35, room: 'Room 101' },
            { grade: 'Kindergarten', name: 'dahlia', capacity: 35, room: 'Room 102' },
            { grade: 'Kindergarten', name: 'lily', capacity: 35, room: 'Room 103' },
            { grade: 'Kindergarten', name: 'santan', capacity: 35, room: 'Room 104' },
            { grade: 'Grade 1', name: 'rosal', capacity: 40, room: 'Room 201' },
            { grade: 'Grade 1', name: 'rose', capacity: 40, room: 'Room 202' },
            { grade: 'Grade 2', name: 'camia', capacity: 40, room: 'Room 301' },
            { grade: 'Grade 2', name: 'daisy', capacity: 40, room: 'Room 302' },
            { grade: 'Grade 2', name: 'lirio', capacity: 40, room: 'Room 303' },
            { grade: 'Grade 3', name: 'adelfa', capacity: 40, room: 'Room 401' },
            { grade: 'Grade 3', name: 'orchids', capacity: 40, room: 'Room 402' },
            { grade: 'Grade 4', name: 'ilang-ilang', capacity: 40, room: 'Room 501' },
            { grade: 'Grade 4', name: 'sampaguita', capacity: 40, room: 'Room 502' },
            { grade: 'Grade 5', name: 'blueberry', capacity: 45, room: 'Room 601' },
            { grade: 'Grade 5', name: 'everlasting', capacity: 45, room: 'Room 602' },
            { grade: 'Grade 6', name: 'cattleya', capacity: 45, room: 'Room 701' },
            { grade: 'Grade 6', name: 'sunflower', capacity: 45, room: 'Room 702' },
            { grade: 'Non-Graded', name: 'tulips', capacity: 30, room: 'Room 801' }
        ];

        let inserted = 0;
        let skipped = 0;

        for (const section of sections) {
            try {
                const result = await pool.query(
                    'INSERT INTO sections (grade_level, section_name, max_capacity, room_number, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (section_name) DO NOTHING RETURNING id',
                    [section.grade, section.name, section.capacity, section.room, true]
                );
                if (result.rows.length > 0) {
                    inserted++;
                    console.log(`   ✅ Inserted: ${section.grade} - ${section.name}`);
                } else {
                    skipped++;
                    console.log(`   ⏭️  Skipped: ${section.name} (already exists)`);
                }
            } catch (err) {
                console.error(`   ❌ Error inserting ${section.name}:`, err.message);
            }
        }

        const finalCount = await pool.query('SELECT COUNT(*) as cnt FROM sections');
        
        console.log('\n✅ Insertion complete!');
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total sections in database: ${finalCount.rows[0].cnt}`);
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

insertSections();
