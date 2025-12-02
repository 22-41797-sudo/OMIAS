# Teacher & Guidance Pages - Complete Schema Documentation

## Overview
This document contains the complete schemas for both Teacher and Guidance portal pages that are deployed on Render.

---

## TEACHER PORTAL

### 1. Teacher Login Page (`/teacher-login`)
**File:** `views/teacher/teacher-login.html`

#### Features:
- Email/Username and password authentication
- "Remember me" functionality (localStorage)
- Beautiful gradient login form with school logo
- Responsive design with smooth animations
- Error/Success alert messages
- Loading state with spinner animation

#### Key CSS Variables (Teacher Theme):
```css
--teacher-primary: #0f766e (teal)
--teacher-accent: #065f46 (darker teal)
--teacher-button-from: #06b6d4
--teacher-button-to: #0f766e
```

#### API Endpoint:
- **POST** `/api/teacher/login` - Authenticate teacher with username/password
  - Request: `{ username, password, rememberMe }`
  - Response: `{ success, redirect: '/teacher' }`

#### Features Implementation:
- Form validation before submission
- Session cookie management (`credentials: 'include'`)
- localStorage for username persistence
- Auto-focus on username field
- Keyboard enter key support
- XSS protection with no eval

---

### 2. Teacher Dashboard/Demographics (`/teacher`)
**File:** `views/teacher/teacher-demographics.html`

#### Layout Structure:
```
Header (Navbar with logout & notifications)
├── School Logo
├── Notification Bell (with unread badge)
└── Logout Button

Main Content (Tabbed Interface - Vertical Sidebar)
├── Tab 1: My Profile
│   ├── Name, Username, Email, Contact Number
│   └── Read-only display
│
├── Tab 2: My Advisory
│   ├── Current Section Info (Name, Student Count, Male/Female)
│   ├── Search/Filter Students
│   └── Students Table:
│       ├── Name, LRN, Sex, Age
│       └── Action Buttons: View Details, View Reports
│
├── Tab 3: Section Reports
│   ├── Behavior reports for current section
│   ├── Search & Date Range Filters
│   └── Reports Table:
│       ├── Date, Student Name, Category, Severity, Notes
│       └── Shows only for assigned section
│
└── Tab 4: Messages from Guidance
    ├── Messages received from Guidance Office
    ├── Search & Date Range Filters
    ├── Messages Table:
    │   ├── Date, From, Student Name, Message, Action
    │   └── Mark as Read functionality
    └── Unread Badge Counter
```

#### Key Data Loaded on Page Init:
1. **Teacher Profile** - Name, username, email, contact
2. **Assigned Section** - Single section teacher is assigned to
3. **Section Students** - All students in assigned section
4. **Behavior Reports** - Section-level reports
5. **Messages** - Unread messages from Guidance

#### Modals:
1. **Student Details Modal**
   - Personal Info: Full Name, LRN, Birthday, Age, Sex, Religion
   - Academic Info: School Year, Grade Level, Enrollment ID, Gmail
   - Contact Info: Address, Contact Number
   - Family Info: Father, Mother, Guardian Names

2. **Behavior Reports Modal**
   - Shows all reports for selected student
   - Add new report functionality

3. **Add Report Form**
   - Category: (Disruption, Attendance, Academic, Conduct, Bullying, etc.)
   - Severity: (Low, Medium, High)
   - Detailed Notes textarea

#### API Endpoints Used:
- **GET** `/api/teacher/me` - Get logged-in teacher profile
- **GET** `/api/teacher/assigned-section` - Get teacher's assigned section
- **GET** `/api/teacher/sections` - Get all sections for teacher (fallback)
- **GET** `/api/teacher/sections/{sectionId}/students` - Get students in section
- **GET** `/api/teacher/students/{studentId}` - Get student details
- **GET** `/api/behavior-reports?studentId={id}` - Get reports for student
- **GET** `/api/behavior-reports?sectionId={id}` - Get section reports
- **POST** `/api/behavior-reports` - Create new behavior report
- **GET** `/api/teacher/messages` - Get messages from guidance
- **PUT** `/api/teacher/messages/{id}/read` - Mark message as read
- **GET** `/api/teacher/messages/unread-count` - Get unread count

#### Styling:
**File:** `views/teacher/teacher.css`

Key Features:
- Red & White theme (school colors)
- Modern professional design
- Sticky header with red bottom border
- Vertical tab sidebar layout
- Responsive for mobile (stacks to horizontal tabs)
- Card-based layout with shadows
- Smooth transitions and hover effects
- Badge counters for notifications/unread messages

---

## GUIDANCE PORTAL

