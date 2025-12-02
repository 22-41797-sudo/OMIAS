#!/usr/bin/env node

/**
 * Automated Database Migration Tool
 * Migrates entire PostgreSQL database from localhost to Render
 * Uses credentials from .render-creds file
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║         DATABASE MIGRATION - LOCALHOST TO RENDER       ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Read credentials from .render-creds file
        const credsFile = path.join(__dirname, '.render-creds');
        
        if (!fs.existsSync(credsFile)) {
            console.log('❌ .render-creds file not found\n');
            process.exit(1);
        }

        const credsContent = fs.readFileSync(credsFile, 'utf8');
        const creds = {};
        credsContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                creds[key.trim()] = value.trim();
            }
        });

        const renderHost = creds.RENDER_HOST;
        const renderPort = creds.RENDER_PORT;
        const renderUser = creds.RENDER_USER;
        const renderPassword = creds.RENDER_PASSWORD;
        const renderDatabase = creds.RENDER_DATABASE;

        if (!renderHost || !renderUser || !renderPassword || !renderDatabase) {
            console.log('❌ Missing credentials in .render-creds file\n');
            process.exit(1);
        }

        console.log('📋 Credentials loaded from .render-creds\n');
        console.log('⚙️  Connecting to databases...\n');

        // Connect to localhost
        const localhostPool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        // Connect to Render
        const renderPool = new Pool({
            user: renderUser,
            host: renderHost,
            database: renderDatabase,
            password: renderPassword,
            port: renderPort,
            ssl: { rejectUnauthorized: false },
        });

        // Test connections
        try {
            await localhostPool.query('SELECT 1');
            console.log('✅ Connected to localhost database\n');
        } catch (err) {
            console.log('❌ Failed to connect to localhost database\n');
            process.exit(1);
        }

        try {
            await renderPool.query('SELECT 1');
            console.log('✅ Connected to Render database\n');
        } catch (err) {
            console.log('❌ Failed to connect to Render database\n');
            console.log(`   Error: ${err.message}\n`);
            process.exit(1);
        }

        // Get list of tables
        console.log('📊 Scanning localhost database tables...\n');

        const tablesResult = await localhostPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables:\n`);
        tables.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
        console.log('\n🚀 Starting migration...\n');

        // Disable foreign keys
        await renderPool.query('SET CONSTRAINTS ALL DEFERRED');

        let totalRows = 0;
        let successCount = 0;
        let errorCount = 0;

        // Migrate each table
        for (const tableName of tables) {
            process.stdout.write(`  Migrating ${tableName}... `);

            try {
                // Get columns
                const columnsResult = await localhostPool.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                const columns = columnsResult.rows;
                const colNames = columns.map(c => `"${c.column_name}"`).join(', ');

                // Drop and recreate table on Render
                await renderPool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

                let createTableSQL = `CREATE TABLE "${tableName}" (\n`;
                columns.forEach((col, idx) => {
                    let colDef = `  "${col.column_name}" `;
                    
                    // Handle SERIAL types
                    if (col.data_type === 'integer' && col.column_default && col.column_default.includes('nextval')) {
                        colDef += 'SERIAL';
                    } else if (col.data_type === 'bigint' && col.column_default && col.column_default.includes('nextval')) {
                        colDef += 'BIGSERIAL';
                    } else {
                        colDef += col.data_type;
                    }
                    
                    if (col.is_nullable === 'NO' && !col.column_default) {
                        colDef += ' NOT NULL';
                    }
                    
                    if (idx < columns.length - 1) {
                        colDef += ',';
                    }
                    createTableSQL += colDef + '\n';
                });
                createTableSQL += ')';

                await renderPool.query(createTableSQL);

                // Get data
                const dataResult = await localhostPool.query(`SELECT * FROM "${tableName}"`);

                // Insert data
                if (dataResult.rows.length > 0) {
                    for (const row of dataResult.rows) {
                        const values = columns.map(col => {
                            const val = row[col.column_name];
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            if (typeof val === 'boolean') return val ? 'true' : 'false';
                            if (val instanceof Date) return `'${val.toISOString()}'`;
                            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            return val;
                        });

                        const insertSQL = `INSERT INTO "${tableName}" (${colNames}) VALUES (${values.join(', ')})`;
                        await renderPool.query(insertSQL);
                        totalRows++;
                    }
                    console.log(`✅ (${dataResult.rows.length} rows)`);
                } else {
                    console.log('✅ (0 rows)');
                }
                
                successCount++;

            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
                errorCount++;
            }
        }

        // Re-enable foreign keys
        await renderPool.query('SET CONSTRAINTS ALL IMMEDIATE');

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Tables migrated: ${successCount}/${tables.length}`);
        console.log(`📊 Total rows migrated: ${totalRows}\n`);

        if (errorCount === 0) {
            console.log('📈 Verification:\n');
            for (const tableName of tables) {
                const countResult = await renderPool.query(`SELECT COUNT(*) FROM "${tableName}"`);
                console.log(`  ${tableName}: ${countResult.rows[0].count} rows`);
            }

            console.log('\n🎉 SUCCESS! Your Render database is now identical to localhost!\n');
        } else {
            console.log(`⚠️  ${errorCount} tables had errors during migration\n`);
        }

        localhostPool.end();
        renderPool.end();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrateDatabase();
