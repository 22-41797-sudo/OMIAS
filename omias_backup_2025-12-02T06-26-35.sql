-- Complete OMIAS Database Export
-- Generated: 2025-12-02T06:26:33.991Z
-- Instructions: Run this file in your Render database

-- Disable foreign key checks
SET CONSTRAINTS ALL DEFERRED;


-- Table: audit_logs
DROP TABLE IF EXISTS "audit_logs" CASCADE;
CREATE TABLE "audit_logs" (
    "id" integer DEFAULT nextval('audit_logs_id_seq'::regclass) NOT NULL,
    "user_id" integer,
    "username" character varying,
    "user_role" character varying,
    "action" character varying,
    "table_name" character varying,
    "record_id" integer,
    "changes" json,
    "ip_address" character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: behavior_report_archives
DROP TABLE IF EXISTS "behavior_report_archives" CASCADE;
CREATE TABLE "behavior_report_archives" (
    "id" integer DEFAULT nextval('behavior_report_archives_id_seq'::regclass) NOT NULL,
    "original_report_id" integer,
    "student_id" integer,
    "section_id" integer,
    "report_data" json,
    "archived_by" integer,
    "school_year" character varying,
    "archive_date" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: behavior_reports
DROP TABLE IF EXISTS "behavior_reports" CASCADE;
CREATE TABLE "behavior_reports" (
    "id" integer DEFAULT nextval('behavior_reports_id_seq'::regclass) NOT NULL,
    "student_id" integer,
    "student_name" character varying,
    "section_id" integer,
    "section_name" character varying,
    "incident_type" character varying,
    "description" text,
    "severity" character varying,
    "reported_by" character varying,
    "report_date" date,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "action_taken" text,
    "follow_up_date" date
);

-- Table: blocked_ips
DROP TABLE IF EXISTS "blocked_ips" CASCADE;
CREATE TABLE "blocked_ips" (
    "id" integer DEFAULT nextval('blocked_ips_id_seq'::regclass) NOT NULL,
    "ip_address" character varying NOT NULL,
    "reason" text NOT NULL,
    "blocked_by" integer,
    "blocked_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "expires_at" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "unblocked_by" integer,
    "unblocked_at" timestamp without time zone,
    "notes" text
);

-- Table: document_requests
DROP TABLE IF EXISTS "document_requests" CASCADE;
CREATE TABLE "document_requests" (
    "id" integer DEFAULT nextval('document_requests_id_seq'::regclass) NOT NULL,
    "request_token" character varying NOT NULL,
    "student_name" character varying NOT NULL,
    "student_id" character varying,
    "contact_number" character varying NOT NULL,
    "email" character varying NOT NULL,
    "document_type" character varying NOT NULL,
    "purpose" text NOT NULL,
    "additional_notes" text,
    "adviser_name" character varying,
    "adviser_school_year" character varying,
    "student_type" character varying,
    "status" character varying DEFAULT 'pending'::character varying,
    "processed_by" integer,
    "processed_at" timestamp without time zone,
    "completion_notes" text,
    "rejection_reason" text,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "quantity" integer DEFAULT 1,
    "submitted_at" timestamp without time zone
);
INSERT INTO "document_requests" ("id", "request_token", "student_name", "student_id", "contact_number", "email", "document_type", "purpose", "additional_notes", "adviser_name", "adviser_school_year", "student_type", "status", "processed_by", "processed_at", "completion_notes", "rejection_reason", "created_at", "updated_at", "quantity", "submitted_at") VALUES (4, '5NZE-LL2K-CZFK', 'Kero, carl miro', NULL, '09453234567', 'kerocarl111@gmail.com', 'Certificate of Enrollment', 'For Scholarship', 'N/A', 'Mrs. Bella', '2020-2021', 'student', 'pending', NULL, NULL, NULL, NULL, '2025-11-20T05:12:43.389Z', '2025-11-20T05:12:43.389Z', 1, NULL);

-- Table: early_registration
DROP TABLE IF EXISTS "early_registration" CASCADE;
CREATE TABLE "early_registration" (
    "id" integer DEFAULT nextval('early_registration_id_seq'::regclass) NOT NULL,
    "gmail_address" character varying NOT NULL,
    "school_year" character varying NOT NULL,
    "lrn" character varying,
    "grade_level" character varying NOT NULL,
    "last_name" character varying NOT NULL,
    "first_name" character varying NOT NULL,
    "middle_name" character varying,
    "ext_name" character varying,
    "birthday" date NOT NULL,
    "age" integer NOT NULL,
    "sex" character varying NOT NULL,
    "religion" character varying,
    "current_address" text NOT NULL,
    "ip_community" character varying NOT NULL,
    "ip_community_specify" character varying,
    "pwd" character varying NOT NULL,
    "pwd_specify" character varying,
    "father_name" character varying,
    "mother_name" character varying,
    "guardian_name" character varying,
    "contact_number" character varying,
    "registration_date" date NOT NULL,
    "signature_image_path" character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "printed_name" character varying,
    "assigned_section" character varying,
    "is_archived" boolean DEFAULT false
);
INSERT INTO "early_registration" ("id", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "signature_image_path", "created_at", "updated_at", "printed_name", "assigned_section", "is_archived") VALUES (31, 'jamezbello93@gmail.com', '2025 - 2026', '4444444', 'Grade 5', '22', '22', '22', NULL, '2025-11-30T16:00:00.000Z', 1, 'Male', '22', 'Mainaga', 'No', NULL, 'No', NULL, '22', '22', '222', '09433452476', '2025-11-30T16:00:00.000Z', '/uploads/signatures/signature-1764567437882.png', '2025-12-01T05:37:17.969Z', '2025-12-01T06:28:38.469Z', '22', 'Kinder - angel', false);

-- Table: enrollment_requests
DROP TABLE IF EXISTS "enrollment_requests" CASCADE;
CREATE TABLE "enrollment_requests" (
    "id" integer DEFAULT nextval('enrollment_requests_id_seq'::regclass) NOT NULL,
    "request_token" character varying NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying,
    "gmail_address" character varying NOT NULL,
    "school_year" character varying NOT NULL,
    "lrn" character varying,
    "grade_level" character varying NOT NULL,
    "last_name" character varying NOT NULL,
    "first_name" character varying NOT NULL,
    "middle_name" character varying,
    "ext_name" character varying,
    "birthday" date NOT NULL,
    "age" integer NOT NULL,
    "sex" character varying NOT NULL,
    "religion" character varying,
    "current_address" text NOT NULL,
    "ip_community" character varying NOT NULL,
    "ip_community_specify" character varying,
    "pwd" character varying NOT NULL,
    "pwd_specify" character varying,
    "father_name" character varying,
    "mother_name" character varying,
    "guardian_name" character varying,
    "contact_number" character varying,
    "registration_date" date NOT NULL,
    "printed_name" character varying NOT NULL,
    "signature_image_path" text,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" integer,
    "reviewed_at" timestamp without time zone,
    "rejection_reason" text
);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (19, 'FNRR-NAND-SWEJ', 'approved', 'johnrenzo11@gmail.com', '2025 - 2026', NULL, 'Grade 2', 'Macalin', 'Renzo', 'Grab', 'Jr.', '2013-12-31T16:00:00.000Z', 21, 'Male', 'Roman Catholic', 'San Francisco , Mabini, Batangas', 'No', '', 'No', '', 'Macalin Renzer Grab', NULL, NULL, '09983453445', '2025-11-19T16:00:00.000Z', 'Renzer G. Macalin', '/uploads/signatures/signature-1763599226551-444626175.png', '2025-11-20T00:40:27.011Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-20T06:12:43.096Z', NULL);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (20, 'S5QY-3265-B43N', 'approved', 'asa@gmail.com', '2025 - 2026', '111111111111', 'Grade 1', '1', '1', '1', NULL, '2025-11-23T16:00:00.000Z', 14, 'Male', 'Roman Catholic', 'San Juan, Mabini, Batangas', 'No', '', 'No', '', '1 1 1 1', '1 1 1 1', '1 1 1 1', '09456433445', '2025-11-23T16:00:00.000Z', '1', '/uploads/signatures/signature-1763994613804-98595783.png', '2025-11-24T14:30:14.311Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-24T15:59:34.180Z', NULL);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (21, 'Y9T2-WGZJ-P6PX', 'approved', 'jamezbello93@gmail.com', '2025 - 2026', NULL, 'Grade 7', 'ndks', 'mxkskis', 'mksks', NULL, '2025-11-25T16:00:00.000Z', 1, 'Male', 'jkk', 'San juan, Mabini, Batangas', 'No', '', 'No', '', 'rome crist bret', NULL, NULL, '09483473445', '2025-11-25T16:00:00.000Z', 'rome crist', '/uploads/signatures/signature-1764139337145-476157140.png', '2025-11-26T06:42:18.088Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-26T06:42:36.738Z', NULL);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (23, 'TAM8-8YKK-ANG3', 'approved', 'jamezbello93@gmail.com', '2025 - 2026', '222222222222', 'Grade 4', 'clksa', 'csafcaw', 'vae', NULL, '2025-11-26T16:00:00.000Z', 33, 'Male', 'vsef', 'San Juan, mabini, bats', 'No', '', 'No', '', 'cwaca cac vaevea', 'ca vadas cc', 'faw fsed fe', '09345675443', '2025-11-26T16:00:00.000Z', 'jvha', '/uploads/signatures/signature-1764220937867-595210363.png', '2025-11-27T05:22:17.965Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-27T05:23:28.781Z', NULL);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (24, 'B62D-MTVW-XHP7', 'approved', 'jamezbello93@gmail.com', '2025 - 2026', '333333333333', 'Kinder', 'qqqqq', 'qqqq', 'qqqqq', NULL, '2025-11-28T16:00:00.000Z', 22, 'Male', 'Religion 4a', 'San Francisco, csafaf, sdawf', 'No', '', 'No', '', 'csac csac adc', NULL, NULL, '09343244556', '2025-11-28T16:00:00.000Z', 'sdawf', '/uploads/signatures/signature-1764378493451-32306659.png', '2025-11-29T01:08:14.041Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-29T01:09:33.952Z', NULL);
INSERT INTO "enrollment_requests" ("id", "request_token", "status", "gmail_address", "school_year", "lrn", "grade_level", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "contact_number", "registration_date", "printed_name", "signature_image_path", "created_at", "updated_at", "reviewed_by", "reviewed_at", "rejection_reason") VALUES (22, 'X3A2-2BYH-T3PW', 'approved', 'flwafwa@gmail.com', '2025 - 2026', '222222222222', 'Grade 3', 'dowia', 'ljdhwaf', 'lcjshz', NULL, '2025-11-25T16:00:00.000Z', 33, 'Male', 'vljdh', 'idfayse, hifa, khghaf', 'No', '', 'No', '', 'cjlsac', 'cljlosa', 'vlhad', '09432342334', '2025-11-25T16:00:00.000Z', 'flajhwf', '/uploads/signatures/signature-1764158825785-2840396.png', '2025-11-26T12:07:06.716Z', '2025-11-30T12:05:03.045Z', NULL, '2025-11-29T11:59:47.601Z', NULL);

-- Table: guidance_accounts
DROP TABLE IF EXISTS "guidance_accounts" CASCADE;
CREATE TABLE "guidance_accounts" (
    "id" integer DEFAULT nextval('guidance_accounts_id_seq'::regclass) NOT NULL,
    "fullname" character varying NOT NULL,
    "username" character varying NOT NULL,
    "password" character varying NOT NULL,
    "email" character varying,
    "contact_number" character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "guidance_accounts" ("id", "fullname", "username", "password", "email", "contact_number", "is_active", "created_at", "updated_at") VALUES (3, 'Guidance Counselor', 'Guidance_Counselor01', '$2b$10$2XvlfRFDRUNoPjogP8eVmukb57BgfLm.2g1ERYGKPszsJ89Kziyzi', 'Guidance@Counselor.com', '09374596554', true, '2025-11-23T03:36:08.669Z', '2025-11-23T03:36:08.669Z');

-- Table: guidance_teacher_messages
DROP TABLE IF EXISTS "guidance_teacher_messages" CASCADE;
CREATE TABLE "guidance_teacher_messages" (
    "id" integer DEFAULT nextval('guidance_teacher_messages_id_seq'::regclass) NOT NULL,
    "guidance_id" integer NOT NULL,
    "teacher_id" integer NOT NULL,
    "student_id" integer,
    "message" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_archived" boolean DEFAULT false
);

-- Table: login_logs
DROP TABLE IF EXISTS "login_logs" CASCADE;
CREATE TABLE "login_logs" (
    "id" integer DEFAULT nextval('login_logs_id_seq'::regclass) NOT NULL,
    "user_id" integer,
    "username" character varying,
    "role" character varying,
    "ip_address" character varying,
    "user_agent" text,
    "login_status" character varying,
    "failed_attempts" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: messaging
DROP TABLE IF EXISTS "messaging" CASCADE;
CREATE TABLE "messaging" (
    "id" integer DEFAULT nextval('messaging_id_seq'::regclass) NOT NULL,
    "sender_id" integer,
    "sender_role" character varying,
    "recipient_id" integer,
    "recipient_role" character varying,
    "message" text,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications
DROP TABLE IF EXISTS "notifications" CASCADE;
CREATE TABLE "notifications" (
    "id" integer DEFAULT nextval('notifications_id_seq'::regclass) NOT NULL,
    "user_id" integer,
    "user_role" character varying,
    "notification_type" character varying,
    "title" character varying,
    "message" text,
    "is_read" boolean DEFAULT false,
    "link" character varying,
    "read_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: registrar_accounts
DROP TABLE IF EXISTS "registrar_accounts" CASCADE;
CREATE TABLE "registrar_accounts" (
    "id" integer DEFAULT nextval('registrar_accounts_id_seq'::regclass) NOT NULL,
    "user_id" integer,
    "registrar_id" character varying,
    "office_name" character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: registraraccount
DROP TABLE IF EXISTS "registraraccount" CASCADE;
CREATE TABLE "registraraccount" (
    "id" integer DEFAULT nextval('registraraccount_id_seq'::regclass) NOT NULL,
    "fullname" character varying NOT NULL,
    "username" character varying NOT NULL,
    "password" character varying NOT NULL
);
INSERT INTO "registraraccount" ("id", "fullname", "username", "password") VALUES (5, 'registrar2025', 'registrar2025', '$2b$10$k0DCnmAoG0yolXFK5Pw/P.zBsAvC258qGbLqtjlJ3LSOnaBVrRHlu');

-- Table: section_counts_history
DROP TABLE IF EXISTS "section_counts_history" CASCADE;
CREATE TABLE "section_counts_history" (
    "id" integer DEFAULT nextval('section_counts_history_id_seq'::regclass) NOT NULL,
    "section_id" integer NOT NULL,
    "school_year" character varying NOT NULL,
    "recorded_count" integer NOT NULL,
    "recorded_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: section_snapshot_groups
DROP TABLE IF EXISTS "section_snapshot_groups" CASCADE;
CREATE TABLE "section_snapshot_groups" (
    "id" integer DEFAULT nextval('section_snapshot_groups_id_seq'::regclass) NOT NULL,
    "snapshot_name" text NOT NULL,
    "created_by" integer,
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "section_snapshot_groups" ("id", "snapshot_name", "created_by", "is_archived", "created_at") VALUES (65, 'sdkas', 2, false, '2025-11-29T10:56:29.761Z');
INSERT INTO "section_snapshot_groups" ("id", "snapshot_name", "created_by", "is_archived", "created_at") VALUES (66, 'qqq', 2, false, '2025-11-29T11:16:08.312Z');
INSERT INTO "section_snapshot_groups" ("id", "snapshot_name", "created_by", "is_archived", "created_at") VALUES (67, 'mmmm', 2, false, '2025-11-30T10:14:55.045Z');
INSERT INTO "section_snapshot_groups" ("id", "snapshot_name", "created_by", "is_archived", "created_at") VALUES (69, '44', 2, false, '2025-12-01T06:58:16.439Z');

-- Table: section_snapshot_items
DROP TABLE IF EXISTS "section_snapshot_items" CASCADE;
CREATE TABLE "section_snapshot_items" (
    "id" integer DEFAULT nextval('section_snapshot_items_id_seq'::regclass) NOT NULL,
    "group_id" integer,
    "section_id" integer,
    "section_name" text,
    "grade_level" text,
    "count" integer,
    "adviser_name" text
);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (902, 65, NULL, 'Grade 7', 'Grade 7', 64, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (903, 65, NULL, 'Non-Grade', 'Non-Grade', 68, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (904, 65, NULL, 'Grade 8', 'Grade 8', 73, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (905, 65, NULL, 'Grade 9', 'Grade 9', 83, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (906, 65, NULL, 'Grade 2', 'Grade 2', 60, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (907, 65, NULL, 'Grade 6', 'Grade 6', 68, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (908, 65, NULL, 'Kinder', 'Kinder', 63, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (909, 65, NULL, 'Grade 5', 'Grade 5', 74, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (910, 65, NULL, 'Grade 3', 'Grade 3', 69, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (911, 65, NULL, 'Grade 1', 'Grade 1', 64, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (912, 65, NULL, 'Grade 4', 'Grade 4', 70, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (913, 66, NULL, 'Kinder - angel', 'Kinder - angel', 2, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (914, 67, NULL, 'Kinder - angel', 'Kinder - angel', 1, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (933, 69, 3, 'Kinder - lily', 'Kindergarten', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (934, 69, 7, 'Grade 2 - camia', 'Grade 2', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (935, 69, 18, 'Non-Graded - tulips', 'Non-Graded', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (936, 69, 14, 'Grade 5 - blueberry', 'Grade 5', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (937, 69, 20, 'Grade 4 - sampaguita', 'Grade 4', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (938, 69, 4, 'Kinder - santan', 'Kindergarten', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (939, 69, 5, 'Grade 1 - rosal', 'Grade 1', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (940, 69, 6, 'Grade 1 - rose', 'Grade 1', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (941, 69, 8, 'Grade 2 - daisy', 'Grade 2', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (942, 69, 9, 'Grade 2 - lirio', 'Grade 2', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (943, 69, 10, 'Grade 3 - adelfa', 'Grade 3', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (944, 69, 11, 'Grade 3 - orchids', 'Grade 3', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (945, 69, 12, 'Grade 4 - ilang-ilang', 'Grade 4', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (946, 69, 15, 'Grade 5 - everlasting', 'Grade 5', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (947, 69, 16, 'Grade 6 - cattleya', 'Grade 6', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (948, 69, 17, 'Grade 6 - sunflower', 'Grade 6', 0, NULL);
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (949, 69, 1, 'Kinder - angel', 'Kindergarten', 1, 'Cheryl Dechosa');
INSERT INTO "section_snapshot_items" ("id", "group_id", "section_id", "section_name", "grade_level", "count", "adviser_name") VALUES (950, 69, 2, 'Kinder - dahlia', 'Kindergarten', 0, NULL);

-- Table: section_snapshot_students
DROP TABLE IF EXISTS "section_snapshot_students" CASCADE;
CREATE TABLE "section_snapshot_students" (
    "id" integer DEFAULT nextval('section_snapshot_students_id_seq'::regclass) NOT NULL,
    "group_id" integer,
    "section_id" integer,
    "section_name" text,
    "student_name" text,
    "current_address" text,
    "barangay" text
);

-- Table: section_snapshots
DROP TABLE IF EXISTS "section_snapshots" CASCADE;
CREATE TABLE "section_snapshots" (
    "id" integer DEFAULT nextval('section_snapshots_id_seq'::regclass) NOT NULL,
    "snapshot_name" text NOT NULL,
    "section_id" integer,
    "section_name" text,
    "grade_level" text,
    "count" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (1, '2025-2026', 18, 'Non-Graded - tulips', 'Non-Graded', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (2, '2025-2026', 14, 'Grade 5 - blueberry', 'Grade 5', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (3, '2025-2026', 20, 'Grade 4 - sampaguita', 'Grade 4', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (4, '2025-2026', 1, 'Kinder - angel', 'Kindergarten', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (5, '2025-2026', 4, 'Kinder - santan', 'Kindergarten', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (6, '2025-2026', 5, 'Grade 1 - rosal', 'Grade 1', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (7, '2025-2026', 6, 'Grade 1 - rose', 'Grade 1', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (8, '2025-2026', 7, 'Grade 2 - camia', 'Grade 2', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (9, '2025-2026', 8, 'Grade 2 - daisy', 'Grade 2', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (10, '2025-2026', 9, 'Grade 2 - lirio', 'Grade 2', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (11, '2025-2026', 10, 'Grade 3 - adelfa', 'Grade 3', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (12, '2025-2026', 11, 'Grade 3 - orchids', 'Grade 3', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (13, '2025-2026', 12, 'Grade 4 - ilang-ilang', 'Grade 4', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (14, '2025-2026', 15, 'Grade 5 - everlasting', 'Grade 5', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (15, '2025-2026', 16, 'Grade 6 - cattleya', 'Grade 6', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (16, '2025-2026', 3, 'Kinder - lily', 'Kindergarten', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (17, '2025-2026', 17, 'Grade 6 - sunflower', 'Grade 6', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (18, '2025-2026', 2, 'Kinder - dahlia', 'Kindergarten', 0, '2025-11-22T13:04:50.254Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (19, '2025-2026', 18, 'Non-Graded - tulips', 'Non-Graded', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (20, '2025-2026', 14, 'Grade 5 - blueberry', 'Grade 5', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (21, '2025-2026', 20, 'Grade 4 - sampaguita', 'Grade 4', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (22, '2025-2026', 4, 'Kinder - santan', 'Kindergarten', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (23, '2025-2026', 5, 'Grade 1 - rosal', 'Grade 1', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (24, '2025-2026', 6, 'Grade 1 - rose', 'Grade 1', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (25, '2025-2026', 7, 'Grade 2 - camia', 'Grade 2', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (26, '2025-2026', 8, 'Grade 2 - daisy', 'Grade 2', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (27, '2025-2026', 9, 'Grade 2 - lirio', 'Grade 2', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (28, '2025-2026', 10, 'Grade 3 - adelfa', 'Grade 3', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (29, '2025-2026', 11, 'Grade 3 - orchids', 'Grade 3', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (30, '2025-2026', 12, 'Grade 4 - ilang-ilang', 'Grade 4', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (31, '2025-2026', 15, 'Grade 5 - everlasting', 'Grade 5', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (32, '2025-2026', 16, 'Grade 6 - cattleya', 'Grade 6', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (33, '2025-2026', 3, 'Kinder - lily', 'Kindergarten', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (34, '2025-2026', 17, 'Grade 6 - sunflower', 'Grade 6', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (35, '2025-2026', 2, 'Kinder - dahlia', 'Kindergarten', 0, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (36, '2025-2026', 1, 'Kinder - angel', 'Kindergarten', 2, '2025-11-22T14:03:06.533Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (37, '2025 - 2026', 18, 'Non-Graded - tulips', 'Non-Graded', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (38, '2025 - 2026', 14, 'Grade 5 - blueberry', 'Grade 5', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (39, '2025 - 2026', 20, 'Grade 4 - sampaguita', 'Grade 4', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (40, '2025 - 2026', 2, 'Kinder - dahlia', 'Kindergarten', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (41, '2025 - 2026', 1, 'Kinder - angel', 'Kindergarten', 1, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (42, '2025 - 2026', 4, 'Kinder - santan', 'Kindergarten', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (43, '2025 - 2026', 5, 'Grade 1 - rosal', 'Grade 1', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (44, '2025 - 2026', 6, 'Grade 1 - rose', 'Grade 1', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (45, '2025 - 2026', 7, 'Grade 2 - camia', 'Grade 2', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (46, '2025 - 2026', 8, 'Grade 2 - daisy', 'Grade 2', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (47, '2025 - 2026', 9, 'Grade 2 - lirio', 'Grade 2', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (48, '2025 - 2026', 10, 'Grade 3 - adelfa', 'Grade 3', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (49, '2025 - 2026', 11, 'Grade 3 - orchids', 'Grade 3', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (50, '2025 - 2026', 12, 'Grade 4 - ilang-ilang', 'Grade 4', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (51, '2025 - 2026', 15, 'Grade 5 - everlasting', 'Grade 5', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (52, '2025 - 2026', 16, 'Grade 6 - cattleya', 'Grade 6', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (53, '2025 - 2026', 17, 'Grade 6 - sunflower', 'Grade 6', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (54, '2025 - 2026', 3, 'Kinder - lily', 'Kindergarten', 0, '2025-11-24T17:21:50.857Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (55, '1990 - 1991', 18, 'Non-Graded - tulips', 'Non-Graded', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (56, '1990 - 1991', 14, 'Grade 5 - blueberry', 'Grade 5', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (57, '1990 - 1991', 20, 'Grade 4 - sampaguita', 'Grade 4', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (58, '1990 - 1991', 2, 'Kinder - dahlia', 'Kindergarten', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (59, '1990 - 1991', 1, 'Kinder - angel', 'Kindergarten', 3, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (60, '1990 - 1991', 4, 'Kinder - santan', 'Kindergarten', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (61, '1990 - 1991', 5, 'Grade 1 - rosal', 'Grade 1', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (62, '1990 - 1991', 6, 'Grade 1 - rose', 'Grade 1', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (63, '1990 - 1991', 7, 'Grade 2 - camia', 'Grade 2', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (64, '1990 - 1991', 8, 'Grade 2 - daisy', 'Grade 2', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (65, '1990 - 1991', 9, 'Grade 2 - lirio', 'Grade 2', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (66, '1990 - 1991', 10, 'Grade 3 - adelfa', 'Grade 3', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (67, '1990 - 1991', 11, 'Grade 3 - orchids', 'Grade 3', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (68, '1990 - 1991', 12, 'Grade 4 - ilang-ilang', 'Grade 4', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (69, '1990 - 1991', 15, 'Grade 5 - everlasting', 'Grade 5', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (70, '1990 - 1991', 16, 'Grade 6 - cattleya', 'Grade 6', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (71, '1990 - 1991', 17, 'Grade 6 - sunflower', 'Grade 6', 0, '2025-11-28T03:20:06.631Z');
INSERT INTO "section_snapshots" ("id", "snapshot_name", "section_id", "section_name", "grade_level", "count", "created_at") VALUES (72, '1990 - 1991', 3, 'Kinder - lily', 'Kindergarten', 0, '2025-11-28T03:20:06.631Z');

-- Table: section_snapshots_json
DROP TABLE IF EXISTS "section_snapshots_json" CASCADE;
CREATE TABLE "section_snapshots_json" (
    "id" integer DEFAULT nextval('section_snapshots_json_id_seq'::regclass) NOT NULL,
    "snapshot_name" text NOT NULL,
    "payload" jsonb,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "section_snapshots_json" ("id", "snapshot_name", "payload", "created_at") VALUES (1, '2025-2026', '{"name":"2025-2026","rows":[{"count":"0","section_id":5,"grade_level":"Grade 1","adviser_name":null,"section_name":"Grade 1 - rosal"},{"count":"0","section_id":6,"grade_level":"Grade 1","adviser_name":null,"section_name":"Grade 1 - rose"},{"count":"0","section_id":7,"grade_level":"Grade 2","adviser_name":null,"section_name":"Grade 2 - camia"},{"count":"0","section_id":8,"grade_level":"Grade 2","adviser_name":null,"section_name":"Grade 2 - daisy"},{"count":"0","section_id":9,"grade_level":"Grade 2","adviser_name":null,"section_name":"Grade 2 - lirio"},{"count":"0","section_id":10,"grade_level":"Grade 3","adviser_name":null,"section_name":"Grade 3 - adelfa"},{"count":"0","section_id":11,"grade_level":"Grade 3","adviser_name":null,"section_name":"Grade 3 - orchids"},{"count":"0","section_id":12,"grade_level":"Grade 4","adviser_name":null,"section_name":"Grade 4 - ilang-ilang"},{"count":"0","section_id":20,"grade_level":"Grade 4","adviser_name":null,"section_name":"Grade 4 - sampaguita"},{"count":"0","section_id":14,"grade_level":"Grade 5","adviser_name":null,"section_name":"Grade 5 - blueberry"},{"count":"0","section_id":15,"grade_level":"Grade 5","adviser_name":null,"section_name":"Grade 5 - everlasting"},{"count":"0","section_id":16,"grade_level":"Grade 6","adviser_name":null,"section_name":"Grade 6 - cattleya"},{"count":"0","section_id":17,"grade_level":"Grade 6","adviser_name":null,"section_name":"Grade 6 - sunflower"},{"count":"2","section_id":1,"grade_level":"Kindergarten","adviser_name":"Cheryl Dechosa Bello","section_name":"Kinder - angel"},{"count":"0","section_id":2,"grade_level":"Kindergarten","adviser_name":null,"section_name":"Kinder - dahlia"},{"count":"0","section_id":3,"grade_level":"Kindergarten","adviser_name":null,"section_name":"Kinder - lily"},{"count":"0","section_id":4,"grade_level":"Kindergarten","adviser_name":null,"section_name":"Kinder - santan"},{"count":"0","section_id":18,"grade_level":"Non-Graded","adviser_name":null,"section_name":"Non-Graded - tulips"}],"totals":{"total_students":2,"total_teachers":1}}', '2025-11-22T13:46:07.558Z');

-- Table: sections
DROP TABLE IF EXISTS "sections" CASCADE;
CREATE TABLE "sections" (
    "id" integer DEFAULT nextval('sections_id_seq'::regclass) NOT NULL,
    "section_name" character varying NOT NULL,
    "grade_level" character varying NOT NULL,
    "max_capacity" integer DEFAULT 40,
    "current_count" integer DEFAULT 0,
    "adviser_name" character varying,
    "room_number" character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "adviser_teacher_id" integer,
    "section_code" character varying,
    "academic_year" character varying,
    "semester" character varying
);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (3, 'Kinder - lily', 'Kindergarten', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.231Z', '2025-10-23T05:44:16.231Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (7, 'Grade 2 - camia', 'Grade 2', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.240Z', '2025-10-23T05:44:16.240Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (18, 'Non-Graded - tulips', 'Non-Graded', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.257Z', '2025-11-19T05:34:34.604Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (14, 'Grade 5 - blueberry', 'Grade 5', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.252Z', '2025-10-31T10:52:51.548Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (20, 'Grade 4 - sampaguita', 'Grade 4', 40, 0, NULL, NULL, true, '2025-10-31T11:03:21.239Z', '2025-10-31T11:03:21.239Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (4, 'Kinder - santan', 'Kindergarten', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.233Z', '2025-10-23T05:44:16.233Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (5, 'Grade 1 - rosal', 'Grade 1', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.235Z', '2025-10-23T05:44:16.235Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (6, 'Grade 1 - rose', 'Grade 1', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.239Z', '2025-10-23T05:44:16.239Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (8, 'Grade 2 - daisy', 'Grade 2', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.243Z', '2025-10-23T05:44:16.243Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (9, 'Grade 2 - lirio', 'Grade 2', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.245Z', '2025-10-23T05:44:16.245Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (10, 'Grade 3 - adelfa', 'Grade 3', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.247Z', '2025-10-23T05:44:16.247Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (11, 'Grade 3 - orchids', 'Grade 3', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.248Z', '2025-10-23T05:44:16.248Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (12, 'Grade 4 - ilang-ilang', 'Grade 4', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.250Z', '2025-10-23T05:44:16.250Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (15, 'Grade 5 - everlasting', 'Grade 5', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.254Z', '2025-10-23T05:44:16.254Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (16, 'Grade 6 - cattleya', 'Grade 6', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.255Z', '2025-10-23T05:44:16.255Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (17, 'Grade 6 - sunflower', 'Grade 6', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.256Z', '2025-11-07T23:30:13.576Z', NULL, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (1, 'Kinder - angel', 'Kindergarten', 40, 1, 'Cheryl Dechosa', '101', true, '2025-10-23T05:44:16.206Z', '2025-12-01T06:46:21.691Z', 8, NULL, NULL, NULL);
INSERT INTO "sections" ("id", "section_name", "grade_level", "max_capacity", "current_count", "adviser_name", "room_number", "is_active", "created_at", "updated_at", "adviser_teacher_id", "section_code", "academic_year", "semester") VALUES (2, 'Kinder - dahlia', 'Kindergarten', 40, 0, NULL, NULL, true, '2025-10-23T05:44:16.229Z', '2025-11-22T11:50:15.608Z', NULL, NULL, NULL, NULL);

-- Table: snapshot_students
DROP TABLE IF EXISTS "snapshot_students" CASCADE;
CREATE TABLE "snapshot_students" (
    "id" integer DEFAULT nextval('snapshot_students_id_seq'::regclass) NOT NULL,
    "group_id" integer,
    "student_name" text NOT NULL,
    "section_level" text,
    "barangay" text,
    "adviser_name" text,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4558, 65, 'Joshua Torres', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4559, 65, 'Ella Santos', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4560, 65, 'John Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4561, 65, 'Miguel Dela Cruz', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4562, 65, 'James Aquino', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4563, 65, 'Joshua Bello', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4564, 65, 'John Dela Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4565, 65, 'Sofia Torres', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4566, 65, 'John Dela Cruz', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4567, 65, 'Julia Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4568, 65, 'Grace Ramos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4569, 65, 'John Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4570, 65, 'James Reyes', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4571, 65, 'Ella Ramos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4572, 65, 'Lara Bello', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4573, 65, 'Grace Santos', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4574, 65, 'Grace Cruz', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4575, 65, 'Ella Aquino', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4576, 65, 'Sofia Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4577, 65, 'Maria Cruz', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4578, 65, 'Miguel Torres', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4579, 65, 'Grace Aquino', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4580, 65, 'Lara Dela Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4581, 65, 'Joshua Dela Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4582, 65, 'Lara Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4583, 65, 'Sofia Garcia', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4584, 65, 'Carlos Villanueva', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4585, 65, 'David Flores', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4586, 65, 'David Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4587, 65, 'John Mendoza', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4588, 65, 'Carlos Ramos', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4589, 65, 'Mark Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4590, 65, 'Joshua Dela Cruz', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4591, 65, 'Grace Garcia', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4592, 65, 'Ana Reyes', 'Grade 7', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4593, 65, 'James Reyes', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4594, 65, 'David Dela Cruz', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4595, 65, 'Mary Dela Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4596, 65, 'Ana Dela Cruz', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4597, 65, 'Joshua Mendoza', 'Grade 9', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4598, 65, 'James Santos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4599, 65, 'James Torres', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4600, 65, 'Carlos Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4601, 65, 'Sofia Garcia', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4602, 65, 'Mary Flores', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4603, 65, 'Ella Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4604, 65, 'Carlos Ramos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4605, 65, 'Ella Garcia', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4606, 65, 'Lara Santos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4607, 65, 'Lara Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4608, 65, 'Maria Garcia', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4609, 65, 'Ella Torres', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4610, 65, 'Ella Mendoza', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4611, 65, 'Ella Bello', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4612, 65, 'Maria Aquino', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4613, 65, 'James Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4614, 65, 'Grace Cruz', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4615, 65, 'James Reyes', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4616, 65, 'Mary Aquino', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4617, 65, 'Grace Villanueva', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4618, 65, 'Maria Santos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4619, 65, 'Carlos Bello', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4620, 65, 'Maria Villanueva', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4621, 65, 'Sofia Garcia', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4622, 65, 'Ella Mendoza', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4623, 65, 'Ella Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4624, 65, 'Mary Reyes', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4625, 65, 'Miguel Villanueva', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4626, 65, 'Mark Villanueva', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4627, 65, 'Ana Dela Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4628, 65, 'Miguel Dela Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4629, 65, 'John Santos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4630, 65, 'Daniel Flores', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4631, 65, 'John Dela Cruz', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4632, 65, 'David Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4633, 65, 'James Aquino', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4634, 65, 'Joshua Dela Cruz', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4635, 65, 'Carlos Garcia', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4636, 65, 'Mary Garcia', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4637, 65, 'Carlos Dela Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4638, 65, 'Joshua Villanueva', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4639, 65, 'Julia Dela Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4640, 65, 'Lara Bello', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4641, 65, 'Ana Reyes', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4642, 65, 'Ella Bello', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4643, 65, 'David Garcia', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4644, 65, 'Grace Ramos', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4645, 65, 'Ana Aquino', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4646, 65, 'Lara Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4647, 65, 'Mary Cruz', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4648, 65, 'Mary Reyes', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4649, 65, 'Mark Flores', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4650, 65, 'Joshua Mendoza', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4651, 65, 'John Ramos', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4652, 65, 'David Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4653, 65, 'David Villanueva', 'Grade 9', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4654, 65, 'Joshua Bello', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4655, 65, 'David Torres', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4656, 65, 'Miguel Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4657, 65, 'Daniel Flores', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4658, 65, 'David Bello', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4659, 65, 'Miguel Reyes', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4660, 65, 'Grace Cruz', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4661, 65, 'Maria Santos', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4662, 65, 'Sofia Torres', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4663, 65, 'Carlos Dela Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4664, 65, 'Ella Aquino', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4665, 65, 'Ella Dela Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4666, 65, 'Miguel Aquino', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4667, 65, 'Miguel Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4668, 65, 'James Santos', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4669, 65, 'John Garcia', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4670, 65, 'Mary Dela Cruz', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4671, 65, 'Daniel Ramos', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4672, 65, 'John Villanueva', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4673, 65, 'Mark Dela Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4674, 65, 'Joshua Reyes', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4675, 65, 'James Santos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4676, 65, 'Lara Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4677, 65, 'Ana Cruz', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4678, 65, 'Mark Aquino', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4679, 65, 'Miguel Garcia', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4680, 65, 'Grace Aquino', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4681, 65, 'Carlos Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4682, 65, 'Miguel Dela Cruz', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4683, 65, 'Daniel Aquino', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4684, 65, 'David Garcia', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4685, 65, 'Daniel Garcia', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4686, 65, 'James Reyes', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4687, 65, 'Grace Reyes', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4688, 65, 'Miguel Villanueva', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4689, 65, 'Grace Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4690, 65, 'Carlos Bello', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4691, 65, 'Miguel Flores', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4692, 65, 'John Ramos', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4693, 65, 'Daniel Bello', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4694, 65, 'Lara Reyes', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4695, 65, 'Mary Flores', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4696, 65, 'Mary Dela Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4697, 65, 'Joshua Aquino', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4698, 65, 'John Reyes', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4699, 65, 'Ella Mendoza', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4700, 65, 'Mark Ramos', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4701, 65, 'Sofia Garcia', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4702, 65, 'David Garcia', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4703, 65, 'Miguel Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4704, 65, 'Miguel Garcia', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4705, 65, 'James Santos', 'Grade 7', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4706, 65, 'Mary Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4707, 65, 'David Garcia', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4708, 65, 'Daniel Dela Cruz', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4709, 65, 'Miguel Reyes', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4710, 65, 'Carlos Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4711, 65, 'Julia Mendoza', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4712, 65, 'Ana Mendoza', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4713, 65, 'Julia Bello', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4714, 65, 'John Bello', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4715, 65, 'Daniel Garcia', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4716, 65, 'Sofia Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4717, 65, 'Daniel Cruz', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4718, 65, 'Carlos Aquino', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4719, 65, 'Ana Santos', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4720, 65, 'Sofia Reyes', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4721, 65, 'David Reyes', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4722, 65, 'Ana Villanueva', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4723, 65, 'Mark Dela Cruz', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4724, 65, 'John Flores', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4725, 65, 'David Villanueva', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4726, 65, 'Ella Dela Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4727, 65, 'Daniel Dela Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4728, 65, 'Grace Ramos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4729, 65, 'Joshua Aquino', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4730, 65, 'Lara Aquino', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4731, 65, 'Maria Mendoza', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4732, 65, 'Ana Aquino', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4733, 65, 'Grace Bello', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4734, 65, 'Carlos Flores', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4735, 65, 'Miguel Torres', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4736, 65, 'Miguel Reyes', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4737, 65, 'Mary Villanueva', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4738, 65, 'Grace Aquino', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4739, 65, 'Joshua Flores', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4740, 65, 'Sofia Cruz', 'Grade 9', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4741, 65, 'David Aquino', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4742, 65, 'Grace Reyes', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4743, 65, 'James Torres', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4744, 65, 'Carlos Dela Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4745, 65, 'James Bello', 'Grade 7', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4746, 65, 'John Villanueva', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4747, 65, 'James Flores', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4748, 65, 'Joshua Garcia', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4749, 65, 'Mary Aquino', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4750, 65, 'Ana Reyes', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4751, 65, 'Ella Villanueva', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4752, 65, 'Lara Mendoza', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4753, 65, 'Miguel Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4754, 65, 'Daniel Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4755, 65, 'Mary Santos', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4756, 65, 'Ella Reyes', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4757, 65, 'James Mendoza', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4758, 65, 'Mary Mendoza', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4759, 65, 'Grace Santos', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4760, 65, 'Mary Santos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4761, 65, 'Carlos Bello', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4762, 65, 'Maria Bello', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4763, 65, 'Sofia Dela Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4764, 65, 'Mary Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4765, 65, 'Ana Garcia', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4766, 65, 'Carlos Ramos', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4767, 65, 'Maria Santos', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4768, 65, 'Joshua Bello', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4769, 65, 'Lara Dela Cruz', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4770, 65, 'Miguel Reyes', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4771, 65, 'Mary Cruz', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4772, 65, 'Daniel Aquino', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4773, 65, 'Miguel Ramos', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4774, 65, 'Carlos Torres', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4775, 65, 'David Dela Cruz', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4776, 65, 'Ana Santos', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4777, 65, 'Carlos Santos', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4778, 65, 'Julia Reyes', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4779, 65, 'Lara Cruz', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4780, 65, 'Miguel Villanueva', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4781, 65, 'Grace Torres', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4782, 65, 'Ana Bello', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4783, 65, 'Julia Torres', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4784, 65, 'Carlos Reyes', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4785, 65, 'Ana Santos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4786, 65, 'Joshua Flores', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4787, 65, 'Grace Flores', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4788, 65, 'Ella Santos', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4789, 65, 'James Reyes', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4790, 65, 'Joshua Reyes', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4791, 65, 'Julia Reyes', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4792, 65, 'Maria Garcia', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4793, 65, 'Mark Flores', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4794, 65, 'Julia Aquino', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4795, 65, 'Mark Flores', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4796, 65, 'Sofia Reyes', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4797, 65, 'Sofia Aquino', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4798, 65, 'Maria Garcia', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4799, 65, 'Carlos Torres', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4800, 65, 'Carlos Dela Cruz', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4801, 65, 'Daniel Santos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4802, 65, 'Joshua Bello', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4803, 65, 'Daniel Bello', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4804, 65, 'Joshua Ramos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4805, 65, 'David Flores', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4806, 65, 'Sofia Reyes', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4807, 65, 'Grace Aquino', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4808, 65, 'Daniel Reyes', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4809, 65, 'Ella Aquino', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4810, 65, 'Daniel Santos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4811, 65, 'Maria Mendoza', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4812, 65, 'David Reyes', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4813, 65, 'David Reyes', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4814, 65, 'Ella Reyes', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4815, 65, 'Mary Dela Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4816, 65, 'Carlos Dela Cruz', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4817, 65, 'John Flores', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4818, 65, 'Mark Flores', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4819, 65, 'Ella Aquino', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4820, 65, 'Julia Villanueva', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4821, 65, 'Maria Bello', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4822, 65, 'Maria Flores', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4823, 65, 'Ana Bello', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4824, 65, 'Joshua Aquino', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4825, 65, 'Ella Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4826, 65, 'Grace Santos', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4827, 65, 'Miguel Flores', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4828, 65, 'Lara Flores', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4829, 65, 'John Dela Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4830, 65, 'Daniel Reyes', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4831, 65, 'James Santos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4832, 65, 'Mary Santos', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4833, 65, 'John Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4834, 65, 'Julia Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4835, 65, 'Sofia Flores', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4836, 65, 'Maria Dela Cruz', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4837, 65, 'Ana Ramos', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4838, 65, 'Joshua Santos', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4839, 65, 'Lara Santos', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4840, 65, 'Mary Garcia', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4841, 65, 'Carlos Cruz', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4842, 65, 'Grace Flores', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4843, 65, 'Lara Flores', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4844, 65, 'Miguel Dela Cruz', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4845, 65, 'Mark Reyes', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4846, 65, 'Joshua Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4847, 65, 'Mark Dela Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4848, 65, 'Julia Ramos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4849, 65, 'Joshua Torres', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4850, 65, 'Mark Garcia', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4851, 65, 'Maria Mendoza', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4852, 65, 'Mary Torres', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4853, 65, 'Ella Aquino', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4854, 65, 'Ana Bello', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4855, 65, 'James Ramos', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4856, 65, 'Lara Garcia', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4857, 65, 'John Bello', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4858, 65, 'Grace Aquino', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4859, 65, 'Miguel Garcia', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4860, 65, 'Carlos Reyes', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4861, 65, 'John Garcia', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4862, 65, 'John Villanueva', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4863, 65, 'Maria Dela Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4864, 65, 'Grace Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4865, 65, 'Sofia Aquino', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4866, 65, 'Miguel Reyes', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4867, 65, 'John Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4868, 65, 'Miguel Aquino', 'Grade 7', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4869, 65, 'Mark Bello', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4870, 65, 'Miguel Reyes', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4871, 65, 'Mark Torres', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4872, 65, 'Daniel Bello', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4873, 65, 'Grace Flores', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4874, 65, 'Maria Torres', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4875, 65, 'Joshua Dela Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4876, 65, 'James Aquino', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4877, 65, 'Joshua Santos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4878, 65, 'Carlos Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4879, 65, 'Ella Dela Cruz', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4880, 65, 'Miguel Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4881, 65, 'Daniel Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4882, 65, 'Miguel Bello', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4883, 65, 'Carlos Santos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4884, 65, 'Ella Aquino', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4885, 65, 'Mark Bello', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4886, 65, 'Carlos Torres', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4887, 65, 'Maria Santos', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4888, 65, 'Joshua Garcia', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4889, 65, 'Julia Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4890, 65, 'Mark Garcia', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4891, 65, 'David Torres', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4892, 65, 'Maria Dela Cruz', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4893, 65, 'James Flores', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4894, 65, 'Joshua Flores', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4895, 65, 'Mary Villanueva', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4896, 65, 'Joshua Flores', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4897, 65, 'Miguel Villanueva', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4898, 65, 'Joshua Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4899, 65, 'Julia Garcia', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4900, 65, 'Sofia Torres', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4901, 65, 'Maria Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4902, 65, 'Carlos Mendoza', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4903, 65, 'Ella Bello', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4904, 65, 'Mark Flores', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4905, 65, 'David Dela Cruz', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4906, 65, 'Joshua Santos', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4907, 65, 'Miguel Flores', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4908, 65, 'Mary Flores', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4909, 65, 'Grace Aquino', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4910, 65, 'Ana Santos', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4911, 65, 'Maria Santos', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4912, 65, 'Ana Villanueva', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4913, 65, 'John Reyes', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4914, 65, 'Ella Reyes', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4915, 65, 'Carlos Villanueva', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4916, 65, 'Carlos Bello', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4917, 65, 'Ella Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4918, 65, 'James Ramos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4919, 65, 'Ana Flores', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4920, 65, 'Mark Torres', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4921, 65, 'Ana Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4922, 65, 'Mark Bello', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4923, 65, 'Sofia Garcia', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4924, 65, 'Maria Mendoza', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4925, 65, 'Grace Santos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4926, 65, 'Julia Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4927, 65, 'Lara Santos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4928, 65, 'John Mendoza', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4929, 65, 'Ana Ramos', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4930, 65, 'David Cruz', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4931, 65, 'John Mendoza', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4932, 65, 'Ella Garcia', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4933, 65, 'Mark Bello', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4934, 65, 'Julia Bello', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4935, 65, 'Carlos Cruz', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4936, 65, 'Miguel Garcia', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4937, 65, 'Carlos Garcia', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4938, 65, 'David Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4939, 65, 'Sofia Torres', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4940, 65, 'Grace Reyes', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4941, 65, 'Grace Dela Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4942, 65, 'Mary Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4943, 65, 'Ella Bello', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4944, 65, 'Mary Reyes', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4945, 65, 'Grace Dela Cruz', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4946, 65, 'David Cruz', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4947, 65, 'Miguel Torres', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4948, 65, 'Daniel Villanueva', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4949, 65, 'Julia Ramos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4950, 65, 'Carlos Villanueva', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4951, 65, 'Miguel Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4952, 65, 'James Santos', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4953, 65, 'Ella Aquino', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4954, 65, 'Daniel Bello', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4955, 65, 'Ana Flores', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4956, 65, 'James Aquino', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4957, 65, 'Ella Ramos', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4958, 65, 'Daniel Aquino', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4959, 65, 'Ella Santos', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4960, 65, 'Maria Flores', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4961, 65, 'Ella Flores', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4962, 65, 'Maria Mendoza', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4963, 65, 'David Flores', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4964, 65, 'James Garcia', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4965, 65, 'Daniel Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4966, 65, 'Carlos Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4967, 65, 'Mark Aquino', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4968, 65, 'Grace Santos', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4969, 65, 'Joshua Aquino', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4970, 65, 'John Dela Cruz', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4971, 65, 'Joshua Villanueva', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4972, 65, 'Carlos Bello', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4973, 65, 'Mary Torres', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4974, 65, 'Miguel Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4975, 65, 'Maria Dela Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4976, 65, 'David Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4977, 65, 'James Flores', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4978, 65, 'Daniel Reyes', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4979, 65, 'Sofia Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4980, 65, 'David Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4981, 65, 'David Bello', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4982, 65, 'Lara Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4983, 65, 'Sofia Bello', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4984, 65, 'Lara Aquino', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4985, 65, 'Julia Bello', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4986, 65, 'Lara Mendoza', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4987, 65, 'Mark Garcia', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4988, 65, 'Daniel Ramos', 'Grade 7', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4989, 65, 'Daniel Bello', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4990, 65, 'Grace Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4991, 65, 'Ella Ramos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4992, 65, 'Grace Aquino', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4993, 65, 'Grace Reyes', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4994, 65, 'Julia Bello', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4995, 65, 'Ana Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4996, 65, 'Ana Santos', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4997, 65, 'David Ramos', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4998, 65, 'Carlos Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (4999, 65, 'Joshua Reyes', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5000, 65, 'Mary Villanueva', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5001, 65, 'John Aquino', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5002, 65, 'Ella Mendoza', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5003, 65, 'Ella Torres', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5004, 65, 'Carlos Garcia', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5005, 65, 'Ana Reyes', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5006, 65, 'Daniel Mendoza', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5007, 65, 'Mary Bello', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5008, 65, 'Ana Flores', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5009, 65, 'Carlos Aquino', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5010, 65, 'Mark Aquino', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5011, 65, 'Ella Reyes', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5012, 65, 'David Torres', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5013, 65, 'Ana Santos', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5014, 65, 'Grace Bello', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5015, 65, 'Ana Dela Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5016, 65, 'Ella Dela Cruz', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5017, 65, 'John Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5018, 65, 'Lara Torres', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5019, 65, 'Joshua Reyes', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5020, 65, 'Mark Santos', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5021, 65, 'Miguel Flores', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5022, 65, 'Miguel Cruz', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5023, 65, 'David Santos', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5024, 65, 'Joshua Torres', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5025, 65, 'Joshua Villanueva', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5026, 65, 'Carlos Villanueva', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5027, 65, 'Miguel Flores', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5028, 65, 'Daniel Reyes', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5029, 65, 'Ana Mendoza', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5030, 65, 'Mary Cruz', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5031, 65, 'Joshua Mendoza', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5032, 65, 'David Aquino', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5033, 65, 'Sofia Villanueva', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5034, 65, 'Carlos Villanueva', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5035, 65, 'James Mendoza', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5036, 65, 'Maria Cruz', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5037, 65, 'Joshua Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5038, 65, 'Daniel Bello', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5039, 65, 'Ella Dela Cruz', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5040, 65, 'Miguel Santos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5041, 65, 'Daniel Cruz', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5042, 65, 'Daniel Flores', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5043, 65, 'Grace Ramos', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5044, 65, 'Ella Villanueva', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5045, 65, 'Ella Garcia', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5046, 65, 'Lara Villanueva', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5047, 65, 'Carlos Santos', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5048, 65, 'Lara Garcia', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5049, 65, 'Mary Aquino', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5050, 65, 'Sofia Villanueva', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5051, 65, 'Ana Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5052, 65, 'Lara Villanueva', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5053, 65, 'Joshua Bello', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5054, 65, 'Mark Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5055, 65, 'Grace Santos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5056, 65, 'Mary Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5057, 65, 'Ana Santos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5058, 65, 'Maria Flores', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5059, 65, 'Miguel Flores', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5060, 65, 'David Garcia', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5061, 65, 'David Reyes', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5062, 65, 'Daniel Dela Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5063, 65, 'Maria Torres', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5064, 65, 'Daniel Dela Cruz', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5065, 65, 'James Garcia', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5066, 65, 'Ella Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5067, 65, 'Ana Villanueva', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5068, 65, 'Lara Ramos', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5069, 65, 'Mary Flores', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5070, 65, 'Mary Garcia', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5071, 65, 'Ella Aquino', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5072, 65, 'Ella Reyes', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5073, 65, 'Julia Torres', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5074, 65, 'James Ramos', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5075, 65, 'Daniel Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5076, 65, 'Ana Aquino', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5077, 65, 'David Bello', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5078, 65, 'Julia Garcia', 'Kinder', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5079, 65, 'John Aquino', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5080, 65, 'Ana Villanueva', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5081, 65, 'John Torres', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5082, 65, 'Joshua Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5083, 65, 'Ella Garcia', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5084, 65, 'Ana Santos', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5085, 65, 'Sofia Reyes', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5086, 65, 'David Cruz', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5087, 65, 'John Bello', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5088, 65, 'Sofia Flores', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5089, 65, 'Miguel Villanueva', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5090, 65, 'James Aquino', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5091, 65, 'Miguel Ramos', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5092, 65, 'Miguel Reyes', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5093, 65, 'Ana Aquino', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5094, 65, 'James Cruz', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5095, 65, 'Sofia Mendoza', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5096, 65, 'Lara Dela Cruz', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5097, 65, 'Grace Flores', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5098, 65, 'Daniel Cruz', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5099, 65, 'Grace Dela Cruz', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5100, 65, 'David Aquino', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5101, 65, 'David Aquino', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5102, 65, 'James Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5103, 65, 'Joshua Cruz', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5104, 65, 'Maria Garcia', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5105, 65, 'Grace Villanueva', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5106, 65, 'Sofia Villanueva', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5107, 65, 'Sofia Bello', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5108, 65, 'Grace Cruz', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5109, 65, 'Ella Ramos', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5110, 65, 'Grace Flores', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5111, 65, 'Ella Santos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5112, 65, 'David Reyes', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5113, 65, 'James Villanueva', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5114, 65, 'Miguel Flores', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5115, 65, 'David Ramos', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5116, 65, 'David Dela Cruz', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5117, 65, 'Julia Ramos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5118, 65, 'Mark Bello', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5119, 65, 'Lara Dela Cruz', 'Grade 2', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5120, 65, 'Carlos Reyes', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5121, 65, 'Grace Mendoza', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5122, 65, 'Daniel Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5123, 65, 'David Garcia', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5124, 65, 'Joshua Aquino', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5125, 65, 'Sofia Aquino', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5126, 65, 'John Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5127, 65, 'Mark Garcia', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5128, 65, 'Grace Flores', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5129, 65, 'Ella Ramos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5130, 65, 'Maria Villanueva', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5131, 65, 'Julia Dela Cruz', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5132, 65, 'Maria Flores', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5133, 65, 'Miguel Torres', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5134, 65, 'Miguel Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5135, 65, 'Carlos Mendoza', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5136, 65, 'James Santos', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5137, 65, 'Miguel Reyes', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5138, 65, 'Mary Dela Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5139, 65, 'Sofia Santos', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5140, 65, 'Carlos Cruz', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5141, 65, 'Ana Dela Cruz', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5142, 65, 'Julia Aquino', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5143, 65, 'Ana Bello', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5144, 65, 'Ella Bello', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5145, 65, 'Lara Bello', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5146, 65, 'Carlos Bello', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5147, 65, 'Lara Ramos', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5148, 65, 'Grace Ramos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5149, 65, 'Mary Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5150, 65, 'Ana Villanueva', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5151, 65, 'John Torres', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5152, 65, 'Mark Aquino', 'Grade 6', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5153, 65, 'James Flores', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5154, 65, 'Julia Ramos', 'Grade 8', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5155, 65, 'Julia Santos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5156, 65, 'Grace Ramos', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5157, 65, 'Lara Santos', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5158, 65, 'Ella Torres', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5159, 65, 'David Santos', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5160, 65, 'Maria Villanueva', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5161, 65, 'Ana Mendoza', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5162, 65, 'Joshua Cruz', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5163, 65, 'Ana Villanueva', 'Grade 9', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5164, 65, 'Sofia Garcia', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5165, 65, 'Daniel Santos', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5166, 65, 'Mary Bello', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5167, 65, 'Julia Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5168, 65, 'John Cruz', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5169, 65, 'Mary Villanueva', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5170, 65, 'Joshua Villanueva', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5171, 65, 'David Mendoza', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5172, 65, 'Joshua Reyes', 'Grade 9', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5173, 65, 'Julia Dela Cruz', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5174, 65, 'Sofia Aquino', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5175, 65, 'Ana Villanueva', 'Kinder', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5176, 65, 'Mark Torres', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5177, 65, 'Miguel Torres', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5178, 65, 'Lara Flores', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5179, 65, 'Mark Cruz', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5180, 65, 'Julia Villanueva', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5181, 65, 'Miguel Dela Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5182, 65, 'David Santos', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5183, 65, 'Julia Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5184, 65, 'Julia Reyes', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5185, 65, 'Miguel Bello', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5186, 65, 'James Flores', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5187, 65, 'Sofia Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5188, 65, 'Grace Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5189, 65, 'Maria Torres', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5190, 65, 'Grace Torres', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5191, 65, 'James Ramos', 'Grade 6', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5192, 65, 'Maria Santos', 'Grade 3', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5193, 65, 'Joshua Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5194, 65, 'Miguel Bello', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5195, 65, 'John Aquino', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5196, 65, 'Grace Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5197, 65, 'Joshua Garcia', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5198, 65, 'James Villanueva', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5199, 65, 'Joshua Garcia', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5200, 65, 'Ana Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5201, 65, 'Mary Reyes', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5202, 65, 'Julia Bello', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5203, 65, 'Ana Flores', 'Grade 5', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5204, 65, 'John Garcia', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5205, 65, 'Sofia Santos', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5206, 65, 'Lara Mendoza', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5207, 65, 'John Bello', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5208, 65, 'James Ramos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5209, 65, 'Maria Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5210, 65, 'Ana Ramos', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5211, 65, 'Daniel Torres', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5212, 65, 'Sofia Flores', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5213, 65, 'Joshua Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5214, 65, 'John Cruz', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5215, 65, 'Miguel Santos', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5216, 65, 'Mark Villanueva', 'Grade 9', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5217, 65, 'Ella Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5218, 65, 'Maria Torres', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5219, 65, 'Daniel Dela Cruz', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5220, 65, 'Sofia Villanueva', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5221, 65, 'Ella Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5222, 65, 'Ana Villanueva', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5223, 65, 'Carlos Flores', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5224, 65, 'Mary Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5225, 65, 'David Ramos', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5226, 65, 'John Bello', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5227, 65, 'Daniel Garcia', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5228, 65, 'Joshua Flores', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5229, 65, 'Mark Cruz', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5230, 65, 'John Torres', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5231, 65, 'James Villanueva', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5232, 65, 'Lara Bello', 'Grade 1', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5233, 65, 'James Cruz', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5234, 65, 'Grace Ramos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5235, 65, 'Ella Mendoza', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5236, 65, 'Miguel Santos', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5237, 65, 'Ana Mendoza', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5238, 65, 'Maria Aquino', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5239, 65, 'Daniel Torres', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5240, 65, 'Maria Bello', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5241, 65, 'Mark Mendoza', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5242, 65, 'Joshua Reyes', 'Kinder', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5243, 65, 'Ella Aquino', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5244, 65, 'Joshua Santos', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5245, 65, 'Sofia Aquino', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5246, 65, 'Carlos Aquino', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5247, 65, 'Carlos Santos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5248, 65, 'Lara Cruz', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5249, 65, 'Mary Mendoza', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5250, 65, 'Carlos Garcia', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5251, 65, 'Ella Garcia', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5252, 65, 'Ana Garcia', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5253, 65, 'John Torres', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5254, 65, 'Carlos Torres', 'Grade 7', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5255, 65, 'Daniel Bello', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5256, 65, 'Lara Mendoza', 'Grade 4', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5257, 65, 'Miguel Ramos', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5258, 65, 'Joshua Mendoza', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5259, 65, 'Ella Bello', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5260, 65, 'James Ramos', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5261, 65, 'Joshua Aquino', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5262, 65, 'Mark Garcia', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5263, 65, 'Mark Mendoza', 'Grade 8', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5264, 65, 'Grace Bello', 'Grade 1', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5265, 65, 'John Reyes', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5266, 65, 'Joshua Aquino', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5267, 65, 'Miguel Bello', 'Grade 2', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5268, 65, 'Joshua Ramos', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5269, 65, 'Mark Villanueva', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5270, 65, 'Joshua Torres', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5271, 65, 'David Cruz', 'Grade 6', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5272, 65, 'Lara Dela Cruz', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5273, 65, 'Ana Flores', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5274, 65, 'Sofia Santos', 'Grade 4', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5275, 65, 'Mary Ramos', 'Grade 2', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5276, 65, 'Daniel Santos', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5277, 65, 'Carlos Santos', 'Grade 5', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5278, 65, 'Carlos Dela Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5279, 65, 'Grace Torres', 'Grade 7', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5280, 65, 'Maria Ramos', 'Kinder', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5281, 65, 'Ella Cruz', 'Grade 4', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5282, 65, 'Grace Torres', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5283, 65, 'Daniel Reyes', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5284, 65, 'Daniel Bello', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5285, 65, 'John Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5286, 65, 'Ella Dela Cruz', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5287, 65, 'Lara Reyes', 'Non-Grade', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5288, 65, 'John Flores', 'Grade 3', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5289, 65, 'Lara Garcia', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5290, 65, 'David Mendoza', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5291, 65, 'James Villanueva', 'Grade 8', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5292, 65, 'James Flores', 'Grade 9', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5293, 65, 'David Bello', 'Grade 2', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5294, 65, 'Joshua Torres', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5295, 65, 'Grace Flores', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5296, 65, 'Sofia Reyes', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5297, 65, 'Joshua Garcia', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5298, 65, 'Lara Villanueva', 'Non-Grade', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5299, 65, 'Joshua Villanueva', 'Grade 3', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5300, 65, 'John Bello', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5301, 65, 'Ana Villanueva', 'Grade 1', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5302, 65, 'Grace Garcia', 'Non-Grade', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5303, 65, 'Mary Torres', 'Grade 1', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5304, 65, 'Daniel Flores', 'Grade 5', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5305, 65, 'Ella Flores', 'Non-Grade', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5306, 65, 'Ana Santos', 'Grade 4', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5307, 65, 'Sofia Cruz', 'Grade 7', 'San Francisco', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5308, 65, 'Lara Garcia', 'Grade 5', 'Calamias', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5309, 65, 'Lara Reyes', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5310, 65, 'Mark Dela Cruz', 'Grade 8', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5311, 65, 'Sofia Garcia', 'Grade 3', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5312, 65, 'Mary Aquino', 'Grade 6', 'Others', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5313, 65, 'James Santos', 'Grade 9', 'Mainaga', NULL, '2025-11-29T10:56:29.761Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5314, 66, 'Skirk, Cryo Fontaine ', 'Kinder - angel', 'San Francisco', 'Cheryl Dechosa', '2025-11-29T11:16:08.312Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5315, 66, 'qqqqq, qqqq qqqqq ', 'Kinder - angel', 'San Francisco', 'Cheryl Dechosa', '2025-11-29T11:16:08.312Z');
INSERT INTO "snapshot_students" ("id", "group_id", "student_name", "section_level", "barangay", "adviser_name", "created_at") VALUES (5316, 67, 'Skirk, Cryo Fontaine ', 'Kinder - angel', 'San Francisco', 'Cheryl Dechosa', '2025-11-30T10:14:55.045Z');

-- Table: student_behavior_reports
DROP TABLE IF EXISTS "student_behavior_reports" CASCADE;
CREATE TABLE "student_behavior_reports" (
    "id" integer DEFAULT nextval('student_behavior_reports_id_seq'::regclass) NOT NULL,
    "student_id" integer NOT NULL,
    "section_id" integer,
    "teacher_id" integer,
    "report_date" date DEFAULT CURRENT_DATE,
    "category" character varying NOT NULL,
    "severity" character varying NOT NULL,
    "notes" text,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: student_behavior_reports_archive
DROP TABLE IF EXISTS "student_behavior_reports_archive" CASCADE;
CREATE TABLE "student_behavior_reports_archive" (
    "id" integer DEFAULT nextval('student_behavior_reports_archive_id_seq'::regclass) NOT NULL,
    "original_id" integer,
    "student_id" integer,
    "section_id" integer,
    "teacher_id" integer,
    "report_date" date,
    "category" character varying,
    "severity" character varying,
    "notes" text,
    "archived_by" integer,
    "archived_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: students
DROP TABLE IF EXISTS "students" CASCADE;
CREATE TABLE "students" (
    "id" integer DEFAULT nextval('students_id_seq'::regclass) NOT NULL,
    "enrollment_id" integer,
    "section_id" integer,
    "lrn" character varying,
    "student_id" character varying,
    "last_name" character varying NOT NULL,
    "first_name" character varying NOT NULL,
    "middle_name" character varying,
    "ext_name" character varying,
    "birthday" date NOT NULL,
    "age" integer NOT NULL,
    "sex" character varying NOT NULL,
    "religion" character varying,
    "gmail_address" character varying,
    "contact_number" character varying,
    "current_address" text NOT NULL,
    "ip_community" character varying NOT NULL,
    "ip_community_specify" character varying,
    "pwd" character varying NOT NULL,
    "pwd_specify" character varying,
    "father_name" character varying,
    "mother_name" character varying,
    "guardian_name" character varying,
    "school_year" character varying NOT NULL,
    "grade_level" character varying NOT NULL,
    "enrollment_date" date DEFAULT CURRENT_DATE,
    "enrollment_status" character varying DEFAULT 'active'::character varying,
    "printed_name" character varying,
    "signature_image_path" character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_archived" boolean DEFAULT false,
    "barangay" character varying,
    "is_deleted" boolean DEFAULT false,
    "managed_by" character varying DEFAULT 'registrar'::character varying,
    "deleted_at" timestamp without time zone,
    "deleted_by" character varying,
    "has_been_assigned" boolean DEFAULT false,
    "date_of_birth" date,
    "gender" character varying,
    "city" character varying,
    "province" character varying,
    "guardian_contact" character varying,
    "is_active" boolean DEFAULT true
);
INSERT INTO "students" ("id", "enrollment_id", "section_id", "lrn", "student_id", "last_name", "first_name", "middle_name", "ext_name", "birthday", "age", "sex", "religion", "gmail_address", "contact_number", "current_address", "ip_community", "ip_community_specify", "pwd", "pwd_specify", "father_name", "mother_name", "guardian_name", "school_year", "grade_level", "enrollment_date", "enrollment_status", "printed_name", "signature_image_path", "created_at", "updated_at", "is_archived", "barangay", "is_deleted", "managed_by", "deleted_at", "deleted_by", "has_been_assigned", "date_of_birth", "gender", "city", "province", "guardian_contact", "is_active") VALUES (30, 31, 1, '4444444', NULL, '22', '22', '22', NULL, '2025-11-30T16:00:00.000Z', 1, 'Male', '22', 'jamezbello93@gmail.com', '09433452476', 'Mainaga', 'No', NULL, 'No', NULL, '22', '22', '222', '2025 - 2026', 'Grade 5', '2025-11-30T16:00:00.000Z', 'active', NULL, NULL, '2025-12-01T06:28:38.469Z', '2025-12-01T06:28:38.469Z', false, NULL, false, 'registrar', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, true);

-- Table: students_archive
DROP TABLE IF EXISTS "students_archive" CASCADE;
CREATE TABLE "students_archive" (
    "id" integer DEFAULT nextval('students_archive_id_seq'::regclass) NOT NULL,
    "original_id" integer,
    "enrollment_id" integer,
    "section_id" integer,
    "gmail_address" character varying,
    "school_year" character varying,
    "lrn" character varying,
    "grade_level" character varying,
    "first_name" character varying,
    "middle_name" character varying,
    "last_name" character varying,
    "ext_name" character varying,
    "birthday" date,
    "age" integer,
    "sex" character varying,
    "religion" character varying,
    "current_address" text,
    "ip_community" character varying,
    "ip_community_specify" character varying,
    "pwd" character varying,
    "pwd_specify" character varying,
    "father_name" character varying,
    "mother_name" character varying,
    "guardian_name" character varying,
    "contact_number" character varying,
    "enrollment_date" timestamp without time zone,
    "enrollment_status" character varying,
    "is_archived" boolean DEFAULT true,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "archived_by" integer,
    "archived_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: submission_logs
DROP TABLE IF EXISTS "submission_logs" CASCADE;
CREATE TABLE "submission_logs" (
    "id" integer DEFAULT nextval('submission_logs_id_seq'::regclass) NOT NULL,
    "submission_type" character varying NOT NULL,
    "ip_address" character varying NOT NULL,
    "user_agent" text,
    "email" character varying,
    "lrn" character varying,
    "form_data" jsonb,
    "status" character varying NOT NULL,
    "error_message" text,
    "request_token" character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (18, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'Johnrenzo11@gmail.com', NULL, '{"lrn":"","gmail":"Johnrenzo11@gmail.com","lastName":"Macalin","givenName":"Renzo","gradeLevel":"Grade 2"}', 'success', NULL, 'FNRR-NAND-SWEJ', '2025-11-20T00:40:27.085Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (19, 'document_request', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'Kerocarl111@gmail.com', NULL, '{"email":"Kerocarl111@gmail.com","studentName":"Kero, carl miro","documentType":"Certificate of Enrollment"}', 'success', NULL, '5NZE-LL2K-CZFK', '2025-11-20T05:12:43.447Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (20, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'asa@gmail.com', '111111111111', '{"lrn":"111111111111","gmail":"asa@gmail.com","lastName":"1","givenName":"1","gradeLevel":"Grade 1"}', 'success', NULL, 'S5QY-3265-B43N', '2025-11-24T14:30:14.368Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (21, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'jamezbello93@gmail.com', NULL, '{"lrn":"","gmail":"jamezbello93@gmail.com","lastName":"ndks","givenName":"mxkskis","gradeLevel":"Grade 7"}', 'success', NULL, 'Y9T2-WGZJ-P6PX', '2025-11-26T06:42:18.181Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (22, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'flwafwa@gmail.com', '222222222222', '{"lrn":"222222222222","gmail":"flwafwa@gmail.com","lastName":"dowia","givenName":"ljdhwaf","gradeLevel":"Grade 3"}', 'success', NULL, 'X3A2-2BYH-T3PW', '2025-11-26T12:07:06.754Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (23, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'jamezbello93@gmail.com', '222222222222', '{"lrn":"222222222222","gmail":"jamezbello93@gmail.com","lastName":"clksa","givenName":"csafcaw","gradeLevel":"Grade 4"}', 'success', NULL, 'TAM8-8YKK-ANG3', '2025-11-27T05:22:18.398Z');
INSERT INTO "submission_logs" ("id", "submission_type", "ip_address", "user_agent", "email", "lrn", "form_data", "status", "error_message", "request_token", "created_at") VALUES (24, 'enrollment', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36', 'jamezbello93@gmail.com', '333333333333', '{"lrn":"333333333333","gmail":"jamezbello93@gmail.com","lastName":"qqqqq","givenName":"qqqq","gradeLevel":"Kinder"}', 'success', NULL, 'B62D-MTVW-XHP7', '2025-11-29T01:08:14.077Z');

-- Table: teacher_sections
DROP TABLE IF EXISTS "teacher_sections" CASCADE;
CREATE TABLE "teacher_sections" (
    "id" integer DEFAULT nextval('teacher_sections_id_seq'::regclass) NOT NULL,
    "teacher_id" integer,
    "section_id" integer,
    "academic_year" character varying,
    "is_current" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: teachers
DROP TABLE IF EXISTS "teachers" CASCADE;
CREATE TABLE "teachers" (
    "id" integer DEFAULT nextval('teachers_id_seq'::regclass) NOT NULL,
    "username" character varying NOT NULL,
    "password" character varying NOT NULL,
    "first_name" character varying NOT NULL,
    "middle_name" character varying,
    "last_name" character varying NOT NULL,
    "ext_name" character varying,
    "email" character varying,
    "contact_number" character varying,
    "birthday" date,
    "sex" character varying,
    "address" text,
    "employee_id" character varying,
    "department" character varying,
    "position" character varying,
    "specialization" character varying,
    "date_hired" date,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_archived" boolean DEFAULT false
);
INSERT INTO "teachers" ("id", "username", "password", "first_name", "middle_name", "last_name", "ext_name", "email", "contact_number", "birthday", "sex", "address", "employee_id", "department", "position", "specialization", "date_hired", "is_active", "created_at", "updated_at", "is_archived") VALUES (8, 'cheryl', '$2b$10$0wAFg7QE6giU3brT1mnIfOHEI0Jy45A6jpRVb/UtmusR4pzlOHF4S', 'Cheryl', NULL, 'Dechosa', NULL, 'cheryl@gmail.com', '09345676554', '2025-11-23T16:00:00.000Z', 'Female', 'Mabini Batangas', NULL, NULL, 'Adviser I', 'Marketing', '2025-11-23T16:00:00.000Z', true, '2025-11-24T11:20:35.707Z', '2025-11-24T11:20:35.707Z', false);

-- Table: teachers_archive
DROP TABLE IF EXISTS "teachers_archive" CASCADE;
CREATE TABLE "teachers_archive" (
    "id" integer DEFAULT nextval('teachers_archive_id_seq'::regclass) NOT NULL,
    "original_id" integer,
    "username" character varying,
    "password" character varying,
    "first_name" character varying,
    "middle_name" character varying,
    "last_name" character varying,
    "ext_name" character varying,
    "email" character varying,
    "contact_number" character varying,
    "birthday" date,
    "sex" character varying,
    "address" text,
    "employee_id" character varying,
    "department" character varying,
    "position" character varying,
    "specialization" character varying,
    "date_hired" date,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone,
    "updated_at" timestamp without time zone,
    "archived_by" integer,
    "archived_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
    "id" integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
    "username" character varying NOT NULL,
    "password" character varying NOT NULL,
    "role" character varying NOT NULL
);
INSERT INTO "users" ("id", "username", "password", "role") VALUES (1, 'admin', '$2b$10$ATQJhzLp.2DOYxoFJDDiJ.T.GYAgX7gGifIfo3qykmYrQP3n.Zrkm', 'admin');
INSERT INTO "users" ("id", "username", "password", "role") VALUES (2, 'ictcoor', '$2b$10$ATQJhzLp.2DOYxoFJDDiJ.T.GYAgX7gGifIfo3qykmYrQP3n.Zrkm', 'ictcoor');

-- Re-enable foreign key checks
SET CONSTRAINTS ALL IMMEDIATE;

-- Export complete
