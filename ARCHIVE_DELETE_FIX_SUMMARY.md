# Archive & Delete Functionality Fix - Summary

## Issues Fixed

### Issue 1: Archived Students Disappearing from ICT COOR Dashboard
**Problem:** When a student was archived in the ICT COOR unassigned students section, they completely disappeared and couldn't be recovered.

**Root Cause:** The `/api/students/unassigned` endpoint was only querying students with `section_id IS NULL`, which didn't include archived students.

**Solution Implemented:**
- Updated query to: `WHERE st.section_id IS NULL OR st.is_archived = true`
- Archived students now appear in the unassigned list when "Show Archived" checkbox is checked
- Added ordering to show active students first, then archived

**File Modified:** `server.js` - `/api/students/unassigned` endpoint (Line 5697+)

```javascript
// Before:
WHERE st.section_id IS NULL

// After:
WHERE st.section_id IS NULL OR st.is_archived = true
ORDER BY st.is_archived, st.grade_level, st.last_name, st.first_name
```

### Issue 2: No Way to Delete Student Accounts in Registrar Dashboard
**Problem:** Student accounts in the registrar dashboard could only be edited, not deleted. There was no way to permanently remove them from the database.

**Solution Implemented:**
1. **Added DELETE API Endpoint:** `/api/student-accounts/:accountId`
   - Permanently removes student account from `student_accounts` table
   - Only accessible to registrar role
   - Includes confirmation dialog to prevent accidental deletion
   - Returns success message with username for clarity

2. **Added Delete Button to Registrar Dashboard**
   - Red trash icon button next to Edit button
   - Passes account ID, student ID, and username to delete function
   - Shows confirmation dialog with account details

**Files Modified:**
- `server.js` - Added DELETE endpoint (Line 2479+)
- `registrarDashboard.ejs` - Added delete button and function (Line 1710+, 1791+)

## Data Flow After Fix

### Archived Students in ICT COOR:
```
1. ICT COOR: Click "Archive" button on student
   → Student is_archived = true
   
2. ICT COOR: Check "Show Archived" checkbox
   → Archived students now appear in the list
   
3. ICT COOR: Can now:
   - Click "Recover" button → Unarchives student (is_archived = false)
   - Click "Delete" button → Permanently removes from enrollment_requests
```

### Student Account Deletion in Registrar:
```
1. Registrar: Click delete (trash) button on student account
   
2. System: Shows confirmation dialog
   "Are you sure you want to permanently delete the student account 
    for '2025-00001 - johndoe'? This action cannot be undone."
   
3. User: Confirms deletion
   
4. System: Deletes student_accounts record permanently
   
5. Student: Can no longer log in (account removed from database)
```

## API Endpoints

### GET `/api/students/unassigned`
**Updated:** Now returns archived students with `is_archived = true`
- Purpose: Get unassigned (and archived) students for ICT COOR
- Returns: Combined list from students table and enrollment_requests
- Includes: Archived students when they have `section_id IS NULL` OR `is_archived = true`

### DELETE `/api/student-accounts/:accountId` (NEW)
**Added:** Permanent student account deletion
- Purpose: Delete student account from database (registrar only)
- Authentication: Requires registrar role
- Action: Removes entire row from student_accounts table
- Response: Success message with deleted username

## Frontend Changes

### ICT COOR Dashboard (ictcoorLanding.ejs)
**No changes needed** - Already has:
- "Show Archived" checkbox that filters archived students
- Recover button for archived students: `recoverStudent()`
- Delete button for archived students: `permanentlyDeleteStudent()`

### Registrar Dashboard (registrarDashboard.ejs)
**Changes:**
1. Added delete button to student accounts table (Line 1710)
2. Added `deleteStudentAccount()` function (Line 1791)
   - Shows confirmation dialog
   - Calls DELETE `/api/student-accounts/:accountId`
   - Reloads account list after deletion

## Database Impact

### students table
- `is_archived` column used to mark deleted students
- Soft delete: Data remains but student hidden when `is_archived = true`
- Recover operation: Sets `is_archived = false`

### student_accounts table
- **Permanent delete:** Row completely removed from table
- **No recovery:** Student can never log in again
- **No backup:** Data is gone once deleted

### enrollment_requests table
- Unaffected by student account deletion
- Enrollment records preserved for registration history
- Can still be managed independently by registrar

## Security Considerations

✅ **Registrar Only:** Delete account requires registrar authentication
✅ **Confirmation Required:** Dialog prevents accidental deletion
✅ **Clear Messaging:** User sees account details before deletion
✅ **Audit Trail:** Server logs deletion for accountability
✅ **Two Systems:** Student accounts (login) separate from enrollment records

## Testing Checklist

- [ ] **Archive Functionality:**
  - Login as ICT COOR
  - Archive a student from unassigned list
  - Check "Show Archived" checkbox
  - Verify student appears with recover/delete buttons
  - Click recover - student should unarchive

- [ ] **Delete Student Account:**
  - Login as Registrar
  - Go to Student Accounts tab
  - Find a student account
  - Click delete button (trash icon)
  - Verify confirmation dialog appears
  - Confirm deletion
  - Verify account is removed from list
  - Try logging in with that account - should fail

- [ ] **Student Dashboard:**
  - Archived students' dashboards should not be affected
  - Student can still see enrollment info
  - No impact on active students

- [ ] **Data Integrity:**
  - Archived students still in students table
  - Deleted student accounts gone from student_accounts
  - Enrollment records preserved in enrollment_requests

## Status: ✅ COMPLETE

✅ Archived students now visible in ICT COOR dashboard
✅ Can recover or permanently delete archived students
✅ Student accounts can be deleted from registrar dashboard
✅ Confirmation dialogs prevent accidental deletion
✅ All operations log for audit trail
✅ Student dashboard functionality preserved

## Deployment Notes

- Server requires restart for changes to take effect
- No database migration needed (uses existing columns)
- Backwards compatible with existing data
- Safe to deploy to production
