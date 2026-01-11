# Grade Level Tracking Feature

## Overview
This feature allows teachers to update student grade levels, and ICT coordinators to see which students have been promoted/updated by teachers for reassignment to new sections/grades.

## Database Changes

### New Columns Added to `students` table:
- `previous_grade_level` (VARCHAR(20)) - Stores the previous grade level before update
- `grade_level_updated_date` (TIMESTAMP) - When the grade level was last updated
- `grade_level_updated_by` (VARCHAR(100)) - Name of the teacher/user who updated it

### New Optional Table: `grade_level_changes` (Audit Log)
- Maintains complete history of all grade level changes
- Records: student_id, old_grade_level, new_grade_level, changed_by, changed_at

## API Endpoints

### 1. Teacher/ICT Coordinator: Update Student Grade Level
**Endpoint:** `PUT /api/students/:id/update-grade-level`

**Who can use:** Teachers and ICT Coordinators

**Request Body:**
```json
{
  "newGradeLevel": "Grade 5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student \"Doe, John\" grade level updated from Grade 4 to Grade 5",
  "oldGradeLevel": "Grade 4",
  "newGradeLevel": "Grade 5",
  "updatedBy": "Ma'am Jane",
  "updatedAt": "2026-01-11T10:30:00.000Z"
}
```

### 2. ICT Coordinator: Get Recent Grade Updates
**Endpoint:** `GET /api/students/grade-updates/recent?days=30`

**Who can use:** ICT Coordinators only

**Query Parameters:**
- `days` (optional) - Number of days to look back (default: 30)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "updates": [
    {
      "id": 123,
      "full_name": "Doe, John",
      "lrn": "101234567890",
      "previous_grade_level": "Grade 4",
      "grade_level": "Grade 5",
      "grade_level_updated_date": "2026-01-11T10:30:00.000Z",
      "grade_level_updated_by": "Ma'am Jane",
      "section_id": 5,
      "current_section": "Grade 4-A"
    }
  ]
}
```

## Workflow

### For Teachers:
1. Open a student's profile in their section
2. Find the "Edit Grade Level" option
3. Select the new grade level
4. Click "Update"
5. The system records:
   - New grade level
   - Previous grade level
   - Teacher's name
   - Timestamp of the change

### For ICT Coordinators:
1. Go to Dashboard
2. Look for "Grade Level Updates" section
3. See list of students whose grade was recently updated
4. Review which students are ready to be moved to a new section
5. Use "Assign to Section" or "Reassign" to move them to appropriate grade level sections

## Tracking Information

When a teacher updates a student's grade level, the following is recorded:
- ✅ Student name and ID
- ✅ Previous grade level
- ✅ New grade level
- ✅ Who made the change (teacher name)
- ✅ When it was changed (timestamp)
- ✅ Current section assignment

## Notes

- Same grade level changes are not allowed (system will reject)
- Only teachers and ICT coordinators can update grades
- All changes are logged with timestamp and user name
- Optional: Complete audit trail in `grade_level_changes` table
- ICT coordinators should regularly check for grade updates to reassign students promptly

## Implementation Status

✅ Database migration created: `migrations/add_grade_level_tracking.sql`
✅ API endpoints created in `server.js`
⏳ Teacher UI for grade editing (to be added to teacher dashboard)
⏳ ICT Coordinator "Grade Level Updates" section (to be added to landing page)
