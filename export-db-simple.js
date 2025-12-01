/**
 * Database Export Script - Works with all PostgreSQL versions
 * Creates a complete SQL dump including schema and data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const outputFile = `ICTCOORdb_${timestamp}.sql`;
const outputPath = path.join(__dirname, outputFile);

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ICTCOORdb',
    password: process.env.DB_PASSWORD || 'bello0517',
    port: parseInt(process.env.DB_PORT) || 5432,
});

async function exportDatabase() {
    const client = await pool.connect();
    let sqlDump = '';

    try {
        console.log('📦 Starting Database Export...\n');

        // Add header
        sqlDump += `-- PostgreSQL Database Dump\n`;
        sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
        sqlDump += `-- Database: ${process.env.DB_NAME || 'ICTCOORdb'}\n\n`;
        sqlDump += `SET statement_timeout = 0;\n`;
        sqlDump += `SET lock_timeout = 0;\n`;
        sqlDump += `SET idle_in_transaction_session_timeout = 0;\n`;
        sqlDump += `SET client_encoding = 'UTF8';\n`;
        sqlDump += `SET standard_conforming_strings = on;\n`;
        sqlDump += `SET check_function_bodies = false;\n`;
        sqlDump += `SET xmloption content;\n`;
        sqlDump += `SET client_min_messages = warning;\n`;
        sqlDump += `SET row_security = off;\n\n`;

        // Get all tables in public schema, ordered by name
        const tableResult = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);

        console.log(`📋 Found ${tableResult.rows.length} tables\n`);

        // First pass: get all table definitions
        const tableDefinitions = {};
        const tableNames = tableResult.rows.map(r => r.tablename);

        for (const tableName of tableNames) {
            try {
                // Get column information
                const colResult = await client.query(`
                    SELECT 
                        column_name, 
                        data_type,
                        column_default,
                        is_nullable,
                        character_maximum_length
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                // Get primary key and constraints
                const pkResult = await client.query(`
                    SELECT constraint_name, column_name
                    FROM information_schema.key_column_usage
                    WHERE table_schema = 'public'
                    AND table_name = $1
                    AND constraint_name LIKE '%pkey'
                `, [tableName]);

                tableDefinitions[tableName] = {
                    columns: colResult.rows,
                    primaryKeys: pkResult.rows
                };
            } catch (err) {
                console.warn(`⚠️  Error reading ${tableName}: ${err.message}`);
            }
        }

        // Generate DROP statements
        sqlDump += `-- Drop existing tables\n`;
        for (const tableName of tableNames.reverse()) {
            sqlDump += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        }
        sqlDump += `\n`;

        // Generate CREATE TABLE statements and insert data
        for (const tableName of tableNames) {
            try {
                const def = tableDefinitions[tableName];
                if (!def || !def.columns) continue;

                sqlDump += `\n-- Table: "${tableName}"\n`;
                sqlDump += `CREATE TABLE "${tableName}" (\n`;

                // Column definitions
                const columnDefs = def.columns.map(col => {
                    let colDef = `  "${col.column_name}" ${col.data_type}`;
                    
                    // Add size for character types
                    if (col.character_maximum_length) {
                        colDef = colDef.replace(col.data_type, `${col.data_type}(${col.character_maximum_length})`);
                    }
                    
                    // Add constraints
                    if (col.column_default) {
                        colDef += ` DEFAULT ${col.column_default}`;
                    }
                    if (col.is_nullable === 'NO') {
                        colDef += ` NOT NULL`;
                    }
                    
                    return colDef;
                });

                sqlDump += columnDefs.join(',\n');
                
                // Add primary key if exists
                if (def.primaryKeys.length > 0) {
                    const pkCols = def.primaryKeys.map(pk => `"${pk.column_name}"`).join(', ');
                    sqlDump += `,\n  PRIMARY KEY (${pkCols})`;
                }

                sqlDump += `\n);\n`;

                // Get and insert data
                const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
                
                if (dataResult.rows.length > 0) {
                    const columns = Object.keys(dataResult.rows[0]);
                    const columnList = columns.map(c => `"${c}"`).join(', ');

                    sqlDump += `\nINSERT INTO "${tableName}" (${columnList}) VALUES\n`;

                    const valuesList = dataResult.rows.map(row => {
                        const vals = columns.map(col => {
                            const val = row[col];
                            if (val === null || val === undefined) return 'NULL';
                            if (typeof val === 'boolean') return val ? 'true' : 'false';
                            if (typeof val === 'string') {
                                // Escape single quotes
                                const escaped = val.replace(/'/g, "''");
                                return `'${escaped}'`;
                            }
                            if (typeof val === 'object') {
                                // Handle JSON/arrays
                                const jsonStr = JSON.stringify(val).replace(/'/g, "''");
                                return `'${jsonStr}'`;
                            }
                            return String(val);
                        });
                        return `(${vals.join(', ')})`;
                    });

                    sqlDump += valuesList.join(',\n') + ';\n';
                    console.log(`✅ ${tableName} - ${dataResult.rows.length} rows`);
                } else {
                    console.log(`✅ ${tableName} - 0 rows`);
                }

            } catch (err) {
                console.error(`❌ Error processing ${tableName}: ${err.message}`);
            }
        }

        // Write to file
        fs.writeFileSync(outputPath, sqlDump, 'utf8');
        const fileSize = fs.statSync(outputPath).size;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

        console.log('\n✅ Export successful!\n');
        console.log(`📄 File: ${outputFile}`);
        console.log(`📊 Size: ${fileSizeMB} MB`);
        console.log(`📍 Location: ${outputPath}`);
        console.log('\n📋 Next: Import to Render using pgAdmin or the command line');

    } catch (err) {
        console.error('❌ Export failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

exportDatabase();
