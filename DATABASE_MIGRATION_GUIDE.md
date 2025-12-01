# Database Migration Guide - Local to Render

This guide will help you export your local PostgreSQL database and import it to Render.

## Option 1: Using Scripts (Automated)

### Step 1: Export Local Database
```bash
node export-db.js
```

This will create a SQL dump file like `ICTCOORdb_2024-12-01.sql` in your project folder.

### Step 2: Import to Render
```bash
node import-render-db.js ICTCOORdb_2024-12-01.sql
```

This will import all tables and data to your Render PostgreSQL database.

---

## Option 2: Using pgAdmin (GUI - Easiest)

### Step 1: Export from Local pgAdmin
1. Open pgAdmin (usually `http://localhost:5050`)
2. Right-click on database **ICTCOORdb** → **Backup**
3. In the dialog:
   - Format: **Plain text SQL**
   - Filename: `ICTCOORdb_backup.sql`
   - Click **Backup**
4. Save the file to your project folder

### Step 2: Import to Render pgAdmin
1. Get your Render PostgreSQL connection details from Render Dashboard:
   - Go to your PostgreSQL instance
   - Copy the connection string or individual credentials
   
2. Open pgAdmin and connect to Render database:
   - Right-click **Servers** → **Create** → **Server**
   - Name: `Render PostgreSQL`
   - Connection tab:
     - Hostname: From Render (e.g., `dpg-xxxxx-a.singapore-postgres.render.com`)
     - Port: `5432`
     - Username: `omias_user`
     - Password: Copy from Render dashboard
     - Database: `omias`
   - Click **Save**

3. Import the backup:
   - Right-click database **omias** → **Restore**
   - Browse to select `ICTCOORdb_backup.sql`
   - Click **Restore**
   - Wait for completion

4. Verify:
   - Expand the database and check tables
   - All your data should now be in Render

---

## Option 3: Using Command Line (Advanced)

### Export from Local:
```bash
set PGPASSWORD=bello0517
pg_dump -h localhost -U postgres -d ICTCOORdb -F p > ICTCOORdb_backup.sql
```

### Import to Render:
```bash
psql "postgresql://omias_user:IxP0kZC2hXBNfDISoTx8BdtcWW2ci1sj@dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com:5432/omias" < ICTCOORdb_backup.sql
```

---

## Troubleshooting

### "pg_dump not found"
- **Windows**: Make sure PostgreSQL is installed and added to PATH
- **Solution**: 
  ```bash
  # Find pg_dump location
  where pg_dump
  
  # If not found, add PostgreSQL bin to PATH:
  # C:\Program Files\PostgreSQL\15\bin
  ```

### "Connection refused"
- Check that local PostgreSQL is running
- Verify credentials in `.env` file

### "Authentication failed on Render"
- Copy the correct password from Render dashboard
- Verify hostname includes full domain (`.render.com`)
- Check that user has proper permissions

### "Import takes too long"
- Large databases may take several minutes
- Don't close the terminal while importing
- Check Render logs for progress

---

## After Import

1. **Verify data** in Render pgAdmin
2. **Restart application** on Render (manual deploy)
3. **Test login** with your existing accounts
4. **Check dashboard** - all data should be visible
5. **Delete old backup** file after confirming everything works

---

## Your Render Database Credentials
```
Database: omias
User: omias_user
Host: dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com
Port: 5432
```

The password is in your Render dashboard under the PostgreSQL instance details.