### Files in Guidance Directory:
```
views/guidance/
├── guidance-login.html             (Login page)
├── guidance-dashboard.html          (Main dashboard - HTML)
├── guidance-dashboard.ejs           (Main dashboard - EJS template)
├── guidance-behavior-analytics.html (Analytics for behavior reports)
├── guidance-behavior-archive.html   (Archive/history of reports)
├── guidance-document-requests.html  (Document request management)
├── guidance-document-requests.js    (Document request functionality)
├── guidance-recommendations.html    (Student recommendations)
├── guidance-sent-messages.html      (Messages to teachers)
├── guidance-styles.css              (Main stylesheet)
└── guidanceAnalytics.ejs            (EJS template for analytics)
```

### 1. Guidance Login Page (`/guidance-login`)
**File:** `views/guidance/guidance-login.html`

#### Features:
- Email and password authentication
- Professional login form with school branding
- Remember me checkbox
- Error/Success messaging
- Form validation
- Loading state with spinner

#### API Endpoint:
- **POST** `/api/guidance/login` - Authenticate guidance staff
  - Request: `{ email, password }`
  - Response: `{ success, redirect: '/guidance' }`

---

### 2. Guidance Dashboard (`/guidance`)
**Files:** `views/guidance/guidance-dashboard.html`, `views/guidance/guidance-dashboard.ejs`

#### Navigation Tabs:
1. **Dashboard** - Overview of guidance activities
2. **My Students** - List of students and their status
3. **Behavior Reports** - Student behavior tracking
4. **Document Requests** - Manage document requests from students
5. **Messages to Teachers** - Send messages to class advisers
6. **Recommendations** - Academic/welfare recommendations

#### Core Features:

#### A. Dashboard Tab
- Quick stats: Total students, pending documents, open cases
- Recent activity feed
- Quick action buttons

#### B. My Students Tab
- Search functionality
- Filter by status
- Student table with:
  - Name, Grade Level, Section, Status
  - Academic performance indicator
  - Last contact date
  - Quick action buttons

#### C. Behavior Reports Tab
- Report creation form
- Report history/archive
- Analytics and trends
- Filter by date range, category, severity

#### D. Document Requests Tab
- Request approval system
- Track document types
- Student list with request status
- Batch processing

#### E. Messages to Teachers Tab
- Compose messages to class advisers
- Message history
- Read/unread status
- Attachments support

#### F. Recommendations Tab
- Student academic recommendations
- Welfare/counseling notes
- Escalation to parents/administration
- Recommendation tracking

---

### 3. Guidance Behavior Analytics (`/guidance-analytics`)
**File:** `views/guidance/guidance-behavior-analytics.html`

#### Features:
- Chart.js visualizations
- Category breakdown (Disruption, Attendance, Conduct, etc.)
- Severity distribution
- Trend analysis over time
- Student-specific analytics
- Exportable reports

#### Charts Included:
- Pie chart: Category distribution
- Bar chart: Severity levels
- Line chart: Trend over time
- Heatmap: Student-category matrix

---

### 4. Guidance Document Requests Management
**Files:** `views/guidance/guidance-document-requests.html`, `views/guidance/guidance-document-requests.js`

#### Document Types Supported:
- Certificate of Enrollment
- Good Moral Certificate
- Transcript of Records
- Diploma/Graduation Certificate
- Medical Records
- Clearance Forms

#### Status Workflow:
```
Pending → Approved → Processing → Ready for Pickup → Claimed
           ↓
        Rejected
```

#### Features:
- Request queue management
- Priority levels
- Due date tracking
- Batch approval/rejection
- Student notification
- Document print integration

---

### 5. Guidance Styles
**File:** `views/guidance/guidance-styles.css`

#### Theme:
- Professional blue/teal color scheme
- Card-based layout
- Responsive grid system
- Mobile-first approach
- Smooth transitions

#### Key Components:
- Alert boxes (info, success, warning, error)
- Modal dialogs
- Form inputs with validation states
- Table styling
- Badge counters
- Button variations (primary, secondary, ghost)

---

## DATABASE SCHEMA RELATIONSHIPS

### Teacher Portal Tables:
```
teachers
├── id (PK)
├── username (UNIQUE)
├── password (hashed)
├── first_name
├── middle_name
├── last_name
├── email
├── contact_number
├── created_at
└── updated_at

sections
├── id (PK)
├── section_name
├── grade_level
├── adviser_id (FK → teachers.id)
├── school_year
└── created_at

students
├── id (PK)
├── full_name
├── lrn (UNIQUE)
├── section_id (FK → sections.id)
├── birthday
├── sex
├── religion
├── current_address
├── contact_number
├── gmail_address
├── father_name
├── mother_name
├── guardian_name
├── enrollment_status
└── created_at

behavior_reports
├── id (PK)
├── student_id (FK → students.id)
├── section_id (FK → sections.id)
├── reported_by (FK → teachers.id)
├── category (Disruption, Attendance, Conduct, etc.)
├── severity (Low, Medium, High)
├── notes
├── report_date
└── created_at

teacher_messages
├── id (PK)
├── teacher_id (FK → teachers.id)
├── sender_id (FK → guidance_accounts.id)
├── student_id (FK → students.id)
├── message TEXT
├── is_read BOOLEAN
├── created_at
└── updated_at
```

