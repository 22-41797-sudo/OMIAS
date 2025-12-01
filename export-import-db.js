// Export local database to JSON and import to Render
const { Pool } = require('pg');
const fs = require('fs');

// Local database connection
const localPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ICTCOORdb',
    password: 'bello0517',
    port: 5432
});

// Render database connection
const renderPool = new Pool({
    connectionString: 'postgresql://omias_user:IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj@dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com:5432/omias',
    ssl: { rejectUnauthorized: false }
});

async function exportAndImport() {
    try {
        console.log('🔄 Starting database export and import...\n');

        // Export all data from local database
        console.log('📤 Exporting from local database...');
        
        const tables = ['users', 'teachers', 'sections', 'students', 'section_snapshot_groups', 'section_snapshot_items', 'section_snapshot_students'];
        const exportedData = {};

        for (const table of tables) {
            try {
                const result = await localPool.query(`SELECT * FROM ${table}`);
                exportedData[table] = result.rows;
                console.log(`   ✅ ${table}: ${result.rows.length} rows`);
            } catch (err) {
                console.log(`   ⏭️  ${table}: not found (skipping)`);
            }
        }

        // Import to Render database
        console.log('\n📥 Importing to Render database...');

        for (const [table, rows] of Object.entries(exportedData)) {
            if (rows.length === 0) continue;

            const columns = Object.keys(rows[0]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
            const columnList = columns.join(',');

            for (const row of rows) {
                const values = columns.map(col => row[col]);
                const query = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
                
                try {
                    await renderPool.query(query, values);
                } catch (err) {
                    // Ignore constraint errors
                    if (!err.message.includes('duplicate') && !err.message.includes('conflict')) {
                        console.error(`Error inserting into ${table}:`, err.message);
                    }
                }
            }

            console.log(`   ✅ ${table}: ${rows.length} rows imported`);
        }

        console.log('\n✨ Export and import completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

exportAndImport();
