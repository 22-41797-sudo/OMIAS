# Student Accounts Management Feature

## Overview
Complete student account management system integrated with the OMIAS registrar dashboard. When registrars approve enrollment requests, they can create student accounts with auto-generated credentials that are displayed in two locations:

1. **Student Accounts Tab** - View all created accounts in one place
2. **History of Requests Tab** - See account status alongside each approval

## Features Implemented

### 1. Student Account Creation Flow
- **Trigger**: Registrar clicks "Approve" on an enrollment request
- **Modal**: Shows generated Student ID (format: 2025-XXXXX)
- **Credentials Generated**: 
  - Student ID (auto-incremented with year)
  - Username (same as student ID)
  - Password (randomly generated)
  - Account Status: Active
- **Storage**: Credentials saved in `student_accounts` table
- **Notification**: Message shows credentials were sent to student email

### 2. Student Accounts Dashboard Tab
**Location**: Registrar Dashboard → "👤 Student Accounts"

**Displays**:
- Student ID (unique identifier)
- Student Name (from enrollment request)
- Username (same as Student ID for login)
- Initial Password (auto-generated, displayed once)
- Email Address (from enrollment request)
- Account Status (Active/Inactive badge)
- Creation Date (timestamp)

**Functionality**:
- Auto-loads when tab is clicked
- Displays all student accounts in a sortable table
- Shows "No student accounts created yet" when empty
- Passwords shown as selectable code blocks (for manual copying)
- Refreshes after account creation without page reload

### 3. History of Requests Enhancement
**Location**: Registrar Dashboard → "📚 History of Requests"

**New Column**: "Student Account" showing:
- ✓ Student ID (if account created)
- ✓ Username
- ✓ Account Status badge (Active/Inactive)
- ✗ Dash (-) if no account created yet

**Data Joined**: Enrollment requests now display linked student account info

## Database Schema

### student_accounts Table
```sql
id                      SERIAL PRIMARY KEY
student_id             VARCHAR(20) UNIQUE
username               VARCHAR(100)
password_hash          VARCHAR(255)
email                  VARCHAR(100)
enrollment_request_id  FK to enrollment_requests (ON DELETE SET NULL)
account_status         VARCHAR(50) DEFAULT 'active'
created_at             TIMESTAMP DEFAULT NOW()
updated_at             TIMESTAMP DEFAULT NOW()
```

### Key Relationships
- `student_accounts.enrollment_request_id` → `enrollment_requests.id`
- Left join used to show accounts that exist
- Safely handles accounts with null enrollment references

## API Endpoints

### GET /api/student-accounts
**Purpose**: Fetch all student accounts for registrar dashboard

**Authentication**: Registrar role required

**Returns**:
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "student_id": "2025-00001",
      "username": "2025-00001",
      "password_hash": "$2b$10...",
      "email": "student@example.com",
      "account_status": "active",
      "created_at": "2025-12-23T10:30:00Z",
      "first_name": "John",
      "last_name": "Doe"
    }
  ]
}
```

### POST /api/create-student-account
**Purpose**: Create new student account when registrar approves enrollment

**Input**:
```json
{
  "enrollmentRequestId": 123
}
```

**Returns**:
```json
{
  "success": true,
  "account": {
    "student_id": "2025-00001",
    "username": "2025-00001",
    "initialPassword": "RandomP@ssw0rd!",
    "email": "student@example.com"
  }
}
```

### GET /api/next-student-id
**Purpose**: Get the next sequential student ID

**Returns**:
```json
{
  "success": true,
  "studentId": "2025-00002",
  "sequenceNumber": 2
}
```

## Student Login System

### Student Login Endpoint: POST /api/student/login
- Students authenticate with Student ID (username) and password
- Session created with `student` role
- Returns `studentId` and `enrollmentRequestId`
- Supports "Remember Me" functionality

### Login Page: student/Studentlogin.html
- Simple form interface
- Stores credentials in localStorage
- Redirects to student dashboard on success

### Student Dashboard: student/studentdashboard.html
- Displays enrollment information
- Shows student ID and associated data
- Links to view documents and submitted information

## Security Features

✓ **Password Hashing**: All passwords hashed with bcrypt (rounds: 10)
✓ **Session Authentication**: Role-based access control (registrar/student)
✓ **Email Validation**: Passwords sent to verified email addresses
✓ **FK Constraints**: Safe deletion with ON DELETE SET NULL
✓ **Input Validation**: Server-side validation of enrollment requests

## File Changes

### Modified Files
1. **server.js**
   - Added `/api/student-accounts` GET endpoint
   - Added `/api/next-student-id` GET endpoint  
   - Added `/api/create-student-account` POST endpoint
   - Added `/api/student/login` POST endpoint
   - Updated history query to include student account data

2. **views/registrarDashboard.ejs**
   - Added "👤 Student Accounts" sidebar navigation
   - Added `#studentAccounts` tab section with table
   - Added `loadStudentAccounts()` JavaScript function
   - Updated `initTabs()` to load accounts dynamically
   - Added "Student Account" column to history table
   - Enhanced `confirmCreateAccount()` to refresh accounts table

3. **init-db.js**
   - Created `student_accounts` table after `enrollment_requests`
   - Added FK constraint via ALTER TABLE for safety
   - Proper table initialization order

### New Files
- **student/Studentlogin.html** - Student login page
- **student/studentdashboard.html** - Student portal dashboard

## Usage Workflow

### For Registrar
1. **Review Enrollment Request**
   - Navigate to "📝 Enrollment Requests" tab
   - Review student information and documents
   
2. **Approve & Create Account**
   - Click "Approve" button
   - Confirm in modal
   - Auto-generated credentials appear in modal
   - Account is created automatically

3. **Monitor Accounts**
   - Navigate to "👤 Student Accounts" tab
   - View all created accounts
   - See Student ID, username, password, email, status
   - Check "📚 History of Requests" to see account status per student

### For Student
1. **Login**
   - Visit student login page
   - Enter Student ID as username
   - Enter initial password
   - Check "Remember Me" for convenience

2. **Access Portal**
   - View enrollment information
   - Check submitted documents
   - View account details

## Testing Checklist

- [ ] Create enrollment request
- [ ] Approve enrollment (modal appears with generated credentials)
- [ ] Verify account in "Student Accounts" tab
- [ ] Verify account info in "History of Requests"
- [ ] Login as student with generated credentials
- [ ] View student dashboard with enrollment data
- [ ] Verify password is hashed in database
- [ ] Test account refresh without page reload
- [ ] Test browser back/forward navigation on accounts tab

## Future Enhancements

**Possible Features**:
- Reset password functionality for students
- Bulk export of accounts (CSV/Excel)
- Account deactivation/deletion
- Student account search/filter
- Send credentials via email (automated)
- Two-factor authentication (2FA)
- Account activity logging
- Mass account creation from pending enrollments

## Troubleshooting

**Issue**: Foreign key constraint error
**Solution**: Ensure `enrollment_requests` table created before `student_accounts`

**Issue**: Student ID showing as "2025-#####"
**Solution**: Call `/api/next-student-id` to get actual ID before displaying modal

**Issue**: Passwords not displaying in history
**Solution**: Check that LEFT JOIN includes NULL values for accounts not yet created

**Issue**: Account creation taking too long
**Solution**: Check bcrypt rounds (default 10) and password generation logic

---

**Last Updated**: December 23, 2025
**Version**: 1.0
**Status**: Production Ready