### Guidance Portal Tables:
```
guidance_accounts
├── id (PK)
├── username
├── email
├── password (hashed)
├── first_name
├── last_name
├── position
├── contact_number
├── created_at
└── updated_at

document_requests
├── id (PK)
├── student_id (FK → students.id)
├── document_type
├── requested_by (FK → guidance_accounts.id)
├── status (Pending, Approved, Processing, Ready, Claimed)
├── priority_level
├── due_date
├── completed_date
├── notes
├── created_at
└── updated_at

recommendations
├── id (PK)
├── student_id (FK → students.id)
├── created_by (FK → guidance_accounts.id)
├── type (Academic, Behavioral, Welfare)
├── content TEXT
├── priority_level
├── follow_up_date
├── status
├── created_at
└── updated_at
```

---

## AUTHENTICATION & SESSION MANAGEMENT

### Teacher Portal:
- Session-based authentication
- Cookies with httpOnly flag
- CSRF protection
- Role-based access control (teacher role)
- Automatic redirect to login on 401

### Guidance Portal:
- Email/Password authentication
- Session management
- Optional remember-me functionality
- Session timeout (configurable)
- Role-based access (guidance role)

---

## RESPONSIVE DESIGN

### Breakpoints:
- **Desktop:** 1200px+
  - Vertical tab sidebar layout
  - Multi-column grids
  - Full-featured UI
  
- **Tablet:** 940px - 1199px
  - Adjusted grid layouts
  - Horizontal tabs
  - Optimized spacing
  
- **Mobile:** < 640px
  - Single column layout
  - Touch-friendly buttons
  - Stacked navigation
  - Simplified tables with horizontal scroll

---

## PERFORMANCE OPTIMIZATIONS

### Client-Side:
- Caching of student/report data
- Client-side filtering for instant search
- Lazy loading of modals
- Event delegation for table actions
- Debounced search inputs

### Server-Side:
- Database query optimization with indexes
- Pagination for large datasets
- Caching of frequently accessed data
- API response compression

---

## SECURITY CONSIDERATIONS

### Implemented:
- SQL injection prevention (parameterized queries)
- XSS protection (HTML escaping)
- CSRF tokens (if forms used)
- Password hashing (bcrypt)
- Session validation
- Role-based access control
- CORS configuration

### Session Management:
- Session timeout: 24 hours (configurable)
- Secure cookies (HttpOnly, SameSite)
- Session regeneration on login
- Proper logout cleanup

---

## NOTIFICATION SYSTEM

### Teacher Portal:
- Notification bell in navbar
- Unread message counter badge
- Toast notifications (success, error, warning)
- Auto-refresh of unread count every 2 minutes
- Real-time update when tab visibility changes

### Guidance Portal:
- Document request status notifications
- Message acknowledgment system
- Email notifications (optional)
- In-app notification center

---

## CUSTOM UTILITIES

### Toast Notifications:
```javascript
showToast(message, type = 'info')
// Types: 'success', 'error', 'warning', 'info'
```

### Modal Management:
```javascript
openModal(modalId)
closeModal(modalId)
toggleModal(modalId)
```

### Date Utilities:
```javascript
parseDateOnly(dateString)     // Parse date without time
formatDate(date)              // Format for display
getDateRange(from, to)        // Validate date range
```

---

## RENDER DEPLOYMENT

### Environment Variables Needed:
```
DB_HOST=<postgresql-host>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_NAME=<database-name>
NODE_ENV=production
PORT=3000
SESSION_SECRET=<random-secret-key>
```

### Build/Start Commands:
```bash
npm install
npm start
```

### Render Service Configuration:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Node Version:** 22.16.0 (or specified in package.json)
- **Region:** Select closest to users

---

## DEPLOYMENT CHECKLIST

- [ ] Environment variables configured in Render
- [ ] Database migrations run
- [ ] Session secret generated and set
- [ ] Email service configured (if needed)
- [ ] File upload storage configured
- [ ] CORS settings validated
- [ ] SSL/TLS certificate active
- [ ] Database backups configured
- [ ] Error logging configured
- [ ] Performance monitoring setup

---

## FUTURE ENHANCEMENTS

1. **Two-Factor Authentication** - SMS/Email OTP
2. **Real-time Notifications** - WebSocket integration
3. **Mobile App** - React Native version
4. **Advanced Analytics** - Predictive insights
5. **Document e-signature** - Digital document signing
6. **Parent Portal** - Integration for parents
7. **API Documentation** - OpenAPI/Swagger
8. **Multi-language Support** - i18n implementation
9. **Dark Mode** - Theme toggle
10. **Offline Support** - PWA capabilities

---

**Last Updated:** December 3, 2025
**Version:** 1.0.0
**Status:** Production Ready
