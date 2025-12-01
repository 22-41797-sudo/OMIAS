# Complete Database Schema for OMIAS (ICT Coordinator Dashboard)

## Overview
This document describes all database tables created for the OMIAS system supporting ICT Coordinator, Teachers, Registrar, Guidance Counselors, and public users.

---

## Authentication & User Management

### `users` Table
- Core authentication table for all roles
- Columns: id, username, password, role, is_active, created_at
- Roles: ictcoor, teacher, registrar, guidance, admin

---

## ICT Coordinator Tables

### `sections` Table
- Manages class sections across grade levels
- Columns: id, section_name, section_code, grade_level, adviser_id, adviser_name, max_capacity, current_count, academic_year, semester, is_active, created_at, updated_at
- Used by: ICT Coordinator, Teachers, Registrar

### `students` Table
- Core student information
- Columns: id, student_id, lrn, enrollment_id, first_name, middle_name, last_name, date_of_birth, gender, grade_level, section_id, current_address, barangay, city, province, guardian_name, guardian_contact, enrollment_status, has_been_assigned, created_at, updated_at
- Used by: All roles

### `section_snapshot_groups` Table
- Groups of snapshots for a specific school year/semester
- Columns: id, snapshot_name, created_by, school_year, semester, total_students, total_sections, created_at, updated_at, is_archived
- Used by: ICT Coordinator

### `section_snapshot_items` Table
- Section-level summary in a snapshot
- Columns: id, group_id (FK), section_id, section_name, section_code, grade_level, count, adviser_id, adviser_name, created_at
- Used by: ICT Coordinator

### `section_snapshot_students` Table
- Individual student details within a snapshot grouped by barangay
- Columns: id, group_id (FK), student_id (FK), section_id, section_name, student_name, lrn, current_address, barangay, grade_level, created_at
- Used by: ICT Coordinator

---

## Teacher Tables

### `teachers` Table
- Teacher profile and credentials
- Columns: id, teacher_id, user_id (FK), first_name, last_name, email, phone, specialization, department, is_active, created_at, updated_at
- Used by: Teachers, ICT Coordinator

### `teacher_sections` Table
- Links teachers to sections they teach
- Columns: id, teacher_id (FK), section_id, academic_year, is_current, created_at
- Used by: Teachers, ICT Coordinator

### `behavior_reports` Table
- Incident reports for student behavior (discipline)
- Columns: id, student_id (FK), student_name, section_id (FK), section_name, incident_type, description, severity, reported_by, reported_by_id (FK), report_date, action_taken, follow_up_date, created_at, updated_at
- Used by: Teachers, Guidance Counselors

---

## Registrar Tables

### `registrar_accounts` Table
- Registrar staff account information
- Columns: id, user_id (FK), registrar_id, office_name, is_active, created_at, updated_at
- Used by: Registrar staff

### `enrollment_requests` Table
- Pending student enrollment applications
- Columns: id, student_id, lrn, first_name, middle_name, last_name, date_of_birth, grade_level, guardian_name, status, rejection_reason, processed_by (FK), submitted_at, processed_at, created_at, updated_at
- Used by: Registrar, Students (via public enrollment form)

### `document_requests` Table
- Requests for student documents (transcripts, certificates, etc.)
- Columns: id, request_id, student_id, student_name, email, phone, document_type, quantity, purpose, status, submission_ip, processed_by (FK), processed_at, submitted_at, created_at, updated_at
- Used by: Public (students/guardians), Registrar

---

## Guidance Counselor Tables

### `guidance_accounts` Table
- Guidance counselor staff account information
- Columns: id, user_id (FK), guidance_id, counselor_name, email, phone, is_active, created_at, updated_at
- Used by: Guidance Counselors

### `behavior_report_archives` Table
- Archived behavior reports for student records
- Columns: id, original_report_id (FK), student_id (FK), section_id (FK), report_data (JSON), archived_by (FK), school_year, archive_date
- Used by: Guidance Counselors

---

## Public Enrollment Tables

### `early_registration` Table
- Pre-enrollment form submissions from public users
- Columns: id, student_id, lrn, first_name, middle_name, last_name, date_of_birth, age, gender, grade_level, guardian_name, guardian_contact, current_address, barangay, city, province, status, submission_timestamp, created_at
- Used by: Public (new student enrollment)

---

## Communication Tables

### `messaging` Table
- Inter-user messaging system
- Columns: id, sender_id, sender_role, recipient_id, recipient_role, message, attachment_url, is_read, read_at, created_at
- Used by: All authenticated users

### `notifications` Table
- System notifications for users
- Columns: id, user_id (FK), user_role, notification_type, title, message, is_read, link, read_at, created_at
- Used by: All authenticated users

---

## Security & Logging Tables

### `submission_logs` Table
- Logs of all form submissions (enrollment, documents, etc.)
- Columns: id, submission_type, email, ip_address, user_agent, status, details, created_at
- Used by: System administration, Spam detection

### `blocked_ips` Table
- IP addresses blocked from accessing the system
- Columns: id, ip_address (UNIQUE), reason, attempted_action, attempt_count, blocked_at, expires_at
- Used by: Security system, Admins

### `login_logs` Table
- Records of all login attempts
- Columns: id, user_id (FK), username, role, ip_address, user_agent, login_status, failed_attempts, created_at
- Used by: Security monitoring, Admins

### `audit_logs` Table
- Comprehensive audit trail of all data modifications
- Columns: id, user_id (FK), username, user_role, action, table_name, record_id, changes (JSON), ip_address, created_at
- Used by: Compliance, Auditing, Admin oversight

---

## Key Features

### Barangay Grouping
- Students' barangay is extracted from their address in snapshots
- Used for enrollment analytics and reporting
- Extracted as first word of `current_address` field

### Student Assignment Tracking
- `has_been_assigned` flag prevents students from reappearing in enrollment pool
- Once assigned to a section, student stays in assigned pool even if removed

### Snapshot System
- Point-in-time capture of enrollment data
- Separates section-level summary (`section_snapshot_items`) from student details (`section_snapshot_students`)
- Supports school year and semester tracking

### Behavior Management
- Teachers can report incidents
- Guidance counselors can archive reports
- Linked to student and section records for tracking

### Role-Based Access
- ICT Coordinator: Full system access, enrollment management
- Teachers: View sections, report behavior, manage their classes
- Registrar: Process enrollments, manage documents
- Guidance: View/archive behavior reports
- Public: Submit enrollment, request documents

---

## Deployment Notes

All tables are automatically created by `init-db.js` when the application starts on Render. Manual schema setup is only needed for development or emergency recovery using:

```bash
node setup-all-roles-schema.js
```

The `init-db.js` script handles:
- Table creation with proper foreign key relationships
- Automatic ictcoor account creation
- Column additions for backward compatibility
- Graceful handling of existing tables
