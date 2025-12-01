# Student Registration Enrollment Fix

## Issue
POST request to `/add-registration` endpoint was returning **500 (Internal Server Error)** when trying to save student enrollment information.

## Root Cause
The `early_registration` and `enrollment_requests` database tables were missing critical columns that the application was trying to insert data into, causing database constraint violations.

## Missing Columns Fixed

### Early Registration Table
The following columns were missing but being used by the application:
- `gmail_address` - Student's email address
- `school_year` - Academic school year
- `ip_community` - Indigenous people community indicator
- `ip_community_specify` - Specific IP community name
- `pwd` - Person with disability indicator
- `pwd_specify` - Specific disability type
- `father_name` - Father's name
- `mother_name` - Mother's name
- `printed_name` - Printed signature name
- `signature_image_path` - Path to signature image file
- `ext_name` - Extension name (suffix)
- `sex` - Student's sex/gender
- `religion` - Student's religion
- `contact_number` - Student's contact number
- `assigned_section` - Section the student is assigned to
- `updated_at` - Last update timestamp

### Enrollment Requests Table
The following columns were added for the approval/rejection workflow:
- `gmail_address` - Student's email
- `age` - Student's age
- `sex` - Student's sex/gender
- `birthday` - Student's birthdate
- `religion` - Student's religion
- `current_address` - Student's current address
- `contact_number` - Student's contact number
- `reviewed_by` - Registrar who reviewed the request
- `reviewed_at` - When the request was reviewed

## Solution
1. **Updated `init-db.js`** - Added all missing columns to table creation statements
2. **Updated `init-db.js`** - Added ALTER TABLE statements for backwards compatibility
3. **Improved Error Logging** - Enhanced error messages in `/add-registration` endpoint to show actual database errors

## How to Test

### On Localhost:
1. Navigate to Registrar Dashboard
2. Click "Add New Registration"
3. Fill in student information including all optional fields
4. Submit the form
5. Enrollment data should now be saved successfully

### On Render:
1. Wait for automatic database reinitialization on next app restart
2. Repeat localhost steps

## Files Modified
- `server.js` - Added detailed error logging in `/add-registration` endpoint
- `init-db.js` - Comprehensive schema updates for early_registration and enrollment_requests tables

## Expected Behavior After Fix
- Student registration form submissions save successfully to the database
- All student fields (demographics, address, parents, etc.) are properly stored
- Registrar can approve/reject enrollment requests without database errors
- Signature images are properly associated with registrations
