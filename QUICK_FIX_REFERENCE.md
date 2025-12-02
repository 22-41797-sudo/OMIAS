# QUICK FIX REFERENCE - server.js SQL Issues

## 🔴 CRITICAL ISSUES (Will Break)

### Issue #1: Line 4542 & 5140 - `/api/student/:id` endpoint
**Problem:** Queries non-existent columns in `students` table
```javascript
// REMOVE or NULL ALIAS these columns:
- gmail_address (doesn't exist in students)
- school_year (doesn't exist in students)  
- ip_community (doesn't exist in students)
- ip_community_specify (doesn't exist in students)
- pwd (doesn't exist in students)
- pwd_specify (doesn't exist in students)
- father_name (doesn't exist in students)
- mother_name (doesn't exist in students)
- enrollment_date (doesn't exist in students)
```

### Issue #2: Line 4681 - `/api/sections/:id/students` endpoint
**Problem:** Wrong column name
```javascript
// CHANGE THIS:
st.guardian_contact,

// TO THIS:
st.contact_number,
```

---

## 🟡 HIGH ISSUES (May Break)

### Issue #3: Line 1107 - `/api/teacher/students/:id` endpoint
**Problem:** References non-existent columns
```javascript
// NULL ALIAS these columns:
- gmail_address ❌
- school_year ❌  
- father_name ❌
- mother_name ❌
```

---

## 🟠 STYLE ISSUES (Will Work, But Inconsistent)

### Issue #4: CONCAT vs || operator
**Locations:** Lines 2028, 4958, 5041, 5110, 5217, 5299, 5934, 6238, etc.

**Problem:** Mixed use of CONCAT() function and || operator

**Standard PostgreSQL approach:** Use || operator
```sql
-- Instead of:
CONCAT(s.last_name, ', ', s.first_name)

-- Use:
(s.last_name || ', ' || s.first_name)
```

---

## FILES THAT NEED FIXES

| Line | File | Endpoint | Fix Type |
|------|------|----------|----------|
| 4542, 5140 | server.js | `/api/student/:id` | Remove/NULL alias columns |
| 4681 | server.js | `/api/sections/:id/students` | Column name fix |
| 1107 | server.js | `/api/teacher/students/:id` | Remove/NULL alias columns |
| Multiple | server.js | Various | Replace CONCAT with \|\| |

---

## HOW TO FIX EACH ISSUE

### Fix #1: Lines 4542 & 5140 - Student Details Query
```javascript
// Find this query:
const result = await pool.query(`
    SELECT 
        id,
        enrollment_id,
        gmail_address,    ← DELETE OR NULL ALIAS
        school_year,      ← DELETE OR NULL ALIAS
        lrn,
        grade_level,
        last_name,
        first_name,
        middle_name,
        ext_name,
        CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, '')) AS full_name,
        birthday,
        age,
        sex,
        religion,
        current_address,
        ip_community,          ← DELETE OR NULL ALIAS
        ip_community_specify,  ← DELETE OR NULL ALIAS
        pwd,                   ← DELETE OR NULL ALIAS
        pwd_specify,           ← DELETE OR NULL ALIAS
        father_name,           ← DELETE OR NULL ALIAS
        mother_name,           ← DELETE OR NULL ALIAS
        guardian_name,
        contact_number,
        enrollment_date,       ← DELETE OR NULL ALIAS
        enrollment_status
    FROM students
    WHERE id = $1
`)

// Option A: Delete the non-existent columns
// Option B: Replace with NULL aliases
// Option C: Use NULL::VARCHAR as column_name
```

### Fix #2: Line 4681 - Guardian Contact
```javascript
// Find:
st.guardian_contact,

// Replace with:
st.contact_number,
```

### Fix #3: Line 1107 - Teacher Students Query
```javascript
// Find the SELECT statement in /api/teacher/students/:id
// Replace non-existent columns with NULL aliases or remove them
```

### Fix #4: CONCAT to || replacements
```javascript
// Find all instances like:
CONCAT(last_name, ', ', first_name)

// Replace with:
(last_name || ', ' || first_name)
```

---

## VERIFICATION STEPS

After applying fixes:

1. **Test Student Details Endpoint:**
   ```bash
   curl http://localhost:3000/api/student/1
   ```
   Should return student data without SQL errors

2. **Test Section Students:**
   ```bash
   curl http://localhost:3000/api/sections/1/students
   ```
   Should return contact numbers correctly

3. **Check Server Logs:**
   Look for SQL errors like "column does not exist"

4. **Test ICT Coordinator Dashboard:**
   - View student details
   - Verify all fields display correctly
   - No SQL errors in console

---

## PRIORITY ORDER FOR FIXES

1. **FIRST** (Breaks functionality): Fix lines 4542, 5140 (student details)
2. **SECOND** (Breaks display): Fix line 4681 (guardian_contact)  
3. **THIRD** (Breaks display): Fix line 1107 (teacher students)
4. **FOURTH** (Style improvement): Replace CONCAT with ||

---

## NOTES

- `students` table DOES NOT have: gmail_address, school_year, ip_community, ip_community_specify, pwd, pwd_specify, father_name, mother_name, enrollment_date
- `early_registration` table HAS: all the above fields
- When querying `students` table for fields that only exist in `early_registration`, use NULL aliases
- PostgreSQL: Use `||` operator for string concatenation, not CONCAT()
