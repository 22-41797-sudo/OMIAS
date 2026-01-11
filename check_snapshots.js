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
    const groups = await client.query('SELECT id, snapshot_name, created_at FROM section_snapshot_groups ORDER BY id DESC LIMIT 10');
    console.log('\n=== Snapshots in section_snapshot_groups ===');
    console.log('Total:', groups.rows.length);
    if (groups.rows.length > 0) {
      groups.rows.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.snapshot_name}, Created: ${row.created_at}`);
      });
    } else {
      console.log('NO SNAPSHOTS FOUND!');
    }
    
    const items = await client.query('SELECT COUNT(*) as count FROM section_snapshot_items');
    console.log('\n=== section_snapshot_items ===');
    console.log('Total items:', items.rows[0].count);

    // Check if tables have any data at all
    console.log('\n=== Table Schema Check ===');
    const schema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'section_snapshot_items' 
      ORDER BY ordinal_position
    `);
    console.log('Columns in section_snapshot_items:');
    schema.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  client.end();
}).catch(e => console.error('Connection error:', e.message));
