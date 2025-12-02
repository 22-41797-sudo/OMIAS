require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function exportDatabase() {
    try {
        console.log('📊 Exporting complete database schema and data...\n');
        
        // Get all table names
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to export\n`);
        
        let sqlContent = '-- Complete OMIAS Database Export\n';
        sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
        sqlContent += '-- Instructions: Run this file in your Render database\n\n';
        
        // Disable foreign keys temporarily
        sqlContent += '-- Disable foreign key checks\n';
        sqlContent += 'SET CONSTRAINTS ALL DEFERRED;\n\n';
        
        // For each table, get CREATE TABLE and data
        for (const tableName of tables) {
            process.stdout.write(`  Exporting ${tableName}... `);
            
            // Get column information to reconstruct CREATE TABLE
            const columnsResult = await pool.query(`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            const columns = columnsResult.rows;
            
            // Build CREATE TABLE statement
            sqlContent += `\n-- Table: ${tableName}\n`;
            sqlContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
            sqlContent += `CREATE TABLE "${tableName}" (\n`;
            
            columns.forEach((col, idx) => {
                let colDef = `    "${col.column_name}" ${col.data_type}`;
                if (col.column_default) {
                    colDef += ` DEFAULT ${col.column_default}`;
                }
                if (col.is_nullable === 'NO') {
                    colDef += ' NOT NULL';
                }
                if (idx < columns.length - 1) {
                    colDef += ',';
                }
                sqlContent += colDef + '\n';
            });
            
            sqlContent += `);\n`;
            
            // Get all data from table
            const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
            
            if (dataResult.rows.length > 0) {
                const colNames = columns.map(c => `"${c.column_name}"`);
                
                dataResult.rows.forEach(row => {
                    const values = columns.map(col => {
                        const val = row[col.column_name];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (typeof val === 'boolean') return val ? 'true' : 'false';
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });
                    
                    sqlContent += `INSERT INTO "${tableName}" (${colNames.join(', ')}) VALUES (${values.join(', ')});\n`;
                });
                
                console.log(`✅ (${dataResult.rows.length} rows)`);
            } else {
                console.log(`✅ (0 rows)`);
            }
        }
        
        // Re-enable foreign keys
        sqlContent += '\n-- Re-enable foreign key checks\n';
        sqlContent += 'SET CONSTRAINTS ALL IMMEDIATE;\n';
        sqlContent += '\n-- Export complete\n';
        
        // Write to file
        const filename = `omias_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.sql`;
        fs.writeFileSync(filename, sqlContent);
        
        console.log(`\n✅ Export complete!`);
        console.log(`📁 File: ${filename}`);
        console.log(`📊 Size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`\n📋 Next steps:`);
        console.log(`1. Go to Render Dashboard → PostgreSQL → Database`);
        console.log(`2. Click "Browser" tab`);
        console.log(`3. Paste the SQL content and execute`);
        console.log(`4. Or use psql to import: psql -h <render-host> -U <user> -d <database> < ${filename}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error exporting database:', err.message);
        process.exit(1);
    }
}

exportDatabase();
