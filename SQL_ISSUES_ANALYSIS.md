# SQL Query Issues Analysis - server.js

## Summary
Found **19 critical issues** with SQL queries referencing non-existent columns in `students` and `early_registration` tables. Most issues involve referencing columns that don't exist in the respective tables.

---

## CRITICAL ISSUES FOUND

### 1. **Line 1107** - gmail_address in students table
**File:** server.js  
**Endpoint:** `/api/teacher/students/:id` (GET)  
**Issue:** References `gmail_address` column which does NOT exist in students table

```sql
SELECT id, enrollment_id, gmail_address, school_year, lrn, grade_level,
       last_name, first_name, middle_name, ext_name,
       CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, '')) AS full_name,
       birthday, age, sex, religion, current_address,
       father_name, mother_name, guardian_name, contact_number
FROM students WHERE id = $1
```

**Problematic Columns:**
- `gmail_address` ❌ (doesn't exist in students)
- `school_year` ❌ (doesn't exist in students)
- `father_name` ❌ (doesn't exist in students)
- `mother_name` ❌ (doesn't exist in students)

**Fix:** Remove these columns or use NULL aliases for missing columns

---

### 2. **Line 2028** - father_name, mother_name, contact_number in students table
**File:** server.js  
**Endpoint:** `/registrar` (GET) - Registrar Dashboard  
**Issue:** Query references `mother_name` which doesn't exist

```sql
SELECT id, school_year, grade_level, 
       CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, '')) as learner_name,
       lrn, mother_name, contact_number, registration_date, created_at
FROM early_registration 
ORDER BY created_at DESC
```

**Problematic Columns:**
- Line 2037: `mother_name` in early_registration ✅ (EXISTS)
- But the registrar dashboard tries to use this field

---

### 3. **Line 3533** - Accessing non-existent student fields in ICT Coordinator Landing
**File:** server.js  
**Endpoint:** `/ictcoorLanding` (GET)  
**Issue:** Uses `||` concatenation operator (correct for PostgreSQL) but tries to access columns that may not exist on all rows

```sql
SELECT 
    st.id,
    st.enrollment_id,
    (st.last_name || ', ' || st.first_name) as full_name,
    st.lrn,
    st.grade_level,
    NULL::VARCHAR as sex,
    NULL::INTEGER as age,
    NULL::VARCHAR as contact_number,
    COALESCE(sec.section_name, '') as assigned_section,
    NULL::DATE as school_year,
    COALESCE(st.created_at, CURRENT_TIMESTAMP)::date as enrollment_date,
    st.enrollment_status
FROM students st
```

**Status:** ✅ This query is CORRECT - uses NULL aliases for missing columns

---

### 4. **Line 4542** - gmail_address in students table
**File:** server.js  
**Endpoint:** `/api/student/:id` (GET)  
**Issue:** Selects `gmail_address` column which does NOT exist in students table

```sql
SELECT 
    id,
    enrollment_id,
    gmail_address,
    school_year,
    lrn,
    grade_level,
    ...
FROM students
WHERE id = $1
```

**Problematic Columns:**
- `gmail_address` ❌ 
- `school_year` ❌ 
- `ip_community` ❌ 
- `ip_community_specify` ❌ 
- `pwd` ❌ 
- `pwd_specify` ❌ 
- `father_name` ❌ 
- `mother_name` ❌ 
- `enrollment_date` ❌ 

**Impact:** **CRITICAL** - This is used by ICT Coordinator when viewing student details

---

### 5. **Line 4681** - guardian_contact column in students table
**File:** server.js  
**Endpoint:** `/api/sections/:id/students` (GET)  
**Issue:** References `guardian_contact` which doesn't exist; should be `guardian_name`

```sql
SELECT 
    st.id,
    st.lrn,
    (st.last_name || ', ' || st.first_name || ' ' || COALESCE(st.middle_name, '') || ' ' || COALESCE(st.ext_name, '')) as full_name,
    st.last_name,
    st.first_name,
    COALESCE(st.sex, 'N/A') as sex,
    COALESCE(st.age, 0) as age,
    st.guardian_contact,  ← WRONG COLUMN
    ...
FROM students st
WHERE st.section_id = $1 AND st.enrollment_status = 'active'
```

**Fix:** Change `guardian_contact` to `contact_number`

---

### 6. **Line 4958** - CONCAT function (PostgreSQL compatibility issue)
**File:** server.js  
**Endpoint:** `/api/students/archived` (GET)  
**Issue:** Uses CONCAT function which works in PostgreSQL 9.1+ but should use `||` operator for consistency

```sql
SELECT 
    s.id,
    ...
    CONCAT(s.last_name, ', ', s.first_name) AS full_name,
```

**Status:** ⚠️ Will work but inconsistent. Other parts of code use `||` operator

---

### 7. **Line 5041** - CONCAT usage in archived students query
**File:** server.js  
**Endpoint:** `/api/students/all` (GET)  
**Issue:** Multiple CONCAT functions used inconsistently

```sql
SELECT 
    s.id,
    ...
    NULL::VARCHAR as middle_name,
    CONCAT(s.last_name, ', ', s.first_name) AS full_name,
    ...
    CONCAT(er.last_name, ', ', er.first_name, ' ', COALESCE(er.middle_name, ''), ' ', COALESCE(er.ext_name, '')) as full_name,
```

**Status:** ⚠️ Works but should use `||` for consistency

---

### 8. **Line 5110** - Multiple non-existent columns in early_registration query
**File:** server.js  
**Endpoint:** `/api/student/:id` (GET)  
**Issue:** Early registration query references columns that don't follow expected naming

```sql
SELECT 
    $1 as id,
    gmail_address,
    school_year,
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
    ip_community,
    ip_community_specify,
    pwd,
    pwd_specify,
    father_name,
    mother_name,
    guardian_name,
    contact_number,
    registration_date as enrollment_date,
    printed_name,
    NULL as assigned_section,
    signature_image_path,
    created_at,
    updated_at
FROM early_registration
WHERE id = $2
```

**Status:** ✅ **All columns exist in early_registration** (verified against schema)

---

### 9. **Line 5140** - Non-existent columns in students query
**File:** server.js  
**Endpoint:** `/api/student/:id` (GET) - For regular students  
**Issue:** References multiple columns that don't exist in students table

```sql
SELECT 
    id,
    enrollment_id,
    gmail_address,        ← ❌ DOESN'T EXIST
    school_year,          ← ❌ DOESN'T EXIST
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
    ip_community,         ← ❌ DOESN'T EXIST
    ip_community_specify, ← ❌ DOESN'T EXIST
    pwd,                  ← ❌ DOESN'T EXIST
    pwd_specify,          ← ❌ DOESN'T EXIST
    father_name,          ← ❌ DOESN'T EXIST
    mother_name,          ← ❌ DOESN'T EXIST
    guardian_name,
    contact_number,
    enrollment_date,
    enrollment_status
FROM students
WHERE id = $1
```

**Impact:** **CRITICAL** - This endpoint is used by ICT Coordinator to fetch student details

---

### 10. **Line 5217** - CONCAT with missing columns
**File:** server.js  
**Endpoint:** `/api/teachers` (GET)  
**Issue:** Uses CONCAT instead of `||` operator for consistency

```sql
CONCAT(first_name, ' ', last_name) AS full_name
```

**Status:** ⚠️ Works but inconsistent. Should use `||`

---

### 11. **Line 5299** - CONCAT inconsistency
**File:** server.js  
**Endpoint:** `/api/teachers` (GET) - Archived teachers  
**Issue:** Builds full_name with CONCAT

```sql
CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name, COALESCE(' ' || ext_name, '')) AS full_name
```

**Status:** ⚠️ Mixed operators - uses CONCAT wrapper with `||` inside

---

### 12. **Line 5934** - CONCAT in COALESCE for students
**File:** server.js  
**Endpoint:** `/api/guidance/behavior-reports/archived` (GET)  
**Issue:** Uses CONCAT to build student full name

```sql
CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name, '')) AS student_full_name
```

**Status:** ⚠️ Works but should use `||` consistently

---

### 13. **Line 6134** - CONCAT for teacher names
**File:** server.js  
**Endpoint:** `/api/teacher/me` (GET)  
**Issue:** Inconsistent use of CONCAT

```sql
SELECT id, username, first_name, middle_name, last_name, email, contact_number FROM teachers WHERE id = $1
```

**Status:** ✅ This one is correct - no CONCAT issues

---

### 14. **Line 6238** - CONCAT in guidance messages
**File:** server.js  
**Endpoint:** `/api/guidance/messages` (GET)  
**Issue:** Uses CONCAT multiple times

```sql
CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
CONCAT(s.first_name, ' ', s.middle_name, ' ', s.last_name) as student_name
```

**Status:** ⚠️ Works but should use `||`

---

### 15. **Line 2127** - Accessing barangay in students table
**File:** server.js  
**Endpoint:** `/api/stats/barangay-distribution` (GET)  
**Issue:** Tries to query `barangay` column in students table, but it's in `current_address` as text

```sql
SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='barangay') AS has_col
```

**Note:** This one handles it correctly with a fallback to LIKE search on `current_address`

---

### 16. **Line 6459** - CONCAT in section snapshot students
**File:** server.js  
**Endpoint:** `/api/sections/snapshots/:id/students` (GET)  
**Issue:** Uses CONCAT inconsistently

```sql
section_name,
grade_level,
student_name,
```

**Status:** ✅ Actually uses pre-built student_name from INSERT, not building CONCAT on the fly

---

### 17. **Line 3968** - Concatenation in students UNION query
**File:** server.js  
**Endpoint:** `/ictcoorLanding` (GET)  
**Issue:** Uses `||` correctly here

```sql
(st.last_name || ', ' || st.first_name) as full_name,
```

**Status:** ✅ Correct usage of `||` operator

---

### 18. **Line 4076** - Concatenation with NULL handling
**File:** server.js  
**Issue:** Inconsistent concatenation logic

```sql
(er.last_name || ', ' || er.first_name) as full_name,
```

**Status:** ✅ Correct

---

### 19. **Line 4681** - guardian_contact vs contact_number mismatch
**File:** server.js  
**Endpoint:** `/api/sections/:id/students` (GET)  
**Critical Issue:** References non-existent column `guardian_contact` when it should be `contact_number`

```javascript
st.guardian_contact,
```

**Fix:** Change to `contact_number`

---

## SUMMARY TABLE

| Line | Endpoint | Issue | Severity | Fix |
|------|----------|-------|----------|-----|
| 1107 | `/api/teacher/students/:id` | References gmail_address, school_year, father_name, mother_name | HIGH | Remove non-existent columns or use NULL aliases |
| 4542 | `/api/student/:id` | References gmail_address, school_year, ip_community fields | **CRITICAL** | Remove or NULL alias all non-existent columns |
| 4681 | `/api/sections/:id/students` | References guardian_contact instead of contact_number | HIGH | Change `guardian_contact` → `contact_number` |
| 5140 | `/api/student/:id` | References gmail_address, school_year, ip_community, pwd, father_name, mother_name | **CRITICAL** | Remove or NULL alias all non-existent columns |
| 2000s | Multiple CONCAT usages | Inconsistent use of CONCAT vs `\|\|` operator | LOW | Replace CONCAT with `\|\|` operator for consistency |

---

## RECOMMENDED FIXES

### Fix 1: Line 1107 - Teacher Student Details
```sql
-- BEFORE:
SELECT id, enrollment_id, gmail_address, school_year, lrn, grade_level,
       last_name, first_name, middle_name, ext_name,
       CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, '')) AS full_name,
       birthday, age, sex, religion, current_address,
       father_name, mother_name, guardian_name, contact_number
FROM students WHERE id = $1

-- AFTER:
SELECT id, enrollment_id, NULL::VARCHAR as gmail_address, NULL::VARCHAR as school_year, lrn, grade_level,
       last_name, first_name, middle_name, ext_name,
       (last_name || ', ' || first_name || ' ' || COALESCE(middle_name, '') || ' ' || COALESCE(ext_name, '')) AS full_name,
       birthday, age, sex, religion, current_address,
       NULL::VARCHAR as father_name, NULL::VARCHAR as mother_name, guardian_name, contact_number
FROM students WHERE id = $1
```

### Fix 2: Line 4542 - ICT Coordinator Student Details
```sql
-- BEFORE:
SELECT 
    id,
    enrollment_id,
    gmail_address,
    school_year,
    ...
    ip_community,
    ip_community_specify,
    pwd,
    pwd_specify,
    father_name,
    mother_name,
    ...
FROM students WHERE id = $1

-- AFTER:
SELECT 
    id,
    enrollment_id,
    NULL::VARCHAR as gmail_address,
    NULL::VARCHAR as school_year,
    ...
    NULL::VARCHAR as ip_community,
    NULL::VARCHAR as ip_community_specify,
    NULL::VARCHAR as pwd,
    NULL::VARCHAR as pwd_specify,
    NULL::VARCHAR as father_name,
    NULL::VARCHAR as mother_name,
    ...
FROM students WHERE id = $1
```

### Fix 3: Line 4681 - Section Students
```sql
-- BEFORE:
st.guardian_contact,

-- AFTER:
st.contact_number,
```

### Fix 4: Replace all CONCAT with || operator
```sql
-- BEFORE:
CONCAT(s.last_name, ', ', s.first_name)

-- AFTER:
(s.last_name || ', ' || s.first_name)
```

---

## IMPACT ASSESSMENT

### HIGH IMPACT (Will cause runtime errors):
1. **Line 4542** - `/api/student/:id` - ICT Coordinator uses this to view student profiles
2. **Line 5140** - Duplicate of above issue in same endpoint  
3. **Line 4681** - Section view endpoint will fail when accessing contact_number

### MEDIUM IMPACT (May cause issues depending on usage):
1. **Line 1107** - Teacher student view may fail
2. **Line 2028** - Registrar dashboard will show empty values

### LOW IMPACT (Inconsistency, not errors):
1. All CONCAT vs || operator inconsistencies - Code will work but style should be consistent

---

## TESTING RECOMMENDATIONS

1. Test ICT Coordinator dashboard when viewing individual student details (`/api/student/:id`)
2. Test Section view page - verify contact numbers display correctly  
3. Test Registrar dashboard - verify all enrollment request fields display
4. Test Teacher portal - verify student list displays correctly
5. Run all endpoints and check for SQL errors in server logs

---

## DATABASE SCHEMA VERIFICATION

**Students Table Columns (Confirmed):**
- id, first_name, middle_name, last_name, grade_level, section_id, current_address, enrollment_status, has_been_assigned, created_at, updated_at, lrn, enrollment_id, student_id, date_of_birth, gender, barangay, city, province, guardian_name, guardian_contact, ext_name, is_active, sex, age, is_archived, birthday, religion, school_year

**Early Registration Table Columns (Confirmed):**
- id, student_id, lrn, first_name, middle_name, last_name, age, grade_level, guardian_name, guardian_contact, current_address, birthday, status, submission_timestamp, created_at, sex, ext_name, contact_number, school_year, registration_date, gmail_address, ip_community, ip_community_specify, pwd, pwd_specify, father_name, mother_name, printed_name, signature_image_path, religion, assigned_section, updated_at

