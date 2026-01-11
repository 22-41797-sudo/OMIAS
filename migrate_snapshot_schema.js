const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  password: 'bello0517',
  host: 'localhost',
  port: 5432,
  database: 'ICTCOORdb'
});

client.connect().then(async () => {
  try {
    console.log('Altering table to match new schema...');
    
    // Add missing columns if they don't exist
    const migrations = [
      'ALTER TABLE section_snapshot_items ADD COLUMN IF NOT EXISTS student_full_name TEXT;',
      'ALTER TABLE section_snapshot_items ADD COLUMN IF NOT EXISTS current_address TEXT;',
      'ALTER TABLE section_snapshot_items ADD COLUMN IF NOT EXISTS barangay_extracted TEXT;',
      'ALTER TABLE section_snapshot_items ADD COLUMN IF NOT EXISTS teacher_name TEXT;',
      'ALTER TABLE section_snapshot_items ADD COLUMN IF NOT EXISTS sex TEXT;',
    ];

    for (const migration of migrations) {
      try {
        await client.query(migration);
        console.log('✓ ' + migration);
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('✓ Column already exists');
        } else {
          throw e;
        }
      }
    }

    // Verify schema
    const schema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'section_snapshot_items' 
      ORDER BY ordinal_position
    `);
    console.log('\n=== Updated Schema ===');
    schema.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e);
  }
  client.end();
}).catch(e => console.error('Connection error:', e.message));
