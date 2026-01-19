const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'dpg-d5mbs41r0fns73es5h1g-a.oregon-postgres.render.com',
    port: 5432,
    user: 'omias_user',
    password: '4ocutqPkUbI0GdHAyL7EjqxhAnWdosML',
    database: 'omias_z8rr',
    ssl: { rejectUnauthorized: false }
});

async function splitSQLStatements(sql) {
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let inComment = false;
    
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1];
        
        // Handle line comments
        if (!inString && char === '-' && nextChar === '-') {
            inComment = true;
        }
        if (inComment && char === '\n') {
            inComment = false;
            current += char;
            continue;
        }
        if (inComment) {
            current += char;
            continue;
        }
        
        // Handle quoted strings
        if ((char === '"' || char === "'") && (i === 0 || sql[i - 1] !== '\\')) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        // Collect statement
        current += char;
        
        // End of statement
        if (!inString && char === ';') {
            const stmt = current.trim().slice(0, -1).trim();
            if (stmt.length > 0) {
                statements.push(stmt);
            }
            current = '';
        }
    }
    
    if (current.trim().length > 0) {
        statements.push(current.trim());
    }
    
    return statements;
}

async function restoreDatabase() {
    try {
        console.log('📦 Reading SQL file...');
        const sqlFile = path.join(__dirname, 'ICTCOORdb_2026-01-18.sql');
        const sql = fs.readFileSync(sqlFile, 'utf-8');
        
        console.log('🔗 Connecting to Render database...');
        const client = await pool.connect();
        
        try {
            console.log('💾 Executing SQL script...');
            
            // First, drop all existing tables to avoid conflicts
            console.log('🗑️  Dropping existing tables...');
            try {
                await client.query(`
                    DROP SCHEMA public CASCADE;
                    CREATE SCHEMA public;
                `);
                console.log('✓ Cleaned up existing schema');
            } catch (err) {
                console.log('⚠️  Schema cleanup skipped:', err.message.substring(0, 50));
            }
            
            // Parse SQL statements carefully
            const statements = await splitSQLStatements(sql);
            const filtered = statements
                .filter(s => s.length > 0 && !s.startsWith('--'))
                .filter(s => !s.match(/^SET\s+(statement_timeout|lock_timeout|idle_in_transaction|check_function|xmloption|client_min_messages|row_security)/i))
                // Remove sequence default values and use SERIAL instead
                .map(s => s.replace(/DEFAULT nextval\('[^']+'\:\:regclass\)/g, 'DEFAULT NULL'));
            
            console.log(`Found ${filtered.length} SQL statements to execute`);
            
            for (let i = 0; i < filtered.length; i++) {
                const stmt = filtered[i];
                try {
                    await client.query(stmt);
                    if ((i + 1) % 50 === 0) {
                        console.log(`✓ Executed ${i + 1}/${filtered.length} statements...`);
                    }
                } catch (err) {
                    console.error(`❌ Error on statement ${i + 1}:`, err.message);
                    console.error(`Statement preview: ${stmt.substring(0, 100)}...`);
                    throw err;
                }
            }
            
            console.log('✅ Database restored successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error restoring database:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

restoreDatabase();
