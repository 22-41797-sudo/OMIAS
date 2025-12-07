# OMIAS - Mainaga San Francisco Integrated School
## Functional and Non-Functional Requirements

---

## FUNCTIONAL REQUIREMENTS

### 1. USER AUTHENTICATION & ACCOUNT MANAGEMENT

**FR1.1 User Login**
- System shall allow users to authenticate using email and password
- System shall provide separate login portals for different user roles:
  - ICT Coordinator
  - Registrar
  - Guidance Counselor
  - Students/Parents

**FR1.2 Password Management**
- System shall allow users to reset forgotten passwords via email
- System shall enforce strong password policies (minimum 8 characters, alphanumeric)
- System shall hash and securely store passwords

**FR1.3 Account Creation**
- System shall allow automated account creation for registrars upon request
- System shall allow guidance counselors to create accounts through the system
- System shall validate email addresses during account creation

**FR1.4 Session Management**
- System shall maintain user sessions with timeout after 30 minutes of inactivity
- System shall allow users to log out and clear session data
- System shall track user login history and timestamps

---

### 2. ENROLLMENT MANAGEMENT

**FR2.1 Student Enrollment Form**
- System shall display comprehensive enrollment form with the following fields:
  - Student personal information (name, birthdate, gender, address)
  - LRN (Learner Reference Number)
  - Grade/Section Level
  - Barangay/Location
  - Parent/Guardian information
  - Contact numbers
  - Emergency contact details

**FR2.2 E-Signature Functionality**
- System shall allow students/parents to draw digital signatures on canvas
- System shall provide ability to maximize signature pad in full-screen modal
- System shall allow users to upload signature images (JPG, PNG)
- System shall clear and redraw signatures as needed
- System shall capture printed name and date of signature

**FR2.3 Form Validation**
- System shall validate all required fields before submission
- System shall provide error highlighting for invalid inputs
- System shall display clear error messages for each validation failure
- System shall prevent form submission if validation fails

**FR2.4 Data Persistence**
- System shall save submitted enrollment data to database
- System shall auto-generate enrollment reference numbers
- System shall store submission timestamps
- System shall maintain complete audit trail of submissions

**FR2.5 Enrollment Status Tracking**
- System shall allow students to check enrollment status
- System shall display enrollment stages (submitted, processing, approved, rejected)
- System shall provide reason for rejection if applicable
- System shall notify users of status changes

---

### 3. DOCUMENT REQUEST MANAGEMENT

**FR3.1 Document Request Form**
- System shall allow users to request documents (certificates, transcript, etc.)
- System shall provide list of available document types
- System shall capture requester information and delivery preferences
- System shall allow multiple document requests in single submission

**FR3.2 Document Status Tracking**
- System shall display real-time status of document requests
- System shall show stages: Pending → Processing → Ready → Released
- System shall allow users to track request through each stage
- System shall provide estimated completion date

**FR3.3 Request Management (Admin)**
- System shall allow registrars to view and manage document requests
- System shall provide bulk operations for status updates
- System shall generate document request reports
- System shall track document requests by date range

**FR3.4 Document Request Analytics**
- System shall display charts and statistics on document requests
- System shall show monthly request trends
- System shall categorize requests by document type
- System shall display request completion rates

---

### 4. STUDENT DATA MANAGEMENT

**FR4.1 Student Information Database**
- System shall maintain comprehensive student records
- System shall store student personal, academic, and contact information
- System shall support updating student information
- System shall archive inactive student records

**FR4.2 Section/Grade Management**
- System shall organize students by section and grade level
- System shall display student roster by section
- System shall assign class advisers to sections
- System shall support section creation and modification

**FR4.3 Student Search & Filtering**
- System shall allow searching students by name, LRN, or section
- System shall provide advanced filtering options
- System shall display search results with complete student information
- System shall support exporting student lists

**FR4.4 Bulk Data Import**
- System shall support CSV and XLSX file imports
- System shall parse flexible column formats (multiple name variations accepted)
- System shall validate imported data before insertion
- System shall handle large datasets (1000+ records) efficiently
- System shall create snapshots of imported data with versioning
- System shall auto-generate unique names for duplicate imports
- System shall provide import status and error reporting

---

