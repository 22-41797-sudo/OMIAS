#!/usr/bin/env node
// This script manually inserts sections into the database
// Useful if the automatic seeding didn't work

const { Pool } = require('pg');
require('dotenv').config();

let pool;

console.log('📍 Connection Info:');
console.log('   DATABASE_URL set:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
    console.log('   Using DATABASE_URL (Render)');
    const isRenderDB = process.env.DATABASE_URL.includes('.render.com');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRenderDB ? { rejectUnauthorized: false } : false
    });
} else {
    console.log('   Using localhost parameters');
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ICTCOORdb',
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 5432,
    });
}

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

async function insertSections() {
    try {
        console.log('🔍 Checking existing sections...');
        const checkResult = await pool.query('SELECT COUNT(*) as cnt FROM sections');
        const existingCount = checkResult.rows[0].cnt;
        
        console.log(`   Found ${existingCount} existing sections`);
        
        if (existingCount === 0) {
            console.log('\n📝 Inserting 18 sections...');
            for (const section of sections) {
                await pool.query(
                    'INSERT INTO sections (grade_level, section_name, max_capacity, room_number, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (section_name) DO NOTHING',
                    [section.grade, section.name, section.capacity, section.room, true]
                );
                console.log(`   ✅ Inserted: ${section.grade} - ${section.name}`);
            }
            console.log('\n✨ All sections inserted successfully!');
        } else if (existingCount < 18) {
            console.log(`\n⚠️  Only ${existingCount} sections exist. Attempting to fill missing sections...`);
            for (const section of sections) {
                const result = await pool.query(
                    'INSERT INTO sections (grade_level, section_name, max_capacity, room_number, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (section_name) DO NOTHING RETURNING id',
                    [section.grade, section.name, section.capacity, section.room, true]
                );
                if (result.rows.length > 0) {
                    console.log(`   ✅ Inserted: ${section.grade} - ${section.name}`);
                } else {
                    console.log(`   ⏭️  Skipped: ${section.grade} - ${section.name} (already exists)`);
                }
            }
            console.log('\n✨ Done!');
        } else {
            console.log(`\n✅ All 18 sections already exist in the database!`);
        }
        
        // Show what's in the database
        console.log('\n📊 Current sections in database:');
        const result = await pool.query('SELECT id, grade_level, section_name, room_number, is_active FROM sections ORDER BY grade_level, section_name');
        result.rows.forEach(s => {
            console.log(`   [${s.id}] ${s.grade_level} - ${s.section_name} (${s.room_number}) [${s.is_active ? 'ACTIVE' : 'INACTIVE'}]`);
        });
        
        console.log(`\nTotal: ${result.rows.length} sections`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

insertSections();
