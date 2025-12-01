# How to Import Your Database to Render

Your local database has been successfully exported to: **`ICTCOORdb_2025-12-01.sql`**

## Quick Steps

### **Option A: Using pgAdmin (Easiest - Recommended)**

1. **Get Render PostgreSQL Connection Details:**
   - Go to https://dashboard.render.com
   - Click on your PostgreSQL instance
   - Scroll down and copy the connection details:
     ```
     Host: dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com
     Port: 5432
     Database: omias
     User: omias_user
     Password: (copy from the dashboard)
     ```

2. **Add Connection in pgAdmin:**
   - Open pgAdmin (http://localhost:5050)
   - Right-click **Servers** → **Create** → **Server**
   - Enter these details:
     - **Name:** Render PostgreSQL
     - **Host:** dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com
     - **Port:** 5432
     - **Username:** omias_user
     - **Password:** (from Render dashboard)
     - Click **Save**

3. **Import the Database:**
   - In the left panel, expand **Servers** → **Render PostgreSQL** → **Databases**
   - Right-click **omias** → **Restore**
   - Select file: **`ICTCOORdb_2025-12-01.sql`**
   - Click **Restore**
   - Wait for it to complete (you'll see a success message)

4. **Verify:**
   - Expand the database
   - You should see all your tables: users, students, sections, etc.
   - Check the data is there

---

### **Option B: Using Command Line (Advanced)**

First, install psql if you haven't:
```bash
# The file is already in your project folder
# Just run this command with your Render credentials
psql -h dpg-d4mpccpr0fns73ad6uv0-a.singapore-postgres.render.com \
     -U omias_user \
     -d omias \
     -f ICTCOORdb_2025-12-01.sql
```

When prompted, enter the password from your Render dashboard.

---

### **Option C: Using the Node.js Script**

If you have both DATABASE_URL and local database credentials set up:

```bash
node import-render-db.js ICTCOORdb_2025-12-01.sql
```

---

## After Import

1. **Verify tables exist** in pgAdmin
2. **Redeploy application** on Render:
   - Go to https://dashboard.render.com
   - Click your Web Service
   - Click "Manual Deploy" or "Redeploy latest commit"
   - Wait for deployment to complete
3. **Test the application:**
   - Go to https://omias-1.onrender.com
   - Login with existing accounts from your database
   - Check if data is displaying correctly

---

## Your Database Contains

- **Users:** 2 rows (ictcoor account + 1 other)
- **Teachers:** 1 row
- **Students:** 1 row
- **Sections:** 18 rows
- **Enrollment Requests:** 6 rows
- **Document Requests:** 1 row
- **Snapshots:** 72 records with 759 snapshot students
- **And all other tables from your local setup**

---

## Troubleshooting

### "Authentication failed"
- Double-check the password from Render dashboard
- Make sure you're using the correct host (with `.render.com`)

### "Database 'omias' does not exist"
- Create it first: In pgAdmin, right-click **Databases** → **Create** → **Database** → name it **omias**
- Then try the restore again

### "Permission denied"
- Make sure the user **omias_user** has permissions
- In pgAdmin, right-click the database → **Properties** → **Security** → grant all privileges to **omias_user**

### Import takes a long time
- That's normal for large databases
- Don't close the terminal
- Check the process is running (you'll see updates in pgAdmin)

---

## Success!

Once imported, your application will:
✅ Have all your existing data
✅ Have all existing accounts
✅ Have all teacher/registrar/guidance accounts  
✅ Be ready for testing and use on Render

If you have questions, check the DATABASE_MIGRATION_GUIDE.md for more details!