### 5. GUIDANCE SERVICES MANAGEMENT

**FR5.1 Guidance Dashboard**
- System shall display comprehensive guidance statistics and analytics
- System shall show student enrollment counts by section
- System shall display document request statistics
- System shall show monthly trends and patterns

**FR5.2 Behavior Management**
- System shall allow recording student behavior incidents
- System shall track behavior types and severity levels
- System shall display behavior history and analytics
- System shall archive resolved behavior cases
- System shall provide behavior reports by student or section

**FR5.3 Student Recommendations**
- System shall allow guidance counselors to provide student recommendations
- System shall categorize recommendations by type
- System shall track follow-up actions and outcomes
- System shall display recommendation analytics

**FR5.4 Guidance Analytics**
- System shall display behavior trend charts
- System shall show monthly incident distribution
- System shall categorize incidents by type with visual charts
- System shall provide guidance counselor reports
- System shall support date range filtering for reports

---

### 6. REGISTRAR ANALYTICS & REPORTING

**FR6.1 Enrollment Analytics**
- System shall display enrollment statistics by grade level
- System shall show enrollment trends over time
- System shall provide enrollment gender distribution
- System shall display enrollment by barangay/location

**FR6.2 Document Request Analytics**
- System shall track document request volumes
- System shall display request completion times
- System shall show request types distribution
- System shall identify peak request periods

**FR6.3 Report Generation**
- System shall generate enrollment reports (PDF/Excel)
- System shall generate document request reports
- System shall allow custom date range selection
- System shall include charts and statistics in reports

**FR6.4 Data Export**
- System shall export student data to CSV/XLSX format
- System shall export enrollment statistics
- System shall maintain data integrity during export
- System shall support batch operations

---

### 7. NOTIFICATION & COMMUNICATION

**FR7.1 Email Notifications**
- System shall send enrollment confirmation emails
- System shall notify users of enrollment status changes
- System shall notify users of document request status updates
- System shall send password reset emails

**FR7.2 In-App Notifications**
- System shall display success modals for form submissions
- System shall show error messages for failed operations
- System shall provide real-time status updates
- System shall auto-dismiss notifications after timeout

**FR7.3 User Communication**
- System shall send automated responses to inquiries
- System shall display important announcements on homepage
- System shall maintain communication history
- System shall support scheduled notifications

---

### 8. SECURITY & ACCESS CONTROL

**FR8.1 Role-Based Access Control (RBAC)**
- System shall enforce different permissions for different user roles
- System shall restrict access to unauthorized pages/features
- System shall maintain role hierarchy (Admin > Registrar > Guidance > Student)
- System shall log unauthorized access attempts

**FR8.2 Data Protection**
- System shall encrypt sensitive data in transit (HTTPS)
- System shall hash passwords using secure algorithms
- System shall implement database-level encryption for PII
- System shall maintain secure file upload handling

**FR8.3 Input Validation & Sanitization**
- System shall validate all user inputs
- System shall sanitize inputs to prevent SQL injection
- System shall prevent XSS (Cross-Site Scripting) attacks
- System shall implement CSRF token protection

**FR8.4 Audit Logging**
- System shall log all user actions and modifications
- System shall track who accessed what data and when
- System shall maintain immutable audit trails
- System shall allow audit log review by administrators

---

### 9. DATA MANAGEMENT & SNAPSHOTS

**FR9.1 Snapshot Creation**
- System shall create snapshots of student datasets
- System shall timestamp each snapshot
- System shall assign unique snapshot names
- System shall prevent duplicate snapshot names

**FR9.2 Snapshot Management**
- System shall allow viewing snapshot details and contents
- System shall support multiple snapshots for different imports
- System shall maintain snapshot version history
- System shall allow snapshot deletion by authorized users

**FR9.3 Data Consistency**
- System shall validate data before snapshot creation
- System shall handle batch inserts efficiently (100+ records per batch)
- System shall prevent timeout errors on large imports
- System shall maintain data integrity across transactions

---

### 10. USER INTERFACE & PRESENTATION

**FR10.1 Responsive Design**
- System shall display correctly on desktop, tablet, and mobile devices
- System shall adapt layout for screen size ≤480px (mobile)
- System shall adapt layout for screen size 480-768px (tablet)
- System shall provide full features on all device sizes

