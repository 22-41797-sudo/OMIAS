# Database Migration Guide

## Quick Start (One Command)

```powershell
node migrate-to-render.js
```

That's it! The script will:
1. Ask for your Render database credentials
2. Connect to both databases
3. Export all tables and data from localhost
4. Create tables on Render
5. Import all data
6. Verify the migration

---

## Getting Render Database Credentials

1. Go to **https://dashboard.render.com**
2. Click on your **PostgreSQL** service
3. Click the **Info** tab
4. You'll see:
   - **External Database URL** (contains all credentials)
   - OR individual fields:
     - **Host**
     - **Port** (usually 5432)
     - **User**
     - **Password**
     - **Database**

Example: `postgres://user:password@postgres-xxx.render.com:5432/dbname`

Extract from URL:
- **Host**: `postgres-xxx.render.com`
- **Port**: `5432`
- **User**: `user`
- **Password**: `password`
- **Database**: `dbname`

---

## Running the Migration

1. Open PowerShell in your project folder
2. Run:
   ```powershell
   node migrate-to-render.js
   ```

3. When prompted, enter your Render credentials one by one

4. Review the list of tables
5. Type `yes` to confirm and start migration
6. Wait for completion

---

## What Happens

The script will:

✅ Drop existing tables on Render (starting fresh)
✅ Recreate all table structures
✅ Copy all data (rows, columns, defaults, constraints)
✅ Re-enable foreign keys
✅ Show verification count for each table

---

## Expected Output

```
╔════════════════════════════════════════════════════════╗
║         DATABASE MIGRATION TOOL - LOCALHOST TO RENDER  ║
╚════════════════════════════════════════════════════════╝

📋 Please provide your Render PostgreSQL credentials:
   (Find these in Render Dashboard > PostgreSQL > Info)

  Render Host (e.g., postgres-xxx.render.com): postgres-abc123.render.com
  Render Port (default: 5432): 5432
  Render User: myuser
  Render Password: mypassword
  Render Database: omias

⚙️  Connecting to databases...

✅ Connected to localhost database
✅ Connected to Render database

📊 Scanning localhost database tables...

Found 31 tables to migrate:

  1. audit_logs
  2. behavior_reports
  ... (etc)

🔄 Start migration? (yes/no): yes

🚀 Starting migration...

  Migrating audit_logs... ✅ (0 rows)
  Migrating behavior_reports... ✅ (0 rows)
  ... (etc)

✅ Migration complete!
📊 Total rows migrated: 1000

📈 Verification:

  audit_logs: 0 rows
  behavior_reports: 0 rows
  ... (etc)

🎉 All done! Your Render database is now up to date.
```

---

## Troubleshooting

### "Failed to connect to Render database"
- Check credentials are correct
- Ensure PostgreSQL network access is enabled on Render
- Make sure your machine can reach Render (no firewall blocks)

### "Failed to connect to localhost database"
- Make sure PostgreSQL is running: `pg_isready`
- Check .env file has correct DB_HOST, DB_USER, DB_PASSWORD, DB_PORT

### "Table migration failed"
- Check table doesn't have special constraints
- Ensure you have permission to create tables on Render

---

## After Migration

Your Render database will be **exactly the same** as your localhost:
- Same tables
- Same columns
- Same data
- Same defaults and constraints

Your code will work perfectly without any changes! ✅

---

## To Re-run Migration Later

You can run the script again anytime. It will:
1. Ask for credentials again
2. Drop and recreate all tables
3. Re-import all fresh data

Perfect for syncing after major changes!
