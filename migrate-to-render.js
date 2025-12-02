#!/usr/bin/env node

/**
 * Database Migration Tool
 * Migrates entire PostgreSQL database from localhost to Render
 * 
 * Usage: node migrate-to-render.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function migrateDatabase() {
    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║         DATABASE MIGRATION TOOL - LOCALHOST TO RENDER  ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        // Get Render credentials
        console.log('📋 Please provide your Render PostgreSQL credentials:');
        console.log('   (Find these in Render Dashboard > PostgreSQL > Info)\n');

        const renderHost = await askQuestion('  Render Host (e.g., postgres-xxx.render.com): ');
        const renderPort = await askQuestion('  Render Port (default: 5432): ') || '5432';
        const renderUser = await askQuestion('  Render User: ');
        const renderPassword = await askQuestion('  Render Password: ');
        const renderDatabase = await askQuestion('  Render Database: ');

        if (!renderHost || !renderUser || !renderPassword || !renderDatabase) {
            console.log('\n❌ Missing required credentials\n');
            process.exit(1);
        }

        console.log('\n⚙️  Connecting to databases...\n');

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
            ssl: { rejectUnauthorized: false }, // Render requires SSL
        });

        // Test connections
        try {
            await localhostPool.query('SELECT 1');
            console.log('✅ Connected to localhost database\n');
        } catch (err) {
            console.log('❌ Failed to connect to localhost database\n');
            console.log('   Make sure PostgreSQL is running locally');
            process.exit(1);
        }

        try {
            await renderPool.query('SELECT 1');
            console.log('✅ Connected to Render database\n');
        } catch (err) {
            console.log('❌ Failed to connect to Render database\n');
            console.log('   Check your credentials and network access\n');
            process.exit(1);
        }

        // Get list of tables from localhost
        console.log('📊 Scanning localhost database tables...\n');

        const tablesResult = await localhostPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to migrate:\n`);
        tables.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
        console.log();

        const confirm = await askQuestion('🔄 Start migration? (yes/no): ');
        if (confirm.toLowerCase() !== 'yes') {
            console.log('\n❌ Migration cancelled\n');
            process.exit(0);
        }

        console.log('\n🚀 Starting migration...\n');

        // Disable foreign key checks on Render
        await renderPool.query('SET CONSTRAINTS ALL DEFERRED');

        let totalRows = 0;

        // For each table
        for (const tableName of tables) {
            process.stdout.write(`  Migrating ${tableName}... `);

            try {
                // Get columns info from localhost
                const columnsResult = await localhostPool.query(`
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                const columns = columnsResult.rows;
                const colNames = columns.map(c => `"${c.column_name}"`).join(', ');

                // Drop table on Render if exists
                await renderPool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

                // Create table structure on Render
                const createTableResult = await localhostPool.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                let createTableSQL = `CREATE TABLE "${tableName}" (\n`;
                createTableResult.rows.forEach((col, idx) => {
                    let colDef = `  "${col.column_name}" ${col.data_type}`;
                    if (col.column_default) {
                        colDef += ` DEFAULT ${col.column_default}`;
                    }
                    if (col.is_nullable === 'NO') {
                        colDef += ' NOT NULL';
                    }
                    if (idx < createTableResult.rows.length - 1) {
                        colDef += ',';
                    }
                    createTableSQL += colDef + '\n';
                });
                createTableSQL += ')';

                await renderPool.query(createTableSQL);

                // Get data from localhost
                const dataResult = await localhostPool.query(`SELECT * FROM "${tableName}"`);

                // Insert data to Render
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

            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
            }
        }

        // Re-enable foreign key checks
        await renderPool.query('SET CONSTRAINTS ALL IMMEDIATE');

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Total rows migrated: ${totalRows}\n`);

        // Verify
        console.log('📈 Verification:\n');
        for (const tableName of tables) {
            const countResult = await renderPool.query(`SELECT COUNT(*) FROM "${tableName}"`);
            console.log(`  ${tableName}: ${countResult.rows[0].count} rows`);
        }

        console.log('\n🎉 All done! Your Render database is now up to date.\n');

        localhostPool.end();
        renderPool.end();
        rl.close();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrateDatabase();