**FR10.2 Navigation**
- System shall provide intuitive navigation menu
- System shall display hamburger menu on mobile devices (≤768px)
- System shall include breadcrumb navigation for multi-step forms
- System shall support back/forward navigation

**FR10.3 Data Visualization**
- System shall display enrollment statistics with charts (bar, line)
- System shall show document request distribution with vertical bar charts
- System shall provide monthly trend visualization
- System shall support chart filtering and date range selection

**FR10.4 Accessibility**
- System shall provide appropriate ARIA labels for screen readers
- System shall support keyboard navigation
- System shall display proper color contrast ratios
- System shall include alt text for images

---

## NON-FUNCTIONAL REQUIREMENTS

### 1. PERFORMANCE

**NFR1.1 Response Time**
- System shall respond to user requests within 2 seconds
- Page load time shall not exceed 3 seconds
- Database queries shall complete within 1 second for average datasets
- API endpoints shall respond within 500ms

**NFR1.2 Throughput**
- System shall support concurrent users: minimum 100 simultaneous users
- System shall handle 1000+ database records without performance degradation
- System shall process bulk imports (1000+ records) efficiently
- System shall maintain performance during peak hours

**NFR1.3 Database Optimization**
- System shall use batch inserts (100 records per batch) to prevent timeouts
- System shall implement proper database indexing
- System shall use connection pooling for database connections
- System shall optimize query execution plans

---

### 2. SCALABILITY

**NFR2.1 Horizontal Scalability**
- System shall support load balancing across multiple servers
- System shall use stateless session management
- System shall support database replication for high availability

**NFR2.2 Vertical Scalability**
- System shall efficiently utilize server resources
- System shall support increased storage capacity
- System shall handle growing user base without architecture changes

**NFR2.3 Data Growth**
- System shall maintain performance as data volume increases
- System shall support archival of historical data
- System shall implement data cleanup policies

---

### 3. RELIABILITY & AVAILABILITY

**NFR3.1 System Availability**
- System shall maintain 99% uptime (excluding scheduled maintenance)
- System shall provide scheduled maintenance windows (outside school hours)
- System shall gracefully degrade if secondary services fail

**NFR3.2 Backup & Recovery**
- System shall perform daily automated backups
- System shall support disaster recovery procedures
- System shall allow restore from backups with zero data loss
- System shall maintain backup integrity verification

**NFR3.3 Error Handling**
- System shall gracefully handle errors and exceptions
- System shall display user-friendly error messages
- System shall log all errors for troubleshooting
- System shall prevent application crashes

**NFR3.4 Data Consistency**
- System shall maintain ACID properties for transactions
- System shall prevent data corruption
- System shall implement referential integrity constraints
- System shall support transaction rollback on errors

---

### 4. SECURITY

**NFR4.1 Authentication Security**
- System shall use secure password hashing (bcrypt/PBKDF2)
- System shall enforce password complexity requirements
- System shall implement rate limiting on login attempts
- System shall use secure session tokens

**NFR4.2 Authorization Security**
- System shall enforce role-based access control
- System shall validate user permissions for each action
- System shall prevent privilege escalation attacks
- System shall maintain least privilege principle

**NFR4.3 Data Security**
- System shall encrypt data in transit (TLS/SSL)
- System shall encrypt sensitive data at rest
- System shall mask PII in logs and reports
- System shall implement secure file upload handling

**NFR4.4 Network Security**
- System shall use HTTPS for all communications
- System shall implement CORS policies
- System shall use secure cookies (HttpOnly, Secure flags)
- System shall implement rate limiting for APIs

**NFR4.5 Compliance**
- System shall comply with Data Privacy Act of 2012 (RA 10173)
- System shall implement data retention policies
- System shall support user data deletion requests
- System shall maintain privacy policy compliance

---

### 5. USABILITY

**NFR5.1 User Experience**
- System shall provide intuitive user interface
- System shall minimize steps required for common tasks
- System shall display clear feedback for user actions
- System shall provide helpful error messages

**NFR5.2 Accessibility**
- System shall comply with WCAG 2.1 AA standards
- System shall support screen reader compatibility
- System shall provide keyboard-only navigation
- System shall maintain appropriate color contrast

**NFR5.3 Mobile Experience**
- System shall provide full functionality on mobile devices
- System shall implement touch-friendly controls (44px minimum)
- System shall support mobile-specific features (hamburger menu)
- System shall provide responsive forms and inputs

**NFR5.4 Learning Curve**
- System shall require minimal user training
- System shall provide helpful tooltips and hints
- System shall include user documentation
- System shall support multiple languages (future)

---

### 6. MAINTAINABILITY

**NFR6.1 Code Quality**
- System shall follow consistent coding standards
- System shall maintain modular, loosely-coupled architecture
- System shall include comprehensive code comments
- System shall support automated testing

**NFR6.2 Documentation**
- System shall maintain API documentation
- System shall include system architecture diagrams
- System shall document database schema
- System shall maintain user/admin manuals

**NFR6.3 Version Control**
- System shall use Git for version control
- System shall maintain clear commit history
- System shall support branching for feature development
- System shall tag releases appropriately

**NFR6.4 Debugging & Monitoring**
- System shall include comprehensive logging
- System shall support application monitoring
- System shall provide performance metrics
- System shall allow runtime error tracing

---

### 7. COMPATIBILITY

**NFR7.1 Browser Compatibility**
- System shall support Chrome (latest 2 versions)
- System shall support Firefox (latest 2 versions)
- System shall support Safari (latest 2 versions)
- System shall support Edge (latest 2 versions)

**NFR7.2 Device Compatibility**
- System shall support iOS devices (iPhone, iPad)
- System shall support Android devices
- System shall support Windows devices
- System shall support macOS devices

**NFR7.3 Technology Stack Compatibility**
- System shall use Node.js for backend
- System shall use PostgreSQL for database
- System shall use EJS for templating
- System shall use Chart.js for visualizations

---

### 8. MAINTAINABILITY & SUPPORT

**NFR8.1 System Updates**
- System shall support security patches without downtime
- System shall allow feature updates with minimal disruption
- System shall maintain backward compatibility when possible
- System shall document breaking changes

**NFR8.2 Technical Support**
- System shall provide error reporting mechanism
- System shall include contact information for support
- System shall maintain support ticket system
- System shall respond to critical issues within 24 hours

---

### 9. TESTING

**NFR9.1 Test Coverage**
- System shall have minimum 80% code coverage for critical paths
- System shall include unit tests for all modules
- System shall include integration tests for workflows
- System shall include end-to-end tests for user journeys

**NFR9.2 Quality Assurance**
- System shall undergo functional testing before release
- System shall undergo performance testing
- System shall undergo security testing
- System shall include user acceptance testing (UAT)

---

### 10. DEPLOYMENT & OPERATIONS

**NFR10.1 Deployment Process**
- System shall support automated deployment pipeline
- System shall allow rollback to previous versions
- System shall maintain deployment documentation
- System shall support staging environment testing

**NFR10.2 Infrastructure**
- System shall run on cloud or on-premises servers
- System shall support containerization (Docker)
- System shall use environment-specific configurations
- System shall support CDN for static assets

**NFR10.3 Monitoring & Alerts**
- System shall monitor server health and resources
- System shall alert administrators on critical issues
- System shall log all system events
- System shall provide dashboard for monitoring

---

## SUMMARY

**Total Functional Requirements: 42+**
- User Authentication & Management: 4 FR
- Enrollment Management: 5 FR
- Document Request Management: 4 FR
- Student Data Management: 4 FR
- Guidance Services: 4 FR
- Registrar Analytics: 4 FR
- Notifications: 3 FR
- Security: 4 FR
- Data Management: 3 FR
- User Interface: 4 FR

**Total Non-Functional Requirements: 30+**
- Performance: 3 NFR
- Scalability: 3 NFR
- Reliability: 4 NFR
- Security: 5 NFR
- Usability: 4 NFR
- Maintainability: 4 NFR
- Compatibility: 3 NFR
- Support: 2 NFR
- Testing: 2 NFR
- Operations: 3 NFR

---

**Document Version:** 1.0  
**Last Updated:** December 7, 2025  
**Project:** OMIAS - Mainaga San Francisco Integrated School  
**School:** Mainaga San Francisco Integrated School  
**Status:** Active Development
