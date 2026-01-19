const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');
const session = require('express-session'); // 1. Import session
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const dssEngine = require('./dss-engine'); // Import DSS Engine
const PDFDocument = require('pdfkit'); // Import pdfkit for PDF generation
let emailService;
try {
    emailService = require('./email-service'); // Import email service for notifications
} catch (err) {
    console.error('âš ï¸ Failed to load email service:', err.message);
    emailService = null;
}
const compression = require('compression'); // Import compression middleware
const { initializeDatabase } = require('./init-db'); // Import database initialization

const app = express();
const port = 3000;

// ============= PERFORMANCE: CACHE VARIABLES =============
let columnExistsCache = {
    adviser_teacher_id: null,
    checked_at: null
};
const CACHE_TTL = 5 * 60 * 1000; // Cache for 5 minutes

// ============= PRODUCTION: TRUST PROXY FOR CORRECT IP DETECTION =============
// CRITICAL: Enable this when deployed behind Nginx, Apache, or cloud platforms
// This allows Express to correctly read the real client IP from proxy headers
app.set('trust proxy', true);

// ============= PERFORMANCE: RESPONSE COMPRESSION =============
// Compress all responses to reduce bandwidth (text, JSON, HTML)
app.use(compression({
    filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Use compression filter function
        return compression.filter(req, res);
    },
    level: 6 // Balance between speed and compression ratio
}));

// Ensure session and parsers are registered BEFORE any routes so req.session is available everywhere
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax'
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ============= SECURITY ANALYTICS & IP MANAGEMENT ENDPOINTS =============

// Get submission logs (admin only - registrar for enrollment, guidance for document_request)
app.get('/api/analytics/submission-logs', async (req, res) => {
    if (!req.session.user || !['admin', 'guidance', 'registrar'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const {type, status, limit = 100, offset = 0, ip, email, from, to} = req.query;
        let query = 'SELECT * FROM submission_logs WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (type) {
            query += ` AND submission_type = $${paramCount++}`;
            values.push(type);
        }
        if (status) {
            query += ` AND status = $${paramCount++}`;
            values.push(status);
        }
        if (ip) {
            query += ` AND ip_address = $${paramCount++}`;
            values.push(ip);
        }
        if (email) {
            query += ` AND email = $${paramCount++}`;
            values.push(email);
        }

        // Date range filtering (optional)
        if (from) {
            // Expecting 'YYYY-MM-DD' or ISO date string
            try {
                const fromDate = new Date(from);
                if (!isNaN(fromDate)) {
                    query += ` AND created_at >= $${paramCount++}`;
                    values.push(fromDate.toISOString());
                }
            } catch (e) { /* ignore invalid date */ }
        }
        if (to) {
            try {
                const toDate = new Date(to);
                if (!isNaN(toDate)) {
                    // include the entire day by setting to 23:59:59 if input had no time
                    toDate.setHours(23,59,59,999);
                    query += ` AND created_at <= $${paramCount++}`;
                    values.push(toDate.toISOString());
                }
            } catch (e) { /* ignore invalid date */ }
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        values.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, values);
        res.json({ success: true, logs: result.rows });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get analytics stats
app.get('/api/analytics/stats', async (req, res) => {
    if (!req.session.user || !['admin', 'guidance', 'registrar'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const {type} = req.query;
        const typeFilter = type ? `AND submission_type = '${type}'` : '';

        const statsQuery = `
            SELECT 
                submission_type,
                status,
                COUNT(*) as count,
                MAX(created_at) as last_occurrence
            FROM submission_logs
            WHERE created_at > NOW() - INTERVAL '24 hours' ${typeFilter}
            GROUP BY submission_type, status
        `;

        const suspiciousQuery = `
            SELECT 
                ip_address,
                COUNT(*) as attempt_count,
                MAX(created_at) as last_attempt,
                array_agg(DISTINCT status) as statuses
            FROM submission_logs
            WHERE created_at > NOW() - INTERVAL '1 hour' ${typeFilter}
            GROUP BY ip_address
            HAVING COUNT(*) >= 5
            ORDER BY attempt_count DESC
        `;

        const stats = await pool.query(statsQuery);
        const suspicious = await pool.query(suspiciousQuery);

        res.json({ 
            success: true, 
            stats: stats.rows,
            suspicious: suspicious.rows
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get blocked IPs
app.get('/api/security/blocked-ips', async (req, res) => {
    if (!req.session.user || !['admin', 'guidance', 'registrar'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await pool.query(`
            SELECT b.*, g.username as blocked_by_name
            FROM blocked_ips b
            LEFT JOIN guidance_accounts g ON b.blocked_by = g.id
            WHERE b.is_active = true
            ORDER BY b.blocked_at DESC
        `);
        res.json({ success: true, blockedIPs: result.rows });
    } catch (err) {
        console.error('Error fetching blocked IPs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Block an IP
app.post('/api/security/block-ip', async (req, res) => {
    try {
        console.log('='.repeat(50));
        console.log('ðŸ”’ BLOCK IP REQUEST RECEIVED');
        console.log('='.repeat(50));
        console.log('Session exists:', !!req.session);
        console.log('Session user:', JSON.stringify(req.session?.user, null, 2));
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('='.repeat(50));
        
        if (!req.session.user || !['admin', 'guidance', 'registrar'].includes(req.session.user.role)) {
            console.log('âŒ [Block IP] Unauthorized - no session or wrong role');
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const {ipAddress, reason, duration} = req.body;
        console.log('Parsed data:', { ipAddress, reason, duration, userId: req.session.user.id });
        
        if (!ipAddress || !reason) {
            console.log('âŒ [Block IP] Missing required fields');
            return res.status(400).json({ success: false, error: 'IP address and reason required' });
        }

        let expiresAt = null;
        if (duration && duration !== 'permanent') {
            const hours = parseInt(duration);
            expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        }

        const result = await pool.query(`
            INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (ip_address) 
            DO UPDATE SET is_active = true, blocked_by = $3, blocked_at = NOW(), reason = $2, expires_at = $4
            RETURNING *
        `, [ipAddress, reason, req.session.user.id, expiresAt]);

        const blockedByName = req.session.user.username || req.session.user.name || req.session.user.role || 'Admin';
        console.log(`ðŸš« IP ${ipAddress} blocked by ${blockedByName}. Reason: ${reason}`);
        res.json({ success: true, blockedIP: result.rows[0] });
    } catch (err) {
        console.error('='.repeat(50));
        console.error('âŒ ERROR BLOCKING IP');
        console.error('='.repeat(50));
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error detail:', err.detail);
        console.error('Stack:', err.stack);
        console.error('='.repeat(50));
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

// Debug endpoint - check session
app.get('/api/debug/session', (req, res) => {
    res.json({
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        user: req.session?.user || null,
        sessionID: req.sessionID
    });
});

// Unblock an IP
app.post('/api/security/unblock-ip', async (req, res) => {
    if (!req.session.user || !['admin', 'guidance', 'registrar'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const {ipAddress} = req.body;
        if (!ipAddress) {
            return res.status(400).json({ success: false, error: 'IP address required' });
        }

        const result = await pool.query(`
            UPDATE blocked_ips
            SET is_active = false, unblocked_by = $1, unblocked_at = NOW()
            WHERE ip_address = $2
            RETURNING *
        `, [req.session.user.id, ipAddress]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'IP not found in blocked list' });
        }

        const unblockedByName = req.session.user.username || req.session.user.name || req.session.user.role || 'Admin';
        console.log(`âœ… IP ${ipAddress} unblocked by ${unblockedByName}`);
        res.json({ success: true, unblocked: result.rows[0] });
    } catch (err) {
        console.error('âŒ Error unblocking IP:', err);
        console.error('Error details:', { message: err.message, code: err.code, detail: err.detail });
        res.status(500).json({ success: false, error: err.message });
    }
});


// ============= SECURITY: RATE LIMITING =============
// Limit enrollment submissions to 3 per hour per IP
const enrollmentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: { 
        success: false, 
        message: 'Too many enrollment requests from this IP. Please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
});

// Limit document request submissions to 3 per hour per IP
const documentRequestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { 
        success: false, 
        message: 'Too many document requests from this IP. Please try again later.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
});

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { 
        success: false, 
        message: 'Too many requests. Please slow down.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
});

// (moved) session + parsers are now registered at the very top

// Helper: require logged-in teacher
function requireTeacher(req, res, next) {
    console.log('requireTeacher - Session ID:', req.sessionID);
    console.log('requireTeacher - Session user:', req.session.user);
    if (!req.session.user || req.session.user.role !== 'teacher') {
        console.log('requireTeacher - UNAUTHORIZED: No session or wrong role');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    console.log('requireTeacher - AUTHORIZED');
    next();
}

// Configure multer for file uploads (signatures)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'signatures');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ======================== TEACHER-SCOPED ENDPOINTS ========================
// Current teacher profile
app.get('/api/teacher/me', requireTeacher, async (req, res) => {
    try {
        const t = await pool.query(
            'SELECT id, username, first_name, middle_name, last_name, email, phone as contact_number FROM teachers WHERE id = $1',
            [req.session.user.id]
        );
        if (t.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, teacher: t.rows[0] });
    } catch (err) {
        console.error('teacher/me error:', err);
        res.status(500).json({ success: false, error: 'Failed to load profile' });
    }
});

// Sections assigned to teacher
app.get('/api/teacher/sections', requireTeacher, async (req, res) => {
    try {
        console.log('Teacher requesting sections - ID:', req.session.user.id, 'Name:', req.session.user.name);
        let result;
        
        // Use cached column check instead of querying on every request
        const hasAdviserTeacherId = await checkColumnExistsCached('adviser_teacher_id');
        
        if (hasAdviserTeacherId) {
            // Try by teacher ID first
            result = await pool.query(
                `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                 FROM sections
                 WHERE adviser_teacher_id = $1 AND is_active = true
                 ORDER BY section_name`,
                [req.session.user.id]
            );
            console.log('Sections by teacher ID:', result.rows.length);
            
            // If no results, try by name as fallback
            if (result.rows.length === 0 && req.session.user.name) {
                console.log('No sections by ID, trying by name:', req.session.user.name);
                result = await pool.query(
                    `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                     FROM sections
                     WHERE adviser_name = $1 AND is_active = true
                     ORDER BY section_name`,
                    [req.session.user.name]
                );
                console.log('Sections by teacher name:', result.rows.length);
            }
        } else {
            // Column doesn't exist, use name-based lookup
            console.log('adviser_teacher_id column not found, using name-based lookup');
            result = await pool.query(
                `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                 FROM sections
                 WHERE adviser_name = $1 AND is_active = true
                 ORDER BY section_name`,
                [req.session.user.name]
            );
            console.log('Sections by teacher name:', result.rows.length);
        }
        
        console.log('Final sections result:', result.rows);
        res.json({ success: true, sections: result.rows });
    } catch (err) {
        console.error('teacher/sections error:', err);
        res.status(500).json({ success: false, error: 'Failed to load sections' });
    }
});

// Single, best-resolved section assignment for teacher
// Preference order:
//  1) Sections where adviser_teacher_id matches the logged-in teacher
//  2) If multiple, prefer Non-Graded
//  3) If still multiple, pick the most recently created (highest id)
//  4) Fallback to adviser_name match using same preference
app.get('/api/teacher/assigned-section', requireTeacher, async (req, res) => {
    try {
        const teacherId = req.session.user.id;
        const teacherName = req.session.user.name;

        // Use cached column check
        const hasAdviserTeacherId = await checkColumnExistsCached('adviser_teacher_id');

        const orderClause = `
            ORDER BY 
                CASE WHEN grade_level = 'Non-Graded' THEN 0 ELSE 1 END,
                id DESC
            LIMIT 1
        `;

        if (hasAdviserTeacherId) {
            // Strict by teacher ID
            const byId = await pool.query(
                `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                 FROM sections
                 WHERE adviser_teacher_id = $1 AND is_active = true
                 ${orderClause}`,
                [teacherId]
            );
            if (byId.rows.length > 0) {
                return res.json({ success: true, section: byId.rows[0], source: 'adviser_teacher_id' });
            }

            // Fallback by name
            const byName = await pool.query(
                `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                 FROM sections
                 WHERE adviser_name = $1 AND is_active = true
                 ${orderClause}`,
                [teacherName]
            );
            if (byName.rows.length > 0) {
                return res.json({ success: true, section: byName.rows[0], source: 'adviser_name' });
            }
        } else {
            // Column doesn't exist, use name-based lookup only
            const byName = await pool.query(
                `SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
                 FROM sections
                 WHERE adviser_name = $1 AND is_active = true
                 ${orderClause}`,
                [teacherName]
            );
            if (byName.rows.length > 0) {
                return res.json({ success: true, section: byName.rows[0], source: 'adviser_name' });
            }
        }

        // No assignment found
        return res.json({ success: true, section: null });
    } catch (err) {
        console.error('teacher/assigned-section error:', err);
        res.status(500).json({ success: false, error: 'Failed to resolve assigned section' });
    }
});

// Students of a section (teacher must own section)
app.get('/api/teacher/sections/:id/students', requireTeacher, async (req, res) => {
    const sectionId = parseInt(req.params.id);
    try {
        let sec;
        try {
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_teacher_id = $2', [sectionId, req.session.user.id]);
        } catch (e) {
            // Fallback when adviser_teacher_id column doesn't exist yet
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_name = $2', [sectionId, req.session.user.name]);
        }
        if (sec.rows.length === 0) {
            console.log(`Access denied: Section ${sectionId} not found for teacher ${req.session.user.id} (${req.session.user.name})`);
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        const students = await pool.query(`
            SELECT id, lrn, last_name, first_name, middle_name, ext_name, sex, age, grade_level, contact_number,
                   COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as full_name
            FROM students
            WHERE section_id = $1 AND enrollment_status = 'active'
            ORDER BY last_name, first_name
        `, [sectionId]);
        res.json({ success: true, students: students.rows });
    } catch (err) {
        console.error('teacher section students error:', err);
        res.status(500).json({ success: false, error: 'Failed to load students' });
    }
});

// Student details (teacher scoped)
app.get('/api/teacher/students/:id', requireTeacher, async (req, res) => {
    const studentId = req.params.id;
    try {
        const st = await pool.query('SELECT section_id FROM students WHERE id = $1', [studentId]);
        if (st.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        const secId = st.rows[0].section_id;
        let sec;
        try {
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_teacher_id = $2', [secId, req.session.user.id]);
        } catch (e) {
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_name = $2', [secId, req.session.user.name]);
        }
        if (sec.rows.length === 0) return res.status(403).json({ success: false, error: 'Access denied' });
        const detail = await pool.query(`
            SELECT id, enrollment_id, gmail_address, school_year, lrn, grade_level,
                   last_name, first_name, middle_name, ext_name,
                   COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') AS full_name,
                   birthday, age, sex, religion, current_address,
                   father_name, mother_name, guardian_name, contact_number
            FROM students WHERE id = $1
        `, [studentId]);
        res.json({ success: true, student: detail.rows[0] });
    } catch (err) {
        console.error('teacher student detail error:', err);
        res.status(500).json({ success: false, error: 'Failed to load student details' });
    }
});

// Auto-calculate severity based on category, notes content, and report history
function calculateSeverity(category, notes, priorReportCount) {
    // High-risk keywords that escalate severity
    const highRiskKeywords = ['weapon', 'knife', 'gun', 'injured', 'blood', 'assault', 'hit', 'punch', 'kick', 'stab', 'sexual', 'abuse', 'death', 'kill', 'suicide', 'bomb', 'threat'];
    const mediumRiskKeywords = ['fight', 'hurt', 'pain', 'emergency', 'police', 'hospital', 'broken', 'severe', 'serious', 'dangerous'];
    const lowRiskKeywords = ['late', 'absent', 'incomplete', 'forgotten', 'minor', 'small', 'talk', 'chat', 'whisper', 'distract'];
    
    // Severity level keywords from notes
    const highSeverityKeywords = ['critical', 'urgent', 'emergency', 'severe', 'serious', 'high priority', 'immediate action'];
    const mediumSeverityKeywords = ['moderate', 'concern', 'issue', 'problem', 'notable', 'attention needed'];
    const lowSeverityKeywords = ['minor', 'small', 'trivial', 'low priority', 'negligible'];
    
    const notesLower = (notes || '').toLowerCase();
    
    // Check for explicit severity keywords in notes first
    if (highSeverityKeywords.some(kw => notesLower.includes(kw))) {
        // If notes explicitly mention high severity, escalate
        if (!lowRiskKeywords.some(kw => notesLower.includes(kw))) {
            return 'High';
        }
    }
    
    if (lowSeverityKeywords.some(kw => notesLower.includes(kw))) {
        // If notes explicitly mention low severity, keep it low unless it's a high-risk category
        if (!highRiskKeywords.some(kw => notesLower.includes(kw)) && !mediumRiskKeywords.some(kw => notesLower.includes(kw))) {
            return 'Low';
        }
    }
    
    // Severity mapping: High-risk categories get High immediately
    const highRiskCategories = ['Violence/Aggression', 'Sexual Misconduct', 'Threats'];
    if (highRiskCategories.includes(category)) {
        // Check if notes contain high-risk keywords - keep it High
        if (highRiskKeywords.some(kw => notesLower.includes(kw))) {
            return 'High';
        }
        // For high-risk categories, default to High unless notes suggest otherwise
        return priorReportCount === 0 ? 'Medium' : 'High';
    }
    
    // Medium-risk categories
    const mediumRiskCategories = ['Vandalism', 'Safety'];
    if (mediumRiskCategories.includes(category)) {
        // Check for high-risk keywords in notes
        if (highRiskKeywords.some(kw => notesLower.includes(kw))) {
            return 'High';
        }
        // Check for low-risk keywords (downgrade severity)
        if (lowRiskKeywords.some(kw => notesLower.includes(kw))) {
            return 'Low';
        }
        // Check for medium-risk keywords
        if (mediumRiskKeywords.some(kw => notesLower.includes(kw))) {
            return priorReportCount > 0 ? 'High' : 'Medium';
        }
        return priorReportCount > 0 ? 'High' : 'Medium';
    }
    
    // Low-risk categories (Disruption, Disrespect, Other)
    // Check for high-risk keywords in notes first
    if (highRiskKeywords.some(kw => notesLower.includes(kw))) {
        return 'High';
    }
    
    // Check for low-risk keywords (keep it low)
    if (lowRiskKeywords.some(kw => notesLower.includes(kw))) {
        return priorReportCount === 0 ? 'Low' : (priorReportCount === 1 ? 'Medium' : 'High');
    }
    
    // Check for medium-risk keywords
    if (mediumRiskKeywords.some(kw => notesLower.includes(kw))) {
        return priorReportCount >= 1 ? 'High' : 'Medium';
    }
    
    // Escalate based on frequency for low-risk
    if (priorReportCount === 0) return 'Low';
    if (priorReportCount === 1) return 'Medium';
    return 'High';
}

// Behavior reports: create
app.post('/api/behavior-reports', requireTeacher, async (req, res) => {
    const { studentId, sectionId, category, notes, reportDate } = req.body || {};
    if (!studentId || !sectionId || !category) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    try {
        let sec;
        try {
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_teacher_id = $2', [sectionId, req.session.user.id]);
        } catch (e) {
            sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_name = $2', [sectionId, req.session.user.name]);
        }
        if (sec.rows.length === 0) return res.status(403).json({ success: false, error: 'Access denied' });
        const st = await pool.query('SELECT id FROM students WHERE id = $1 AND section_id = $2', [studentId, sectionId]);
        if (st.rows.length === 0) return res.status(400).json({ success: false, error: 'Student not in your section' });
        
        // Get prior report count for this student
        const priorReports = await pool.query(
            'SELECT COUNT(*) as count FROM student_behavior_reports WHERE student_id = $1',
            [studentId]
        );
        const priorReportCount = parseInt(priorReports.rows[0].count) || 0;
        
        // Auto-calculate severity based on category, notes, and history
        const severity = calculateSeverity(category, notes, priorReportCount);
        
        const result = await pool.query(`
            INSERT INTO student_behavior_reports (student_id, section_id, teacher_id, report_date, category, severity, notes)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7)
            RETURNING id
        `, [studentId, sectionId, req.session.user.id, reportDate || null, category, severity, notes || null]);
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('create behavior report error:', err);
        res.status(500).json({ success: false, error: 'Failed to save report' });
    }
});

// Behavior reports: list by student or section
app.get('/api/behavior-reports', requireTeacher, async (req, res) => {
    const { studentId, sectionId } = req.query;
    try {
        if (studentId) {
            const st = await pool.query('SELECT section_id FROM students WHERE id = $1', [studentId]);
            if (st.rows.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
            const secId = st.rows[0].section_id;
            let sec;
            try {
                sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_teacher_id = $2', [secId, req.session.user.id]);
            } catch (e) {
                sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_name = $2', [secId, req.session.user.name]);
            }
            if (sec.rows.length === 0) return res.status(403).json({ success: false, error: 'Access denied' });
            const list = await pool.query(`
                SELECT r.id, r.report_date, r.category, r.severity, r.notes
                FROM student_behavior_reports r
                WHERE r.student_id = $1
                ORDER BY r.report_date DESC, r.id DESC
            `, [studentId]);
            return res.json({ success: true, reports: list.rows });
        }
        if (sectionId) {
            let sec;
            try {
                sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_teacher_id = $2', [sectionId, req.session.user.id]);
            } catch (e) {
                sec = await pool.query('SELECT id FROM sections WHERE id = $1 AND adviser_name = $2', [sectionId, req.session.user.name]);
            }
            if (sec.rows.length === 0) return res.status(403).json({ success: false, error: 'Access denied' });
            const list = await pool.query(`
                SELECT r.id, r.report_date, r.category, r.severity, r.notes, r.student_id,
                       COALESCE(s.last_name, '') || ', ' || COALESCE(s.first_name, '') || ' ' || COALESCE(s.middle_name || '', '') AS student_name
                FROM student_behavior_reports r
                JOIN students s ON s.id = r.student_id
                WHERE r.section_id = $1
                ORDER BY r.report_date DESC, r.id DESC
            `, [sectionId]);
            return res.json({ success: true, reports: list.rows });
        }
        return res.status(400).json({ success: false, error: 'Provide studentId or sectionId' });
    } catch (err) {
        console.error('list behavior reports error:', err);
        res.status(500).json({ success: false, error: 'Failed to load reports' });
    }
});

// ======================== DR ADMIN: BEHAVIOR ANALYTICS ========================
// Get all behavior reports with student and teacher details for analytics + DSS recommendations
// NOTE: This endpoint is deprecated, use /api/guidance/behavior-analytics instead
app.get('/api/dr-admin/behavior-analytics', async (req, res) => {
    // Redirect to new endpoint
    res.redirect('/api/guidance/behavior-analytics');
});

// ======================== GUIDANCE COUNSELOR ROUTES ========================
// Guidance Login Page
app.get('/guidance/login', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/guidance/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-login.html'));
});

// Guidance Dashboard Page
app.get('/guidance/dashboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }

    try {
        // Optional date range filter from query parameters (expected format: YYYY-MM-DD)
        const from = req.query.from;
        const to = req.query.to;
        const hasDateRange = from && to;

        // Basic validation: ensure dates are in YYYY-MM-DD format (very small validation)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (hasDateRange && (!dateRegex.test(from) || !dateRegex.test(to))) {
            return res.status(400).send('Invalid date format for filter. Use YYYY-MM-DD.');
        }
        // Basic aggregates for the dashboard
        // When a date range is provided, include it in the aggregate queries
        let totalQ, pendingQ, approvedQ, completedQ;
        if (hasDateRange) {
            totalQ = await pool.query("SELECT COUNT(*)::int AS total FROM document_requests WHERE created_at::date BETWEEN $1 AND $2", [from, to]);
            pendingQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status = 'pending' AND created_at::date BETWEEN $1 AND $2", [from, to]);
            approvedQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status IN ('processing','ready','approved') AND created_at::date BETWEEN $1 AND $2", [from, to]);
            completedQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status = 'completed' AND created_at::date BETWEEN $1 AND $2", [from, to]);
        } else {
            totalQ = await pool.query("SELECT COUNT(*)::int AS total FROM document_requests");
            pendingQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status = 'pending'");
            approvedQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status IN ('processing','ready','approved')");
            completedQ = await pool.query("SELECT COUNT(*)::int AS count FROM document_requests WHERE status = 'completed'");
        }

        // Breakdown by document type (top 10)
        let countsByTypeQ;
        if (hasDateRange) {
            countsByTypeQ = await pool.query(`
                SELECT document_type AS type, COUNT(*)::int AS count
                FROM document_requests
                WHERE created_at::date BETWEEN $1 AND $2
                GROUP BY document_type
                ORDER BY count DESC
                LIMIT 10
            `, [from, to]);
        } else {
            countsByTypeQ = await pool.query(`
                SELECT document_type AS type, COUNT(*)::int AS count
                FROM document_requests
                GROUP BY document_type
                ORDER BY count DESC
                LIMIT 10
            `);
        }

        // Monthly summary (last 6 months)
        let monthlySummaryQ;
        if (hasDateRange) {
            monthlySummaryQ = await pool.query(`
                SELECT TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month, COUNT(*)::int AS count
                FROM document_requests
                WHERE created_at::date BETWEEN $1 AND $2
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at) DESC
            `, [from, to]);
        } else {
            monthlySummaryQ = await pool.query(`
                SELECT TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month, COUNT(*)::int AS count
                FROM document_requests
                WHERE created_at >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at) DESC
            `);
        }

        // Top requesters (by student_name or email)
        let topRequestersQ;
        if (hasDateRange) {
            topRequestersQ = await pool.query(`
                SELECT COALESCE(student_name, email) AS name, COUNT(*)::int AS count
                FROM document_requests
                WHERE created_at::date BETWEEN $1 AND $2
                GROUP BY COALESCE(student_name, email)
                ORDER BY count DESC
                LIMIT 5
            `, [from, to]);
        } else {
            topRequestersQ = await pool.query(`
                SELECT COALESCE(student_name, email) AS name, COUNT(*)::int AS count
                FROM document_requests
                GROUP BY COALESCE(student_name, email)
                ORDER BY count DESC
                LIMIT 5
            `);
        }

        // Average turnaround hours for completed requests
        let avgTurnQ;
        if (hasDateRange) {
            avgTurnQ = await pool.query(`
                SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/3600)::numeric, 2), NULL) AS avg_hours
                FROM document_requests
                WHERE status = 'completed' AND processed_at IS NOT NULL
                AND processed_at::date BETWEEN $1 AND $2
            `, [from, to]);
        } else {
            avgTurnQ = await pool.query(`
                SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at))/3600)::numeric, 2), NULL) AS avg_hours
                FROM document_requests
                WHERE status = 'completed' AND processed_at IS NOT NULL
            `);
        }

        // Recent requests
        let recentQ;
        if (hasDateRange) {
            recentQ = await pool.query(`
                SELECT id, request_token, student_name, email, document_type, purpose, status, created_at, processed_at
                FROM document_requests
                WHERE created_at::date BETWEEN $1 AND $2
                ORDER BY created_at DESC
                LIMIT 50
            `, [from, to]);
        } else {
            recentQ = await pool.query(`
                SELECT id, request_token, student_name, email, document_type, purpose, status, created_at, processed_at
                FROM document_requests
                ORDER BY created_at DESC
                LIMIT 50
            `);
        }

        const totalRequests = totalQ.rows[0]?.total || 0;
        const pendingRequests = pendingQ.rows[0]?.count || 0;
        const approvedRequests = approvedQ.rows[0]?.count || 0;
        const completedRequests = completedQ.rows[0]?.count || 0;
        const countsByType = countsByTypeQ.rows || [];
        const monthlySummary = monthlySummaryQ.rows.map(r => ({ month: r.month, count: r.count })) || [];
        const topRequesters = topRequestersQ.rows.map(r => ({ name: r.name, count: r.count })) || [];
        const avgTurnaround = avgTurnQ.rows[0] && avgTurnQ.rows[0].avg_hours ? `${avgTurnQ.rows[0].avg_hours} hrs` : 'N/A';
        const requests = recentQ.rows || [];

        return res.render('guidance/guidance-dashboard', {
            schoolName: req.session.user?.name || null,
            totalRequests,
            pendingRequests,
            approvedRequests,
            completedRequests,
            countsByType,
            monthlySummary,
            topRequesters,
            avgTurnaround,
            requests,
            // Echo back date filters for form prefill
            from: hasDateRange ? from : null,
            to: hasDateRange ? to : null,
            user: req.session.user,
            activePage: 'dashboard'
        });
    } catch (err) {
        console.error('Error rendering guidance dashboard:', err);
        // Rendering failed â€” return a simple error response instead of serving the static template
        return res.status(500).send('Failed to load guidance dashboard');
    }
});

// Guidance Behavior Analytics Page
app.get('/guidance/behavior-analytics', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-behavior-analytics.html'));
});

// Guidance Archived Behavior Reports Page
app.get('/guidance/behavior-archive', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-behavior-archive.html'));
});

// Guidance Behavior Analytics API (DSS-powered)
app.get('/api/guidance/behavior-analytics', async (req, res) => {
    try {
        console.log('ðŸ“Š Loading behavior analytics...');
        
        // Get all behavior reports with full details
        const reportsResult = await pool.query(`
            SELECT 
                r.id,
                r.report_date,
                r.category,
                r.severity,
                r.notes,
                r.student_id,
                r.section_id,
                r.teacher_id,
                COALESCE(s.last_name, '') || ', ' || COALESCE(s.first_name, '') || ' ' || COALESCE(s.middle_name || '', '') AS student_full_name,
                COALESCE(t.last_name, '') || ', ' || COALESCE(t.first_name, '') AS teacher_name,
                COALESCE(sec.section_name, 'N/A') AS section_name,
                COALESCE(sec.grade_level, 'N/A') AS grade_level
            FROM student_behavior_reports r
            LEFT JOIN students s ON s.id = r.student_id
            LEFT JOIN teachers t ON t.id = r.teacher_id
            LEFT JOIN sections sec ON sec.id = r.section_id
            ORDER BY r.report_date DESC
        `);

        console.log('ðŸ“‹ Found', reportsResult.rows.length, 'reports');

        // Get unique students
        const studentsResult = await pool.query(`
            SELECT DISTINCT 
                s.id,
                s.first_name,
                s.middle_name,
                s.last_name,
                COALESCE(s.last_name, '') || ', ' || COALESCE(s.first_name, '') || ' ' || COALESCE(s.middle_name || '', '') AS full_name,
                COALESCE(sec.section_name, 'N/A') AS section_name
            FROM students s
            LEFT JOIN sections sec ON sec.id = s.section_id
            WHERE s.id IN (
                SELECT DISTINCT student_id FROM student_behavior_reports WHERE student_id IS NOT NULL
            )
        `);

        console.log('ðŸ‘¥ Found', studentsResult.rows.length, 'students with reports');

        // ===== DSS ENGINE: ANALYZE ALL REPORTS (with fallback) =====
        const reports = reportsResult.rows;
        
        let dashboardAnalysis = {
            totalReports: reports.length,
            highSeverityCount: 0,
            mediumSeverityCount: 0,
            lowSeverityCount: 0,
            categoryBreakdown: {},
            atRiskStudents: [],
            topRecommendations: [],
        };
        
        try {
            if (dssEngine && dssEngine.analyzeAllReports && typeof dssEngine.analyzeAllReports === 'function') {
                const engineAnalysis = dssEngine.analyzeAllReports(reports);
                dashboardAnalysis = { ...dashboardAnalysis, ...engineAnalysis };
                console.log('âœ… DSS Engine analysis completed');
            } else {
                console.warn('âš ï¸ DSS Engine not properly initialized, using fallback analysis');
                // Fallback: basic analysis
                reports.forEach(report => {
                    if (report.severity === 'High') dashboardAnalysis.highSeverityCount++;
                    if (report.severity === 'Medium') dashboardAnalysis.mediumSeverityCount++;
                    if (report.severity === 'Low') dashboardAnalysis.lowSeverityCount++;
                    dashboardAnalysis.categoryBreakdown[report.category] = 
                        (dashboardAnalysis.categoryBreakdown[report.category] || 0) + 1;
                });
            }
        } catch (dssErr) {
            console.warn('âš ï¸ DSS Engine error:', dssErr.message);
            // Use fallback analysis
            reports.forEach(report => {
                if (report.severity === 'High') dashboardAnalysis.highSeverityCount++;
                if (report.severity === 'Medium') dashboardAnalysis.mediumSeverityCount++;
                if (report.severity === 'Low') dashboardAnalysis.lowSeverityCount++;
                dashboardAnalysis.categoryBreakdown[report.category] = 
                    (dashboardAnalysis.categoryBreakdown[report.category] || 0) + 1;
            });
        }

        // ===== ADD RECOMMENDATIONS TO EACH REPORT (with fallback) =====
        const reportsWithRecommendations = reports.map(report => {
            let recommendations = [];
            try {
                if (dssEngine && dssEngine.generateRecommendations && typeof dssEngine.generateRecommendations === 'function') {
                    recommendations = dssEngine.generateRecommendations(report, reports);
                }
            } catch (recErr) {
                console.warn('âš ï¸ Recommendation generation error for report', report.id, ':', recErr.message);
            }
            
            return {
                ...report,
                recommendations: recommendations || [],
                hasRecommendations: (recommendations && recommendations.length > 0) || false,
            };
        });

        console.log('âœ… Successfully loaded behavior analytics');
        
        res.json({
            success: true,
            reports: reportsWithRecommendations,
            students: studentsResult.rows,
            dashboardAnalysis: dashboardAnalysis,
        });
    } catch (err) {
        console.error('ðŸ’¥ Guidance behavior analytics error:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ success: false, error: 'Failed to load analytics: ' + err.message });
    }
});

// ==================== GUIDANCE-TEACHER MESSAGING ====================

// Get all teachers for guidance dropdown
app.get('/api/guidance/teachers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.id, t.first_name, t.middle_name, t.last_name, t.username, 
                   s.section_name, s.id as section_id
            FROM teachers t
            LEFT JOIN sections s ON s.adviser_teacher_id = t.id
            ORDER BY t.last_name, t.first_name
        `);
        res.json({ success: true, teachers: result.rows });
    } catch (err) {
        console.error('Failed to load teachers:', err);
        res.status(500).json({ success: false, error: 'Failed to load teachers' });
    }
});

// Get all students for guidance dropdown
app.get('/api/guidance/students', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.id, 
                   COALESCE(s.first_name, '') || ' ' || COALESCE(s.middle_name, '') || ' ' || COALESCE(s.last_name, '') as full_name,
                   s.lrn, 
                   sec.section_name
            FROM students s
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.is_archived = false
            ORDER BY s.last_name, s.first_name
        `);
        res.json({ success: true, students: result.rows });
    } catch (err) {
        console.error('Failed to load students:', err);
        res.status(500).json({ success: false, error: 'Failed to load students' });
    }
});

// Send message from guidance to teacher
app.post('/api/guidance/messages', async (req, res) => {
    console.log('[DEBUG] POST /api/guidance/messages');
    console.log('[DEBUG] Session ID:', req.sessionID);
    console.log('[DEBUG] Session data:', JSON.stringify(req.session, null, 2));
    console.log('[DEBUG] Request body:', req.body);
    console.log('[DEBUG] Has guidance_id?', !!req.session.guidance_id);
    console.log('[DEBUG] Has user?', !!req.session.user);
    
    if (!req.session.guidance_id) {
        console.log('[DEBUG] âŒ Not authenticated - no guidance_id in session');
        console.log('[DEBUG] Full session object:', req.session);
        return res.status(401).json({ success: false, error: 'Not authenticated as guidance' });
    }

    const { teacherId, studentId, message } = req.body;

    if (!teacherId || !message || !message.trim()) {
        console.log('[DEBUG] Validation failed:', { teacherId, message });
        return res.status(400).json({ success: false, error: 'Teacher and message are required' });
    }

    try {
        console.log('[DEBUG] Inserting message:', { 
            guidance_id: req.session.guidance_id, 
            teacherId, 
            studentId, 
            message: message.substring(0, 50) 
        });
        
        const result = await pool.query(`
            INSERT INTO guidance_teacher_messages (guidance_id, teacher_id, student_id, message, created_at, is_read)
            VALUES ($1, $2, $3, $4, NOW(), false)
            RETURNING id
        `, [req.session.guidance_id, teacherId, studentId || null, message.trim()]);

        console.log('[DEBUG] Message inserted successfully, ID:', result.rows[0].id);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('[ERROR] Failed to send message:', err);
        res.status(500).json({ success: false, error: 'Database error: ' + err.message });
    }
});

// Get sent messages history for guidance
app.get('/api/guidance/messages', async (req, res) => {
    if (!req.session.guidance_id) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                gtm.id, gtm.message, gtm.created_at, gtm.is_read, COALESCE(gtm.is_archived, false) as is_archived,
                COALESCE(t.first_name, '') || ' ' || COALESCE(t.last_name, '') as teacher_name,
                COALESCE(s.first_name, '') || ' ' || COALESCE(s.middle_name, '') || ' ' || COALESCE(s.last_name, '') as student_name
            FROM guidance_teacher_messages gtm
            INNER JOIN teachers t ON gtm.teacher_id = t.id
            LEFT JOIN students s ON gtm.student_id = s.id
            WHERE gtm.guidance_id = $1
            ORDER BY gtm.created_at DESC
            LIMIT 100
        `, [req.session.guidance_id]);

        res.json({ success: true, messages: result.rows });
    } catch (err) {
        console.error('Failed to load message history:', err);
        res.status(500).json({ success: false, error: 'Failed to load messages' });
    }
});

// Get messages for teacher
app.get('/api/teacher/messages', requireTeacher, async (req, res) => {
    try {
        // Check if the table exists first
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'guidance_teacher_messages'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            // Table doesn't exist, return empty messages
            return res.json({ success: true, messages: [] });
        }
        
        const result = await pool.query(`
            SELECT 
                gtm.id, gtm.message, gtm.created_at, gtm.is_read,
                g.username as guidance_name,
                gtm.student_id
            FROM guidance_teacher_messages gtm
            INNER JOIN guidance_accounts g ON gtm.guidance_id = g.id
            WHERE gtm.teacher_id = $1
            ORDER BY gtm.created_at DESC
        `, [req.session.user.id]);

        res.json({ success: true, messages: result.rows });
    } catch (err) {
        console.error('Failed to load teacher messages:', err);
        // Return empty messages instead of error
        res.json({ success: true, messages: [] });
    }
});

// Get unread message count for teacher
app.get('/api/teacher/messages/unread-count', requireTeacher, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM guidance_teacher_messages
            WHERE teacher_id = $1 AND is_read = false
        `, [req.session.user.id]);

        res.json({ success: true, count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error('Failed to get unread count:', err);
        res.status(500).json({ success: false, error: 'Failed to get count' });
    }
});

// Mark message as read
app.put('/api/teacher/messages/:id/read', requireTeacher, async (req, res) => {
    const messageId = req.params.id;

    try {
        await pool.query(`
            UPDATE guidance_teacher_messages
            SET is_read = true
            WHERE id = $1 AND teacher_id = $2
        `, [messageId, req.session.user.id]);

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to mark message as read:', err);
        res.status(500).json({ success: false, error: 'Failed to update message' });
    }
});

// Backward compatibility: redirect /dr-admin to /guidance
app.get('/dr-admin/login', (req, res) => res.redirect('/guidance/login'));
app.get('/dr-admin/dashboard', (req, res) => res.redirect('/guidance/dashboard'));
app.get('/dr-admin/behavior-analytics', (req, res) => res.redirect('/guidance/behavior-analytics'));
app.get('/dr-admin/logout', (req, res) => res.redirect('/guidance/logout'));
app.post('/api/dr-admin/login', (req, res) => res.redirect(307, '/api/guidance/login'));
app.get('/api/dr-admin/behavior-analytics', (req, res) => res.redirect('/api/guidance/behavior-analytics'));

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// PostgreSQL connection pool
// ============= DATABASE CONNECTION =============
console.log('\nðŸ“ Database Configuration Check:');
console.log('   DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('   NODE_ENV:', process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
    console.log('   âœ… Using DATABASE_URL for connection');
} else {
    console.log('   Using individual DB parameters (localhost)');
}

// Check if this is a Render database (requires SSL)
const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.render.com');
const ssl = process.env.DATABASE_URL 
    ? (isRenderDB ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false))
    : undefined;

const pool = new Pool({
    ...(process.env.DATABASE_URL 
        ? { connectionString: process.env.DATABASE_URL, ssl: ssl }
        : {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'ICTCOORdb',
            password: process.env.DB_PASSWORD || 'bello0517',
            port: parseInt(process.env.DB_PORT) || 5432,
        }
    ),
    // ============= PERFORMANCE: CONNECTION POOL TUNING =============
    max: 15, // Maximum number of clients in the pool (reduced for stability)
    idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
    connectionTimeoutMillis: 10000, // Connection attempt timeout (increased to 10 seconds)
    statement_timeout: 30000, // Statement timeout: 30 seconds
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('âŒ Error connecting to database:', err.stack);
        console.error('Connection details:', {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ICTCOORdb',
            user: process.env.DB_USER || 'postgres'
        });
        // Don't exit - allow app to continue in case DB recovers
        setTimeout(() => {
            console.log('Retrying database connection...');
            pool.connect((err2, client2, release2) => {
                if (!err2 && client2) {
                    console.log('âœ… Database reconnected successfully');
                    release2();
                    initializeSchemas();
                }
            });
        }, 5000);
    } else {
        console.log('âœ… Database connected successfully');
        release();
        initializeSchemas();
    }
});

/**
 * Initialize all database schemas and indexes
 */
async function initializeSchemas() {
    try {
        console.log('ðŸ“‹ Initializing database schemas...');
        
        // Initialize all schemas - catch errors individually so one failure doesn't stop others
        await ensureDocumentRequestsSchema().catch(e => console.error('Document requests schema error:', e.message));
        await ensureSubmissionLogsSchema().catch(e => console.error('Submission logs schema error:', e.message));
        await ensureBlockedIPsSchema().catch(e => console.error('Blocked IPs schema error:', e.message));
        await ensureTeachersArchiveSchema().catch(e => console.error('Teachers archive schema error:', e.message));
        await ensureEnrollmentRequestsSchema().catch(e => console.error('Enrollment requests schema error:', e.message));
        await ensureMessagingSchema().catch(e => console.error('Messaging schema error:', e.message));
        await createPerformanceIndexes().catch(e => console.error('Performance indexes error:', e.message));
        
        console.log('âœ… All schemas and indexes initialized successfully');
    } catch (err) {
        console.error('âŒ Schema initialization error:', err.message);
        // Retry after 5 seconds
        setTimeout(initializeSchemas, 5000);
    }
}

// ============= PERFORMANCE: CREATE INDEXES FOR COMMON QUERIES =============
async function createPerformanceIndexes() {
    const indexQueries = [
        // Sections table indexes
        `CREATE INDEX IF NOT EXISTS idx_sections_adviser_teacher_id ON sections(adviser_teacher_id) WHERE is_active = true`,
        `CREATE INDEX IF NOT EXISTS idx_sections_adviser_name ON sections(adviser_name) WHERE is_active = true`,
        `CREATE INDEX IF NOT EXISTS idx_sections_section_name ON sections(section_name) WHERE is_active = true`,
        
        // Students table indexes
        `CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id) WHERE enrollment_status = 'active'`,
        `CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(lrn)`,
        
        // Behavior reports indexes
        `CREATE INDEX IF NOT EXISTS idx_behavior_reports_student_id ON student_behavior_reports(student_id)`,
        `CREATE INDEX IF NOT EXISTS idx_behavior_reports_section_id ON student_behavior_reports(section_id)`,
        `CREATE INDEX IF NOT EXISTS idx_behavior_reports_teacher_id ON student_behavior_reports(teacher_id)`,
        `CREATE INDEX IF NOT EXISTS idx_behavior_reports_report_date ON student_behavior_reports(report_date DESC)`,
        
        // Document requests indexes
        `CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON document_requests(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_document_requests_status_created ON document_requests(status, created_at DESC)`,
        
        // Guidance teachers messages indexes
        `CREATE INDEX IF NOT EXISTS idx_guidance_messages_guidance_id ON guidance_teacher_messages(guidance_id)`,
        `CREATE INDEX IF NOT EXISTS idx_guidance_messages_teacher_id ON guidance_teacher_messages(teacher_id)`,
        `CREATE INDEX IF NOT EXISTS idx_guidance_messages_created ON guidance_teacher_messages(created_at DESC)`
    ];
    
    try {
        for (const query of indexQueries) {
            await pool.query(query);
        }
        console.log('âœ… Performance indexes created successfully');
    } catch (err) {
        console.error('âŒ Error creating indexes:', err.message);
    }
}

// ============= PERFORMANCE: CACHED COLUMN CHECK =============
async function checkColumnExistsCached(columnName) {
    // Return cached result if available and not expired
    if (columnExistsCache.adviser_teacher_id !== null && 
        Date.now() - columnExistsCache.checked_at < CACHE_TTL) {
        return columnExistsCache.adviser_teacher_id;
    }
    
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'sections' 
                AND column_name = $1
            ) AS has_column
        `, [columnName]);
        
        columnExistsCache.adviser_teacher_id = result.rows[0].has_column;
        columnExistsCache.checked_at = Date.now();
        return result.rows[0].has_column;
    } catch (err) {
        console.error('Error checking column:', err);
        return false;
    }
}

/**
 * Ensures the teachers_archive table exists. Safe to call multiple times.
 */
async function ensureTeachersArchiveSchema() {
    const ddl = `
    CREATE TABLE IF NOT EXISTS teachers_archive (
        id SERIAL PRIMARY KEY,
        original_id INTEGER,
        username VARCHAR(50),
        password VARCHAR(255),
        first_name VARCHAR(50),
        middle_name VARCHAR(50),
        last_name VARCHAR(50),
        ext_name VARCHAR(10),
        email VARCHAR(100),
        contact_number VARCHAR(20),
        birthday DATE,
        sex VARCHAR(10),
        address TEXT,
        employee_id VARCHAR(50),
        department VARCHAR(100),
        position VARCHAR(100),
        specialization VARCHAR(100),
        date_hired DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        archived_by INTEGER,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_teachers_archive_original_id ON teachers_archive(original_id);
    CREATE INDEX IF NOT EXISTS idx_teachers_archive_archived_at ON teachers_archive(archived_at);
    `;
    try {
        await pool.query(ddl);
        console.log('âœ… teachers_archive schema ensured');
        
        // Also ensure is_archived column on teachers table
        await pool.query(`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_teachers_is_archived ON teachers(is_archived)`);
        console.log('âœ… teachers.is_archived column ensured');
    } catch (err) {
        console.error('âŒ Failed ensuring teachers_archive schema:', err.message);
        // Don't throw - allow other schemas to initialize
    }
}

/**
 * Ensures the enrollment_requests table exists.
 * Safe to call multiple times.
 */
async function ensureEnrollmentRequestsSchema() {
    const ddl = `
    CREATE TABLE IF NOT EXISTS enrollment_requests (
        id SERIAL PRIMARY KEY,
        request_token VARCHAR(20) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        
        gmail_address VARCHAR(255) NOT NULL,
        school_year VARCHAR(50) NOT NULL,
        lrn VARCHAR(50),
        grade_level VARCHAR(50) NOT NULL,
        
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        ext_name VARCHAR(50),
        
        birthday DATE NOT NULL,
        age INTEGER NOT NULL,
        sex VARCHAR(20) NOT NULL,
        religion VARCHAR(100),
        current_address TEXT NOT NULL,
        
        ip_community VARCHAR(50) NOT NULL,
        ip_community_specify VARCHAR(100),
        pwd VARCHAR(50) NOT NULL,
        pwd_specify VARCHAR(100),
        
        father_name VARCHAR(200),
        mother_name VARCHAR(200),
        guardian_name VARCHAR(200),
        contact_number VARCHAR(50),
        
        registration_date TIMESTAMP NOT NULL,
        printed_name VARCHAR(200) NOT NULL,
        signature_image_path TEXT,
        
        enrollee_type VARCHAR(50),
        birth_cert_psa TEXT,
        eccd_checklist TEXT,
        report_card_previous TEXT,
        sf10_original TEXT,
        sf10_optional TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER REFERENCES registrar_accounts(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_request_token ON enrollment_requests(request_token);
    CREATE INDEX IF NOT EXISTS idx_status ON enrollment_requests(status);
    
    -- Add missing columns if they don't exist
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS enrollee_type VARCHAR(50);
    
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS birth_cert_psa TEXT;
    
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS eccd_checklist TEXT;
    
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS report_card_previous TEXT;
    
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS sf10_original TEXT;
    
    ALTER TABLE enrollment_requests 
    ADD COLUMN IF NOT EXISTS sf10_optional TEXT;
    
    -- Convert registration_date from DATE to TIMESTAMP to preserve time information
    ALTER TABLE enrollment_requests
    ALTER COLUMN registration_date TYPE TIMESTAMP USING registration_date::timestamp;
    
    CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;$$ LANGUAGE plpgsql;
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_enrollment_requests_updated_at') THEN
            CREATE TRIGGER trigger_update_enrollment_requests_updated_at
            BEFORE UPDATE ON enrollment_requests
            FOR EACH ROW EXECUTE FUNCTION update_enrollment_requests_updated_at();
        END IF;
    END$$;
    `;
    try {
        await pool.query(ddl);
        console.log('âœ… enrollment_requests schema ensured');
    } catch (err) {
        console.error('âŒ Failed ensuring enrollment_requests schema:', err.message);
        // Don't throw - allow other schemas to initialize
    }
}

/**
 * Ensures the document_requests table, indexes, and trigger exist.
 * Safe to call multiple times.
 */
async function ensureDocumentRequestsSchema() {
    const ddl = `
    CREATE TABLE IF NOT EXISTS document_requests (
        id SERIAL PRIMARY KEY,
        request_token VARCHAR(20) UNIQUE NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        student_id VARCHAR(100),
        contact_number VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        purpose TEXT NOT NULL,
        additional_notes TEXT,
        adviser_name VARCHAR(255),
        adviser_school_year VARCHAR(50),
        student_type VARCHAR(20) CHECK (student_type IN ('student','alumni')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','completed','rejected')),
        processed_by INTEGER REFERENCES guidance_accounts(id),
        processed_at TIMESTAMP,
        completion_notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_document_requests_token ON document_requests(request_token);
    CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
    CREATE INDEX IF NOT EXISTS idx_document_requests_email ON document_requests(email);
    CREATE OR REPLACE FUNCTION update_document_requests_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;$$ LANGUAGE plpgsql;
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_document_requests_updated_at') THEN
            CREATE TRIGGER trigger_update_document_requests_updated_at
            BEFORE UPDATE ON document_requests
            FOR EACH ROW EXECUTE FUNCTION update_document_requests_updated_at();
        END IF;
    END$$;
    `;
    try {
        await pool.query(ddl);
        console.log('âœ… document_requests schema ensured');
    } catch (err) {
        console.error('âŒ Failed ensuring document_requests schema:', err.message);
        // Don't throw - allow other schemas to initialize
    }
}

/**
 * Ensures the submission_logs table exists for activity monitoring
 */
async function ensureSubmissionLogsSchema() {
    const ddl = `
    CREATE TABLE IF NOT EXISTS submission_logs (
        id SERIAL PRIMARY KEY,
        submission_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        email VARCHAR(255),
        lrn VARCHAR(12),
        form_data JSONB,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        request_token VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_submission_logs_ip ON submission_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_submission_logs_email ON submission_logs(email);
    CREATE INDEX IF NOT EXISTS idx_submission_logs_type ON submission_logs(submission_type);
    CREATE INDEX IF NOT EXISTS idx_submission_logs_status ON submission_logs(status);
    CREATE INDEX IF NOT EXISTS idx_submission_logs_created ON submission_logs(created_at);
    `;
    try {
        await pool.query(ddl);
        console.log('âœ… submission_logs schema ensured');
    } catch (err) {
        console.error('âŒ Failed ensuring submission_logs schema:', err.message);
        // Don't throw - allow other schemas to initialize
    }
}

    /**
     * Ensures the blocked_ips table exists for IP blocklist management
     */
    async function ensureBlockedIPsSchema() {
        const ddl = `
        CREATE TABLE IF NOT EXISTS blocked_ips (
            id SERIAL PRIMARY KEY,
            ip_address VARCHAR(45) UNIQUE NOT NULL,
            reason TEXT NOT NULL,
            blocked_by INTEGER REFERENCES guidance_accounts(id),
            blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            is_active BOOLEAN DEFAULT true,
            unblocked_by INTEGER REFERENCES guidance_accounts(id),
            unblocked_at TIMESTAMP,
            notes TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active);
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at);
        `;
        try {
            await pool.query(ddl);
            console.log('âœ… blocked_ips schema ensured');
    } catch (err) {
        console.error('âŒ Failed ensuring blocked_ips schema:', err.message);
        // Don't throw - allow other schemas to initialize
    }
}    // ============= SECURITY: IP BLOCKLIST =============
    async function isIPBlocked(ip) {
        try {
            const result = await pool.query(`
                SELECT id, reason FROM blocked_ips
                WHERE ip_address = $1 
                AND is_active = true
                AND (expires_at IS NULL OR expires_at > NOW())
            `, [ip]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error checking blocked IP:', err);
            return null;
        }
    }

// ============= SECURITY: ROBUST IP DETECTION =============
// Helper function to get real client IP (works in production with proxies)
function getClientIP(req) {
    // With trust proxy enabled, req.ip will be the real IP from X-Forwarded-For
    let ip = req.ip;
    
    // Fallback chain for different hosting environments
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
        // Try X-Forwarded-For header (used by most proxies/load balancers)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
            // The first one is the real client IP
            ip = forwarded.split(',')[0].trim();
        }
        
        // Try other common headers
        if (!ip) ip = req.headers['x-real-ip'];
        if (!ip) ip = req.headers['cf-connecting-ip']; // Cloudflare
        if (!ip) ip = req.headers['true-client-ip']; // Akamai/Cloudflare
        if (!ip) ip = req.connection.remoteAddress;
        if (!ip) ip = req.socket.remoteAddress;
    }
    
    // Clean up IPv6 localhost representations
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }
    
    // Remove IPv6 prefix if present (::ffff:192.168.1.1 -> 192.168.1.1)
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    
    return ip || 'unknown';
}

// ============= SECURITY: ACTIVITY LOGGING =============
async function logSubmission(type, req, status, errorMessage = null, token = null, formData = {}) {
    try {
        const ip = getClientIP(req);
        const userAgent = req.headers['user-agent'] || null;
        const email = formData.email || formData.gmail || null;
        const lrn = formData.lrn || null;
        
        await pool.query(`
            INSERT INTO submission_logs (
                submission_type, ip_address, user_agent, email, lrn,
                form_data, status, error_message, request_token
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [type, ip, userAgent, email, lrn, JSON.stringify(formData), status, errorMessage, token]);
    } catch (err) {
        console.error('âŒ Error logging submission:', err.message);
        // Don't throw - logging failure shouldn't block submissions
    }
}

// Check for suspicious activity (multiple submissions from same IP)
async function checkSuspiciousActivity(ip, email, type) {
    try {
        // Check submissions in last hour
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM submission_logs
            WHERE (ip_address = $1 OR email = $2)
            AND submission_type = $3
            AND created_at > NOW() - INTERVAL '1 hour'
        `, [ip, email, type]);
        
        const count = parseInt(result.rows[0].count);
        if (count >= 5) {
            console.warn(`âš ï¸ Suspicious activity detected: ${count} ${type} submissions from IP ${ip} or email ${email} in last hour`);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error checking suspicious activity:', err);
        return false;
    }
}

// ============= SECURITY: VALIDATION & SANITIZATION =============
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePhilippinePhone(phone) {
    // Accepts: 09123456789, +639123456789, 639123456789
    const re = /^(\+63|0)?9\d{9}$/;
    return re.test(String(phone).replace(/[\s\-()]/g, ''));
}

function validateLRN(lrn) {
    // LRN must be exactly 12 digits
    return /^\d{12}$/.test(String(lrn));
}

function sanitizeText(text) {
    if (!text) return '';
    // Remove potentially dangerous characters
    return String(text)
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
        .trim()
        .substring(0, 1000); // Limit length
}

// Check for duplicate enrollment request
async function checkDuplicateEnrollment(email, lrn) {
    const query = `
        SELECT request_token, gmail, lrn, status 
        FROM enrollment_requests 
        WHERE (gmail = $1 OR (lrn = $2 AND lrn IS NOT NULL AND lrn != ''))
        AND status IN ('pending', 'approved')
        ORDER BY created_at DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [email, lrn || null]);
    return result.rows[0] || null;
}

// Check for duplicate document request
async function checkDuplicateDocumentRequest(email) {
    const query = `
        SELECT request_token, email, status 
        FROM document_requests 
        WHERE email = $1 
        AND status IN ('pending', 'processing', 'ready')
        ORDER BY created_at DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
}

// EJS view engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory (for enrollment.html and assets)
app.use(express.static(path.join(__dirname, 'public')));
// Serve static files from the pictures directory
app.use('/pictures', express.static(path.join(__dirname, 'pictures')));
// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static files from the views directory (for role-specific JS/CSS)
app.use('/views', express.static(path.join(__dirname, 'views')));

// Session middleware was moved near the top to ensure availability for all routes.

// --- ROUTES ---

// ========== GUIDANCE ROUTES ==========
// Guidance Login API
app.post('/api/guidance/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('ðŸ” Guidance login attempt:', { username });
    
    try {
        // Check guidance_accounts table for valid credentials
        console.log('ðŸ“‹ Querying guidance_accounts table...');
        const result = await pool.query(
            'SELECT id, fullname, username, password, is_active FROM guidance_accounts WHERE username = $1',
            [username]
        );
        
        console.log('ðŸ“Š Query result:', result.rows.length, 'users found');
        
        const user = result.rows[0];
        
        if (user) {
            console.log('ðŸ‘¤ User found:', user.fullname, '| is_active:', user.is_active);
            
            if (!user.is_active) {
                console.log('âŒ Account is inactive');
                return res.status(401).json({ success: false, error: 'Account is inactive. Please contact administrator.' });
            }
            
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('ðŸ”‘ Password match:', passwordMatch);
            
            if (passwordMatch) {
                req.session.user = {
                    id: user.id,
                    role: 'admin',
                    name: user.fullname
                };
                req.session.guidance_id = user.id; // Set guidance_id for messaging endpoints
                
                // Explicitly save session before responding
                return req.session.save((err) => {
                    if (err) {
                        console.error('âŒ Session save error:', err);
                        return res.status(500).json({ success: false, error: 'Failed to save session' });
                    }
                    console.log('âœ… Login successful! Session saved:', { 
                        user_id: user.id, 
                        guidance_id: user.id,
                        session_id: req.sessionID 
                    });
                    return res.json({ success: true, message: 'Login successful' });
                });
            } else {
                console.log('âŒ Invalid password');
            }
        } else {
            console.log('âŒ User not found with username:', username);
        }
        
        console.log('âŒ Invalid credentials');
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    } catch (err) {
        console.error('ðŸ’¥ Guidance login error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
    }
});

// Guidance Logout
app.get('/guidance/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/guidance/login');
});

// Note: guidance dashboard route is handled by the rendered EJS handler earlier in this file.

// Guidance Behavior Analytics Page
app.get('/guidance/behavior-analytics', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-behavior-analytics.html'));
});

// Guidance Smart Recommendations Page
app.get('/guidance/recommendations', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-recommendations.html'));
});

// Guidance Sent Messages Page
app.get('/guidance/sent-messages', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    // Serve the static sent messages page
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-sent-messages.html'));
});

// Registrar login page route
app.get('/registrarlogin', (req, res) => {
    // Allow force parameter to bypass redirect
    if (req.session.user && !req.query.force) {
        // Redirect to correct landing page based on role
        if (req.session.user.role === 'registrar') {
            return res.redirect('/registrar');
        } else if (req.session.user.role === 'ictcoor') {
            return res.redirect('/ictcoorLanding');
        }
    }
    // Clear session if force parameter is present
    if (req.query.force && req.session.user) {
        return req.session.destroy((err) => {
            if (err) console.error('Session destroy error:', err);
            res.render('registrarlogin', { error: null });
        });
    }
    res.render('registrarlogin', { error: null });
});
// Registrar login POST route
app.post('/registrarlogin', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find user by username and role
        const result = await pool.query(
            'SELECT u.*, ra.registrar_id, ra.office_name FROM users u LEFT JOIN registrar_accounts ra ON u.id = ra.user_id WHERE u.username = $1 AND u.role = $2',
            [username, 'registrar']
        );
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            return res.redirect('/registrar');
        } else {
            return res.render('registrarlogin', { error: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Registrar login error:', err);
        res.render('registrarlogin', { error: 'An error occurred during login.' });
    }
});
// Delete registrar account (POST)
app.post('/delete-registrar-account', async (req, res) => {
    const { id } = req.body;
    console.log('Delete request received with ID:', id);
    
    if (!id) {
        console.error('No ID provided for deletion');
        try {
            const result = await pool.query(
                'SELECT ra.id, u.username, ra.office_name, ra.is_active FROM registrar_accounts ra JOIN users u ON ra.user_id = u.id ORDER BY ra.id'
            );
            return res.render('registraracc', { registrarAccounts: result.rows, error: 'Error: No account ID provided.', success: null });
        } catch (err) {
            return res.render('registraracc', { registrarAccounts: [], error: 'Error: No account ID provided.', success: null });
        }
    }

    try {
        // First get the user_id from registrar_accounts
        const raResult = await pool.query('SELECT user_id FROM registrar_accounts WHERE id = $1', [id]);
        if (raResult.rows.length === 0) {
            throw new Error('Registrar account not found');
        }
        const userId = raResult.rows[0].user_id;
        
        // Delete registrar account record
        await pool.query('DELETE FROM registrar_accounts WHERE id = $1', [id]);
        // Delete user account
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        
        console.log('Deleted registrar account and user');
        res.redirect('/registraracc');
    } catch (err) {
        console.error('Error deleting registrar account:', err);
        try {
            const result = await pool.query(
                'SELECT ra.id, u.username, ra.office_name, ra.is_active FROM registrar_accounts ra JOIN users u ON ra.user_id = u.id ORDER BY ra.id'
            );
            res.render('registraracc', { registrarAccounts: result.rows, error: 'Error deleting account: ' + err.message, success: null });
        } catch (loadErr) {
            res.render('registraracc', { registrarAccounts: [], error: 'Error deleting account: ' + err.message, success: null });
        }
    }
});
// Settings page (Registrar Account Management)


// Registrar & Teacher Account Management page
app.get('/registraracc', async (req, res) => {
    // Only allow access if logged in as ictcoor
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.redirect('/');
    }
    try {
        let registrarAccounts = [];
        try {
            const result = await pool.query(
                'SELECT ra.id, u.username, ra.office_name, ra.registrar_id, ra.is_active FROM registrar_accounts ra JOIN users u ON ra.user_id = u.id ORDER BY ra.id'
            );
            registrarAccounts = result.rows;
        } catch (queryErr) {
            console.warn('Registrar accounts query error (table may not exist yet):', queryErr.message);
            // Table might not exist yet, return empty list
            registrarAccounts = [];
        }
        res.render('registraracc', { registrarAccounts: registrarAccounts, error: null, success: null });
    } catch (err) {
        console.error('Error loading registrar accounts page:', err);
        res.render('registraracc', { registrarAccounts: [], error: 'Error loading accounts.', success: null });
    }
});

// Create registrar account (POST)
app.post('/create-registrar-account', async (req, res) => {
    const { username, password, office_name, registrar_id } = req.body;
    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }
        
        // Check if username already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            throw new Error('Username already exists');
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Create user account
            const userResult = await client.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
                [username, hashedPassword, 'registrar']
            );
            const userId = userResult.rows[0].id;
            
            // Create registrar account
            await client.query(
                'INSERT INTO registrar_accounts (user_id, registrar_id, office_name, is_active) VALUES ($1, $2, $3, $4)',
                [userId, registrar_id || null, office_name || null, true]
            );
            
            await client.query('COMMIT');
            
            console.log('âœ… Registrar account created successfully - Username:', username);
            
            // Reload the list
            let registrarAccounts = [];
            try {
                const result = await pool.query(
                    'SELECT ra.id, u.username, ra.office_name, ra.registrar_id, ra.is_active FROM registrar_accounts ra JOIN users u ON ra.user_id = u.id ORDER BY ra.id'
                );
                registrarAccounts = result.rows;
            } catch (queryErr) {
                console.warn('Query error loading accounts:', queryErr.message);
            }
            res.render('registraracc', { registrarAccounts: registrarAccounts, success: 'Registrar account created successfully!', error: null });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error creating registrar account:', err);
        try {
            const result = await pool.query(
                'SELECT ra.id, u.username, ra.office_name, ra.registrar_id, ra.is_active FROM registrar_accounts ra JOIN users u ON ra.user_id = u.id ORDER BY ra.id'
            );
            res.render('registraracc', { registrarAccounts: result.rows, error: err.message || 'Error creating account. Username may already exist.', success: null });
        } catch (loadErr) {
            res.render('registraracc', { registrarAccounts: [], error: err.message || 'Error creating account.', success: null });
        }
    }
});

// Guidance Account Management page
app.get('/guidanceacc', async (req, res) => {
    // Only allow access if logged in as ictcoor
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.redirect('/');
    }
    try {
        const result = await pool.query('SELECT id, fullname, username, email, contact_number, is_active FROM guidance_accounts ORDER BY id');
        res.render('guidanceacc', { guidanceAccounts: result.rows });
    } catch (err) {
        console.error('Error loading guidance accounts:', err);
        res.render('guidanceacc', { guidanceAccounts: [], error: 'Error loading accounts.' });
    }
});

// Create guidance account (POST)
app.post('/create-guidance-account', async (req, res) => {
    const { fullname, username, password, email, contact_number } = req.body;
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('ðŸ” Creating guidance account:', { fullname, username, email });
        
        await pool.query(
            'INSERT INTO guidance_accounts (fullname, username, password, email, contact_number, is_active) VALUES ($1, $2, $3, $4, $5, true)', 
            [fullname, username, hashedPassword, email || null, contact_number || null]
        );
        
        console.log('âœ… Guidance account created successfully');
        
        // After creation, reload the list and stay on the same page
        const result = await pool.query('SELECT id, fullname, username, email, contact_number, is_active FROM guidance_accounts ORDER BY id');
        res.render('guidanceacc', { guidanceAccounts: result.rows });
    } catch (err) {
        console.error('Error creating guidance account:', err);
        // Optionally, handle duplicate username error
        const result = await pool.query('SELECT id, fullname, username, email, contact_number, is_active FROM guidance_accounts ORDER BY id');
        res.render('guidanceacc', { guidanceAccounts: result.rows, error: 'Error creating account. Username may already exist.' });
    }
});

// Delete guidance account (POST)
app.post('/delete-guidance-account', async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('DELETE FROM guidance_accounts WHERE id = $1', [id]);
        res.redirect('/guidanceacc');
    } catch (err) {
        console.error('Error deleting guidance account:', err);
        const result = await pool.query('SELECT id, fullname, username, email, contact_number, is_active FROM guidance_accounts ORDER BY id');
        res.render('guidanceacc', { guidanceAccounts: result.rows, error: 'Error deleting account.' });
    }
});
// Registrar dashboard route (protected)
app.get('/registrar', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.redirect('/registrarlogin');
    }
    
    try {
        // Fetch all registration records (both old early_registration and new approved enrollment_requests)
        const result = await pool.query(`
            SELECT id, school_year, grade_level, 
                   COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as learner_name,
                   lrn, mother_name, contact_number, registration_date, created_at,
                   NULL as student_id, NULL as username, NULL as account_status, 'early_registration' as record_type, NULL as enrollee_type
            FROM early_registration 
            UNION ALL
            SELECT er.id, er.school_year, er.grade_level,
                   COALESCE(er.last_name, '') || ', ' || COALESCE(er.first_name, '') || ' ' || COALESCE(er.middle_name || '', '') as learner_name,
                   er.lrn, er.mother_name, er.contact_number, er.registration_date, er.created_at,
                   sa.student_id, sa.username, sa.account_status, 'enrollment_request' as record_type, er.enrollee_type
            FROM enrollment_requests er
            LEFT JOIN student_accounts sa ON sa.enrollment_request_id = er.id
            WHERE er.status = 'approved'
            ORDER BY created_at DESC
        `);
        
        // Fetch pending enrollment requests
        const requestsResult = await pool.query(`
            SELECT id, request_token, 
                   COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name || '', '') as learner_name,
                   grade_level, gmail_address, contact_number, registration_date, status,
                   enrollee_type, birth_cert_psa, eccd_checklist, report_card_previous, sf10_original, sf10_optional
            FROM enrollment_requests 
            WHERE status = 'pending'
            ORDER BY registration_date DESC
        `);
        
        // Fetch history of reviewed requests
        const historyResult = await pool.query(`
            SELECT er.id, er.request_token, 
                   COALESCE(er.last_name, '') || ', ' || COALESCE(er.first_name, '') || ' ' || COALESCE(er.middle_name || '', '') as learner_name,
                   er.grade_level, er.gmail_address, er.status, er.reviewed_at, er.rejection_reason,
                   er.enrollee_type, er.birth_cert_psa, er.eccd_checklist, er.report_card_previous, er.sf10_original, er.sf10_optional, er.registration_date,
                   sa.student_id, sa.username, sa.account_status
            FROM enrollment_requests er
            LEFT JOIN student_accounts sa ON sa.enrollment_request_id = er.id
            WHERE er.status IN ('approved', 'rejected')
            ORDER BY er.reviewed_at DESC
        `);
        
        // Calculate metrics for insights
        const totalRequests = requestsResult.rows.length;
        const approvedCount = requestsResult.rows.filter(r => r.status === 'approved').length;
        const rejectedCount = requestsResult.rows.filter(r => r.status === 'rejected').length;
        const pendingCount = requestsResult.rows.filter(r => r.status === 'pending').length;
        
        // Count today's requests
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRequests = requestsResult.rows.filter(r => {
            const requestDate = new Date(r.date_submitted);
            requestDate.setHours(0, 0, 0, 0);
            return requestDate.getTime() === today.getTime();
        }).length;
        
        res.render('registrarDashboard', { 
            registrations: result.rows,
            requests: requestsResult.rows,
            history: historyResult.rows,
            // Insights metrics
            totalRequests: totalRequests,
            approvedCount: approvedCount,
            rejectedCount: rejectedCount,
            pendingCount: pendingCount,
            todayRequests: todayRequests
        });
    } catch (err) {
        console.error('Error fetching registrations:', err);
        res.render('registrarDashboard', { 
            registrations: [],
            requests: [],
            history: [],
            totalRequests: 0,
            approvedCount: 0,
            rejectedCount: 0,
            pendingCount: 0,
            todayRequests: 0
        });
    }
});

// API endpoint for early registrations (for chart data)
app.get('/api/early-registrations', async (req, res) => {
    try {
        // Fetch approved enrollees from both old early_registration table and new enrollment_requests table
        const result = await pool.query(`
            -- From enrollment_requests (approved online enrollments)
            SELECT 
                id, 
                school_year, 
                grade_level, 
                last_name || ', ' || first_name || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as learner_name,
                lrn, 
                current_address, 
                contact_number, 
                registration_date, 
                created_at,
                status
            FROM enrollment_requests 
            WHERE status = 'approved'
            
            UNION ALL
            
            -- From early_registration (paper forms)
            SELECT 
                id, 
                school_year, 
                grade_level, 
                last_name || ', ' || first_name || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as learner_name,
                lrn, 
                current_address, 
                contact_number, 
                registration_date, 
                created_at,
                'approved' as status
            FROM early_registration 
            
            ORDER BY created_at DESC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching early registrations:', err);
        res.status(500).json({ error: 'Failed to fetch early registrations' });
    }
});

// Handle early registration form submission
app.post('/add-registration', upload.any(), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const {
        gmail, schoolYear, lrn, gradeLevel, lastName, givenName, middleName, extName,
        birthday, age, sex, religion, barangay, barangayOther, municipality, province,
        ipCommunity, ipCommunitySpecify, pwd, pwdSpecify,
        fatherLastName, fatherGivenName, fatherMiddleName, fatherExtName,
        motherLastName, motherGivenName, motherMiddleName, motherExtName,
        guardianLastName, guardianGivenName, guardianMiddleName, guardianExtName,
        contactNumber, dateSigned, signaturePrintedName, signatureData, enrolleeType
    } = req.body;

    try {
        let signatureImagePath = null;
        
        // Handle signature - look for signatureImage in files
        if (req.files && req.files.length > 0) {
            const signatureFile = req.files.find(f => f.fieldname === 'signatureImage');
            if (signatureFile) {
                // Convert uploaded file to base64
                const fileBuffer = fs.readFileSync(signatureFile.path);
                const base64Data = fileBuffer.toString('base64');
                const mimeType = signatureFile.mimetype || 'image/png';
                signatureImagePath = `data:${mimeType};base64,${base64Data}`;
                // Clean up temp file
                fs.unlinkSync(signatureFile.path);
            }
            // Clean up any other temp files that were uploaded
            req.files.forEach(f => {
                if (f.fieldname !== 'signatureImage' && fs.existsSync(f.path)) {
                    fs.unlinkSync(f.path);
                }
            });
        } else if (signatureData) {
            // Handle canvas signature data (already base64 data URL)
            signatureImagePath = signatureData;
        }

        // Build complete names for parents/guardians
        const fatherName = [fatherGivenName, fatherLastName].filter(n => n && String(n).trim()).join(' ') || null;
        const motherName = [motherGivenName, motherLastName].filter(n => n && String(n).trim()).join(' ') || null;
        const guardianName = [guardianGivenName, guardianLastName].filter(n => n && String(n).trim()).join(' ') || null;

        // Build current address from barangay components
        const currentAddress = [
            barangayOther && barangay === 'Others' ? barangayOther : barangay,
            municipality,
            province
        ].filter(a => a && String(a).trim()).join(', ') || 'N/A';

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert into NEW enrollment_requests table with automatic approval status
            // This allows registrar to manually enter students from office registrations
            // and they appear immediately in the system without needing approval/rejection
            const insertQuery = `
                INSERT INTO enrollment_requests (
                    gmail_address, school_year, lrn, grade_level, last_name, first_name, 
                    middle_name, ext_name, birthday, age, sex, religion, current_address,
                    ip_community, ip_community_specify, pwd, pwd_specify, father_name, 
                    mother_name, guardian_name, contact_number, registration_date, 
                    printed_name, signature_image_path, enrollee_type, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10::integer, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::date, $23, $24, $25, $26, CURRENT_TIMESTAMP)
                RETURNING id
            `;

            const values = [
                gmail, schoolYear, lrn || null, gradeLevel, lastName, givenName,
                middleName || null, extName || null, birthday, parseInt(age), sex,
                religion || null, currentAddress, ipCommunity, ipCommunitySpecify || null,
                pwd, pwdSpecify || null, fatherName, motherName,
                guardianName, contactNumber || null, dateSigned, signaturePrintedName, signatureImagePath,
                enrolleeType || null, 'approved'  // Automatically set status to 'approved' for office registrations
            ];

            const result = await client.query(insertQuery, values);
            const enrollmentRequestId = result.rows[0].id;

            // Create student account for office registration
            const sequenceResult = await client.query('SELECT nextval(\'student_id_seq\') as next_id');
            const nextSequenceNumber = sequenceResult.rows[0].next_id;

            // Format: 2025-00001 (year - padded sequence number)
            const currentYear = new Date().getFullYear();
            const studentId = `${currentYear}-${String(nextSequenceNumber).padStart(5, '0')}`;
            const username = studentId; // username is the same as student_id
            const initialPassword = studentId; // initial password is the same as student_id

            // Hash the password
            const hashedPassword = await bcrypt.hash(initialPassword, 10);

            // Create student account
            const accountResult = await client.query(
                `INSERT INTO student_accounts (student_id, username, password_hash, email, enrollment_request_id, account_status)
                 VALUES ($1, $2, $3, $4, $5, 'active')
                 RETURNING id, student_id, username, email`,
                [studentId, username, hashedPassword, gmail, enrollmentRequestId]
            );

            await client.query('COMMIT');
            const studentAccount = accountResult.rows[0];

            console.log('Office Registration Created:');
            console.log(`   - Enrollment Request ID: ${enrollmentRequestId}`);
            console.log(`   - Student ID: ${studentAccount.student_id}`);
            console.log(`   - Username: ${studentAccount.username}`);
            console.log(`   - Email: ${studentAccount.email}`);
            
            // Return success response
            res.json({ 
                success: true, 
                message: 'Registration added successfully! Student account created and student can now login.',
                id: enrollmentRequestId,
                studentAccount: {
                    studentId: studentAccount.student_id,
                    username: studentAccount.username,
                    initialPassword: initialPassword
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('âŒ Error adding registration:', err);
        console.error('Error message:', err.message);
        console.error('Error details:', err);
        console.error('SQL Error Code:', err.code);
        console.error('SQL Error Constraint:', err.constraint);
        
        // Check if it's a missing column error
        if (err.message && err.message.includes('column')) {
            console.error('âš ï¸ MISSING COLUMN ERROR - Check if database initialization completed');
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Error adding registration: ' + err.message,
            error: err.message,
            code: err.code
        });
    }
});

// ============= GET ALL STUDENT ACCOUNTS (for Registrar) =============
app.get('/api/student-accounts', async (req, res) => {
    // Verify registrar is authenticated
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                sa.id,
                sa.student_id,
                sa.username,
                sa.password_hash,
                sa.email,
                sa.account_status,
                sa.created_at,
                er.first_name,
                er.last_name,
                er.gmail_address
            FROM student_accounts sa
            LEFT JOIN enrollment_requests er ON sa.enrollment_request_id = er.id
            ORDER BY sa.created_at DESC
        `);

        res.json({
            success: true,
            accounts: result.rows
        });
    } catch (err) {
        console.error('Error fetching student accounts:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch student accounts' });
    }
});

// ============= UPDATE STUDENT ACCOUNT =============
app.put('/api/student-accounts/:accountId', async (req, res) => {
    // Verify registrar is authenticated
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { accountId } = req.params;
    const { email, account_status, reset_password } = req.body;

    try {
        // Validate email if provided
        if (email && !email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Invalid email address' });
        }

        // Build dynamic update query
        let updateQuery = 'UPDATE student_accounts SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        let paramCount = 1;

        if (email) {
            updateQuery += `, email = $${paramCount}`;
            params.push(email);
            paramCount++;
        }

        if (account_status) {
            updateQuery += `, account_status = $${paramCount}`;
            params.push(account_status);
            paramCount++;
        }

        // If reset_password is true, generate new password
        if (reset_password) {
            const newPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateQuery += `, password_hash = $${paramCount}`;
            params.push(hashedPassword);
            paramCount++;
        }

        updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
        params.push(parseInt(accountId));

        const result = await pool.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student account not found' });
        }

        res.json({
            success: true,
            message: 'Student account updated successfully',
            account: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating student account:', err);
        res.status(500).json({ success: false, error: 'Failed to update student account' });
    }
});

// ============= DELETE STUDENT ACCOUNT ENDPOINT (for Registrar) =============
app.delete('/api/student-accounts/:accountId', async (req, res) => {
    // Verify registrar is authenticated
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { accountId } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get student account details before deletion
        const accountResult = await client.query(
            'SELECT id, username, email FROM student_accounts WHERE id = $1',
            [parseInt(accountId)]
        );

        if (accountResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Student account not found' });
        }

        const account = accountResult.rows[0];

        // Delete from student_accounts
        await client.query('DELETE FROM student_accounts WHERE id = $1', [parseInt(accountId)]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Student account "${account.username}" has been permanently deleted from the database.`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting student account:', err);
        res.status(500).json({ success: false, error: 'Failed to delete student account: ' + err.message });
    } finally {
        client.release();
    }
});


// ============= GET NEXT STUDENT ID (for display in modal) =============
app.get('/api/next-student-id', async (req, res) => {
    // Verify registrar is authenticated
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Count existing student accounts to determine next ID
        const countResult = await pool.query("SELECT COUNT(*) as count FROM student_accounts");
        const nextId = (countResult.rows[0].count || 0) + 1;
        
        // Format: 2025-00001 (year - padded sequence number)
        const currentYear = new Date().getFullYear();
        const studentId = `${currentYear}-${String(nextId).padStart(5, '0')}`;
        
        console.log(`📊 Next Student ID: ${studentId} (sequence: ${nextId})`);
        
        res.json({ 
            success: true, 
            studentId: studentId,
            sequenceNumber: nextId
        });
    } catch (err) {
        console.error('Error getting next student ID:', err);
        res.status(500).json({ success: false, error: 'Failed to get next student ID: ' + err.message });
    }
});

// ============= STUDENT ACCOUNT CREATION ENDPOINT (for Registrar) =============
app.post('/api/create-student-account', async (req, res) => {
    // Verify registrar is authenticated
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(401).json({ success: false, error: 'Unauthorized. Only registrars can create student accounts.' });
    }

    const { enrollmentRequestId } = req.body;

    if (!enrollmentRequestId) {
        return res.status(400).json({ success: false, error: 'Enrollment request ID is required.' });
    }

    try {
        // Get enrollment request details
        const enrollmentResult = await pool.query(
            'SELECT id, first_name, last_name, gmail_address FROM enrollment_requests WHERE id = $1',
            [enrollmentRequestId]
        );

        if (enrollmentResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Enrollment request not found.' });
        }

        const enrollment = enrollmentResult.rows[0];

        // Get the next student ID from sequence
        const sequenceResult = await pool.query('SELECT nextval(\'student_id_seq\') as next_id');
        const nextSequenceNumber = sequenceResult.rows[0].next_id;

        // Format: 2025-00001 (year - padded sequence number)
        const currentYear = new Date().getFullYear();
        const studentId = `${currentYear}-${String(nextSequenceNumber).padStart(5, '0')}`;
        const username = studentId; // username is the same as student_id
        const initialPassword = studentId; // initial password is the same as student_id

        // Hash the password
        const hashedPassword = await bcrypt.hash(initialPassword, 10);

        // Create student account
        const insertResult = await pool.query(
            `INSERT INTO student_accounts (student_id, username, password_hash, email, enrollment_request_id, account_status)
             VALUES ($1, $2, $3, $4, $5, 'active')
             RETURNING id, student_id, username, email`,
            [studentId, username, hashedPassword, enrollment.gmail_address, enrollmentRequestId]
        );

        const studentAccount = insertResult.rows[0];

        // Update enrollment request status to 'approved' and set reviewed_at timestamp
        const approveResult = await pool.query(
            `UPDATE enrollment_requests 
             SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP 
             WHERE id = $1
             RETURNING status`,
            [enrollmentRequestId]
        );

        console.log('✅ Student account created:');
        console.log(`   - Student ID: ${studentAccount.student_id}`);
        console.log(`   - Username: ${studentAccount.username}`);
        console.log(`   - Email: ${studentAccount.email}`);
        console.log(`   - Enrollment Request ID: ${enrollmentRequestId}`);
        console.log(`✅ Enrollment request status updated to: ${approveResult.rows[0].status}`);

        // Send success response with generated credentials
        res.json({
            success: true,
            message: 'Student account created successfully!',
            account: {
                studentId: studentAccount.student_id,
                username: studentAccount.username,
                initialPassword: initialPassword, // Return the initial password for the registrar to share
                email: studentAccount.email,
                studentName: `${enrollment.first_name} ${enrollment.last_name}`
            }
        });

    } catch (err) {
        console.error('Error creating student account:', err);
        res.status(500).json({ success: false, error: 'Failed to create student account. ' + err.message });
    }
});

// ============= STUDENT LOGIN ENDPOINT =============
app.post('/api/student/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    try {
        // Query student_accounts table instead of enrollment_requests
        const result = await pool.query(
            'SELECT id, student_id, username, password_hash, email, enrollment_request_id, account_status FROM student_accounts WHERE username = $1 AND account_status = $2',
            [username, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid username or password.' });
        }

        const student = result.rows[0];

        // Compare password with hash
        const isPasswordValid = await bcrypt.compare(password, student.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Invalid username or password.' });
        }

        // Set session for logged-in student
        req.session.user = {
            id: student.id,
            studentId: student.student_id,
            username: student.username,
            email: student.email,
            role: 'student',
            enrollmentRequestId: student.enrollment_request_id
        };

        // Handle remember me checkbox
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }

        console.log(`✅ Student logged in: ${student.username}`);

        res.json({
            success: true,
            message: 'Login successful!',
            studentId: student.student_id,
            enrollmentRequestId: student.enrollment_request_id,
            redirect: '/student-dashboard'
        });

    } catch (err) {
        console.error('Error during student login:', err);
        res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
});

// Public landing for status check without token
app.get('/check-status', (req, res) => {
    res.redirect('/check-status.html');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

// Dedicated login page route (avoid conflict with static index.html)
app.get('/login', (req, res) => {
    // Allow force parameter to bypass redirect
    if (req.session.user && !req.query.force) {
        // Redirect to correct landing page based on role
        if (req.session.user.role === 'ictcoor') {
            return res.redirect('/ictcoorLanding');
        } else if (req.session.user.role === 'registrar') {
            return res.redirect('/registrar');
        }
    }
    // Clear session if force parameter is present
    if (req.query.force && req.session.user) {
        return req.session.destroy((err) => {
            if (err) console.error('Session destroy error:', err);
            res.render('login', { error: null });
        });
    }
    res.render('login', { error: null });
});

// Teacher login page route
app.get('/teacher-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'teacher', 'teacher-login.html'));
});

// Student login page route
app.get('/student-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', 'Studentlogin.html'));
});

// Student dashboard page route (protected)
app.get('/student-dashboard', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.redirect('/student-login');
    }
    res.sendFile(path.join(__dirname, 'student', 'StudentDashboard.html'));
});

// Teacher dashboard page (HTML)
app.get('/teacher', (req, res) => {
    console.log('=== /teacher route accessed ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    console.log('Session user:', req.session.user);
    console.log('Cookies:', req.headers.cookie);
    
    if (!req.session.user || req.session.user.role !== 'teacher') {
        console.log('âŒ No valid session - redirecting to login');
        return res.redirect('/teacher-login');
    }
    
    console.log('âœ… Valid session found - serving dashboard');
    res.sendFile(path.join(__dirname, 'views', 'teacher', 'teacher-demographics.html'));
});

// Teacher logout
app.get('/logout-teacher', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Teacher logout error:', err);
            return res.redirect('/teacher');
        }
        res.clearCookie('connect.sid');
        res.redirect('/teacher-login');
    });
});

// Login page route
app.get('/', (req, res) => {
    // 3. If a session exists, redirect to the landing page
    if (req.session.user) {
        // Redirect to correct landing page based on role
        if (req.session.user.role === 'ictcoor') {
            return res.redirect('/ictcoorLanding');
        } else if (req.session.user.role === 'registrar') {
            return res.redirect('/registrar');
        }
    }
    res.render('login', { error: null });
});

// Route to view registration details by ID
app.get('/registration/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).send('Access denied');
    }
    const regId = req.params.id;
    console.log('GET /registration/:id ->', regId);
    try {
        // First try to find in early_registration (paper forms)
        const earlyRegResult = await pool.query('SELECT * FROM early_registration WHERE id = $1', [regId]);
        if (earlyRegResult.rows.length > 0) {
            return res.render('registrationView', { 
                registration: earlyRegResult.rows[0], 
                source: 'early_registration',
                documents: null
            });
        }
        
        // If not found, try enrollment_requests (online forms) with document data
        const enrollmentResult = await pool.query(`
            SELECT er.*, sa.student_id, sa.username, sa.account_status
            FROM enrollment_requests er
            LEFT JOIN student_accounts sa ON sa.enrollment_request_id = er.id
            WHERE er.id = $1
        `, [regId]);
        
        if (enrollmentResult.rows.length > 0) {
            // Extract document data for viewing
            const documents = {
                birth_cert_psa: enrollmentResult.rows[0].birth_cert_psa,
                eccd_checklist: enrollmentResult.rows[0].eccd_checklist,
                report_card_previous: enrollmentResult.rows[0].report_card_previous,
                sf10_original: enrollmentResult.rows[0].sf10_original,
                sf10_optional: enrollmentResult.rows[0].sf10_optional
            };
            return res.render('registrationView', { 
                registration: enrollmentResult.rows[0], 
                source: 'enrollment_requests',
                documents: documents
            });
        }
        
        // Not found in either table
        return res.status(404).send('Registration not found');
    } catch (err) {
        console.error('Error fetching registration:', err);
        res.status(500).send('Error fetching registration');
    }
});

// Render edit form for registration
app.get('/registration/:id/edit', async (req, res) => {
    const regId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM early_registration WHERE id = $1', [regId]);
        if (result.rows.length === 0) {
            return res.status(404).send('Registration not found');
        }
        res.render('registrationEdit', { registration: result.rows[0] });
    } catch (err) {
        console.error('Error fetching registration for edit:', err);
        res.status(500).send('Error fetching registration for edit');
    }
});

// Update registration (Edit)
app.post('/registration/:id/edit', upload.single('signatureImage'), async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).send('Access denied');
    }
    const regId = req.params.id;
    const body = req.body || {};
    const {
        printedName, gmail, schoolYear, lrn, gradeLevel,
        lastName, givenName, middleName, extName,
        birthday, age, sex, religion, address,
        ipCommunity, ipCommunitySpecify, pwd, pwdSpecify, fatherName, motherName, guardianName,
        contactNumber, date, signatureData
    } = body;
    try {
        // Determine if signature is being replaced - store as base64
        let newSignaturePath = null;
        if (req.file) {
            // Convert uploaded file to base64
            const fileBuffer = fs.readFileSync(req.file.path);
            const base64Data = fileBuffer.toString('base64');
            const mimeType = req.file.mimetype || 'image/png';
            newSignaturePath = `data:${mimeType};base64,${base64Data}`;
            // Clean up temp file
            fs.unlinkSync(req.file.path);
        } else if (signatureData) {
            // Handle canvas signature data (already base64 data URL)
            newSignaturePath = signatureData;
        }

        // Check if it's in early_registration or enrollment_requests
        let isEarlyRegistration = true;
        let checkResult = await pool.query('SELECT id FROM early_registration WHERE id = $1', [regId]);
        
        if (checkResult.rows.length === 0) {
            // It's in enrollment_requests
            isEarlyRegistration = false;
        }

        const updateQuery = `
            UPDATE ${isEarlyRegistration ? 'early_registration' : 'enrollment_requests'} SET
                printed_name = $1,
                gmail_address = $2,
                school_year = $3,
                lrn = $4,
                grade_level = $5,
                last_name = $6,
                first_name = $7,
                middle_name = $8,
                ext_name = $9,
                birthday = $10,
                age = $11,
                sex = $12,
                religion = $13,
                current_address = $14,
                ip_community = $15,
                ip_community_specify = $16,
                pwd = $17,
                pwd_specify = $18,
                father_name = $19,
                mother_name = $20,
                guardian_name = $21,
                contact_number = $22,
                registration_date = $23,
                signature_image_path = COALESCE($24, signature_image_path),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $25
        `;

        await pool.query(updateQuery, [
            printedName, gmail, schoolYear, lrn || null, gradeLevel,
            lastName, givenName, middleName || null, extName || null,
            birthday, age, sex, religion || null, address,
            ipCommunity, ipCommunitySpecify || null, pwd, pwdSpecify || null, fatherName || null, motherName || null, guardianName || null,
            contactNumber || null, date, newSignaturePath, regId
        ]);

        res.redirect(`/registration/${regId}`);
    } catch (err) {
        console.error('Error updating registration:', err);
        res.status(500).send('Error updating registration.');
    }
});

// Delete registration
app.post('/registration/:id/delete', async (req, res) => {
    // Allow both registrar and ictcoor to delete registrations
    if (!req.session.user || (req.session.user.role !== 'registrar' && req.session.user.role !== 'ictcoor')) {
        return res.status(403).send('Access denied');
    }
    const regId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if it's in early_registration first
        let isEarlyRegistration = true;
        let result = await client.query('SELECT signature_image_path FROM early_registration WHERE id = $1', [regId]);
        
        if (result.rows.length === 0) {
            // Try enrollment_requests
            isEarlyRegistration = false;
            result = await client.query('SELECT signature_image_path FROM enrollment_requests WHERE id = $1', [regId]);
        }
        
        // Delete signature image if it exists
        if (result.rows.length > 0 && result.rows[0].signature_image_path) {
            let imagePath = result.rows[0].signature_image_path;
            // Try as absolute path
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Deleted signature image (absolute path):', imagePath);
            }
            // Try as relative to project root
            else if (fs.existsSync(path.join(__dirname, imagePath))) {
                fs.unlinkSync(path.join(__dirname, imagePath));
                console.log('Deleted signature image (relative to root):', path.join(__dirname, imagePath));
            }
            // Try as uploads/signatures/<filename>
            else {
                const altPath = path.join(__dirname, 'uploads', 'signatures', path.basename(imagePath));
                if (fs.existsSync(altPath)) {
                    fs.unlinkSync(altPath);
                    console.log('Deleted signature image (uploads/signatures):', altPath);
                } else {
                    console.log('Signature image not found at:', imagePath, 'or', altPath);
                }
            }
        }
        
        if (isEarlyRegistration) {
            // Delete from students table first (if exists) to avoid foreign key constraint
            await client.query('DELETE FROM students WHERE enrollment_id = $1', [regId]);
            // Delete the registration record
            await client.query('DELETE FROM early_registration WHERE id = $1', [regId]);
        } else {
            // Delete from student_accounts if it exists
            await client.query('DELETE FROM student_accounts WHERE enrollment_request_id = $1', [regId]);
            // Delete from enrollment_requests
            await client.query('DELETE FROM enrollment_requests WHERE id = $1', [regId]);
        }
        
        await client.query('COMMIT');
        
        // Redirect based on user role
        if (req.session.user.role === 'registrar') {
            res.redirect('/registrar');
        } else {
            res.redirect('/ictcoorLanding');
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting registration:', err);
        res.status(500).json({ success: false, message: 'Error deleting registration.' });
    } finally {
        client.release();
    }
});

// JSON API: fetch registration details
app.get('/api/registration/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const regId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM early_registration WHERE id = $1', [regId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching registration (API):', err);
        res.status(500).json({ error: 'Error fetching registration' });
    }
});

// JSON API: fetch a pending enrollment request (for editing missing details)
// Student API: Get student's own dashboard data
app.get('/api/student/dashboard', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(403).json({ error: 'You are not authenticated. Please log in again.' });
    }

    const enrollmentRequestId = req.session.user.enrollmentRequestId;
    
    if (!enrollmentRequestId) {
        return res.status(404).json({ error: 'No enrollment request ID found in session.' });
    }

    try {
        const result = await pool.query(`
            SELECT id, request_token, status,
                   gmail_address, school_year, lrn, grade_level,
                   last_name, first_name, middle_name, ext_name,
                   birthday, age, sex, religion, current_address,
                   ip_community, ip_community_specify, pwd, pwd_specify,
                   father_name, mother_name, guardian_name, contact_number,
                   registration_date, printed_name, signature_image_path,
                   enrollee_type, birth_cert_psa, eccd_checklist, report_card_previous, sf10_original, sf10_optional,
                   created_at
            FROM enrollment_requests
            WHERE id = $1
        `, [enrollmentRequestId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment request not found.' });
        }
        
        res.json({ success: true, enrollment: result.rows[0] });
    } catch (err) {
        console.error('Error fetching student dashboard data:', err);
        res.status(500).json({ error: 'Error loading dashboard data' });
    }
});

// ============= STUDENT CHANGE PASSWORD ENDPOINT =============
app.post('/api/student/change-password', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'You are not authenticated. Please log in again.' });
    }

    const { currentPassword, newPassword } = req.body;
    const studentId = req.session.user.studentId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new passwords are required.' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, error: 'New password must be different from current password.' });
    }

    // Validate new password requirements
    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Password must be at least 8 characters long and contain at least one number.' 
        });
    }

    try {
        // Fetch the student account to verify current password
        const studentResult = await pool.query(
            'SELECT id, password_hash FROM student_accounts WHERE student_id = $1',
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student account not found.' });
        }

        const student = studentResult.rows[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, student.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
        }

        // Hash the new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await pool.query(
            'UPDATE student_accounts SET password_hash = $1, updated_at = NOW() WHERE student_id = $2',
            [newPasswordHash, studentId]
        );

        console.log(`✅ Password changed successfully for student: ${studentId}`);

        res.json({
            success: true,
            message: 'Password changed successfully! Please log in again with your new password.'
        });

    } catch (err) {
        console.error('Error changing student password:', err);
        res.status(500).json({ success: false, error: 'Failed to change password. Please try again.' });
    }
});

app.get('/api/enrollment-request/:id', async (req, res) => {
    // Allow registrars to view any enrollment request, or students to view their own
    const requestId = req.params.id;
    
    console.log('📋 GET /api/enrollment-request/:id');
    console.log('  Session user:', req.session.user);
    console.log('  Requested ID:', requestId);
    
    // Check if user is authenticated
    if (!req.session.user) {
        console.log('  ❌ No session user found');
        return res.status(403).json({ error: 'You are not authenticated. Please log in again.' });
    }
    
    const isRegistrar = req.session.user.role === 'registrar';
    const isStudent = req.session.user.role === 'student';
    
    // If student, verify they're accessing their own enrollment request
    if (isStudent) {
        const studentEnrollmentId = req.session.user.enrollmentRequestId;
        const requestIdNum = parseInt(requestId);
        
        console.log('  Student enrollment ID from session:', studentEnrollmentId);
        console.log('  Requested enrollment ID:', requestIdNum);
        
        // If student doesn't have enrollmentRequestId in session, deny
        if (!studentEnrollmentId) {
            console.log('  ❌ Student has no enrollmentRequestId in session');
            return res.status(403).json({ error: 'Your enrollment ID is not set in the system. Please contact support.' });
        }
        
        // Check if student is accessing their own record
        if (studentEnrollmentId !== requestIdNum) {
            console.log('  ❌ Student trying to access different enrollment record');
            return res.status(403).json({ error: 'Access denied - you can only view your own enrollment' });
        }
        
        console.log('  ✅ Student accessing their own enrollment');
    } else if (!isRegistrar) {
        console.log('  ❌ User is neither student nor registrar');
        return res.status(403).json({ error: 'Access denied' });
    } else {
        console.log('  ✅ Registrar accessing enrollment');
    }
    
    try {
        const result = await pool.query(`
            SELECT id, request_token, status,
                   gmail_address, school_year, lrn, grade_level,
                   last_name, first_name, middle_name, ext_name,
                   birthday, age, sex, religion, current_address,
                   ip_community, ip_community_specify, pwd, pwd_specify,
                   father_name, mother_name, guardian_name, contact_number,
                   registration_date, printed_name, signature_image_path,
                   enrollee_type, birth_cert_psa, eccd_checklist, report_card_previous, sf10_original, sf10_optional,
                   created_at
            FROM enrollment_requests
            WHERE id = $1
        `, [requestId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json({ success: true, request: result.rows[0], enrollment: result.rows[0] });
    } catch (err) {
        console.error('Error fetching enrollment request:', err);
        res.status(500).json({ success: false, error: 'Error fetching enrollment request' });
    }
});

// JSON API: update minimal fields on a pending enrollment request
app.post('/update-request/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const requestId = req.params.id;
    const { father_name, mother_name, guardian_name, contact_number, current_address, religion, ip_community, ip_community_specify, pwd, pwd_specify } = req.body || {};

    try {
        // Ensure request exists and is pending
        const check = await pool.query('SELECT status FROM enrollment_requests WHERE id = $1', [requestId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (check.rows[0].status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending requests can be updated' });
        }

        // Build dynamic update
        const fields = [];
        const values = [];
        let idx = 1;
        function add(field, value) {
            if (typeof value !== 'undefined') {
                fields.push(`${field} = $${idx++}`);
                values.push(value === '' ? null : value);
            }
        }
        add('father_name', father_name);
        add('mother_name', mother_name);
        add('guardian_name', guardian_name);
        add('contact_number', contact_number);
        add('current_address', current_address);
        add('religion', religion);
        add('ip_community', ip_community);
        // Only keep specify fields if the flag is 'Yes'
        add('ip_community_specify', ip_community === 'Yes' ? ip_community_specify : null);
        add('pwd', pwd);
        add('pwd_specify', pwd === 'Yes' ? pwd_specify : null);

        if (fields.length === 0) {
            return res.json({ success: true, message: 'No changes provided' });
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        const query = `UPDATE enrollment_requests SET ${fields.join(', ')} WHERE id = $${idx}`;
        values.push(requestId);

        await pool.query(query, values);
        res.json({ success: true, message: 'Request updated successfully' });
    } catch (err) {
        console.error('Error updating enrollment request:', err);
        res.status(500).json({ success: false, message: 'Error updating request: ' + err.message });
    }
});

// Login POST route
app.post('/login', async (req, res) => {
    // Defensive check: ensure req.body exists and has required fields
    if (!req.body || typeof req.body !== 'object') {
        console.error('Error: req.body is undefined or not an object. Content-Type:', req.get('content-type'));
        return res.status(400).json({ success: false, message: 'Request body is empty or malformed' });
    }

    const { username, password } = req.body;

    // Validate that username and password are provided
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            // 4. Store user info in the session
            req.session.user = { id: user.id, role: user.role };
            // Redirect based on role
            if (user.role === 'ictcoor') {
                return res.redirect('/ictcoorLanding');
            } else if (user.role === 'registrar') {
                return res.redirect('/registrar');
            } else {
                return res.redirect('/');
            }
        } else {
            return res.render('login', { error: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred during login.' });
    }
});

// RBAC landing page route
app.get('/ictcoorLanding', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.redirect('/login');
    }
    
    try {
        console.log('ðŸ“‹ Fetching students for ICT Coordinator...');
        
        // Fetch officially enrolled students from students table (joined with sections)
        let studentsResult = { rows: [] };
        try {
            studentsResult = await pool.query(`
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
                LEFT JOIN sections sec ON st.section_id = sec.id
                WHERE st.enrollment_status = 'active' 
                    AND (st.is_archived IS NULL OR st.is_archived = false)
                ORDER BY st.last_name, st.first_name
            `);
            console.log(`âœ… Found ${studentsResult.rows.length} enrolled students`);
        } catch (studentErr) {
            console.error('âš ï¸  Error fetching students:', studentErr.message);
        }

        // Fetch pending enrollees from early_registration
        let enrolleesResult = { rows: [] };
        try {
            enrolleesResult = await pool.query(`
                SELECT 
                    'ER' || er.id::text as id,
                    er.id::text as enrollment_id,
                    (er.last_name || ', ' || er.first_name) as full_name,
                    er.lrn,
                    er.grade_level,
                    COALESCE(er.sex, 'N/A') as sex,
                    COALESCE(er.age, 0) as age,
                    COALESCE(er.contact_number, '') as contact_number,
                    NULL as assigned_section,
                    er.school_year,
                    er.created_at as enrollment_date,
                    'pending' as enrollment_status
                FROM early_registration er
                ORDER BY er.last_name, er.first_name
            `);
            console.log(`âœ… Found ${enrolleesResult.rows.length} pending enrollees`);
        } catch (enrolleeErr) {
            console.error('âš ï¸  Error fetching pending enrollees:', enrolleeErr.message);
        }

        // Combine both lists: officially enrolled students first, then pending enrollees
        const allStudents = [...studentsResult.rows, ...enrolleesResult.rows];
        
        console.log(`âœ… Total: ${allStudents.length} students (${studentsResult.rows.length} enrolled + ${enrolleesResult.rows.length} pending)`);
        
        // Debug: log the data being sent to template
        if (allStudents.length > 0) {
            console.log('ðŸ“¤ Sending to template:');
            allStudents.forEach((s, i) => {
                console.log(`   [${i}] ${s.full_name || 'Unknown'} (${s.enrollment_status || 'unknown status'})`);
            });
        } else {
            console.log('âš ï¸  WARNING: No students to display!');
        }

        res.render('ictcoorLanding', { students: allStudents });
    } catch (err) {
        console.error('âŒ CRITICAL ERROR in ictcoorLanding:', err.message);
        console.error('Stack:', err.stack);
        res.render('ictcoorLanding', { students: [] });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    // 6. Destroy the session
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/registrarlogin');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/registrarlogin');
    });
});

// Logout for registrar: go to registrar login
app.get('/logout-registrar', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/registrarlogin');
        }
        res.clearCookie('connect.sid');
        res.redirect('/registrarlogin');
    });
});

// Logout for ictcoor: go to main login page
app.get('/logout-ictcoor', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/login');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ===== PUBLIC ENROLLMENT ROUTES =====

// Generate unique token
function generateToken() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let token = '';
    for (let i = 0; i < 12; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 11) token += '-'; // Add dash every 4 chars
    }
    return token;
}

// Public enrollment submission
app.post('/submit-enrollment', enrollmentLimiter, upload.any(), async (req, res) => {
    const {
        gmail, schoolYear, lrn, gradeLevel, lastName, givenName, middleName, extName,
        birthday, age, sex, religion, address, ipCommunity, ipCommunitySpecify,
        pwd, pwdSpecify, fatherName, motherName, guardianName, contactNumber, date,
        signatureData, printedName, honeypot, enrolleeType
    } = req.body;

    // Debug logging for enrollee type
    console.log('📝 Enrollment submission received:');
    console.log('  - Enrollee Type:', enrolleeType);
    console.log('  - Files uploaded:', req.files ? req.files.length : 0, req.files?.map(f => f.fieldname).join(', ') || 'none');
    console.log('  - Student:', `${givenName} ${lastName}`);

    // Note: Rate limiting is handled by enrollmentLimiter middleware (3 requests per hour per IP)

    // Build current_address from provided parts if 'address' is not present
    const currentAddress = (address && address.trim()) || [
        req.body.houseNo,
        req.body.sitioStreet,
        req.body.barangay,
        req.body.municipality,
        req.body.province,
        req.body.country,
        req.body.zipCode
    ].filter(Boolean).join(', ');

    // Compose parent/guardian names if not provided in single field
    const fatherNameFinal = (fatherName && fatherName.trim()) || [
        req.body.fatherLastName,
        req.body.fatherGivenName,
        req.body.fatherMiddleName,
        req.body.fatherExtName
    ].filter(Boolean).join(' ');

    const motherNameFinal = (motherName && motherName.trim()) || [
        req.body.motherLastName,
        req.body.motherGivenName,
        req.body.motherMiddleName,
        req.body.motherExtName
    ].filter(Boolean).join(' ');

    const guardianNameFinal = (guardianName && guardianName.trim()) || [
        req.body.guardianLastName,
        req.body.guardianGivenName,
        req.body.guardianMiddleName,
        req.body.guardianExtName
    ].filter(Boolean).join(' ');

    // Registration date - ALWAYS use server's current timestamp for accuracy
    // This ensures the exact time of successful submission is recorded
    const registrationDate = new Date();

    // Ensure NOT NULL friendly values for ip_community and pwd
    const ipCommunityFinal = (ipCommunity || req.body.ipCommunity || 'No');
    const ipCommunitySpecifyFinal = ipCommunityFinal === 'Yes'
        ? (ipCommunitySpecify || req.body.ipCommunitySpecify || null)
        : null;

    const pwdFinal = (pwd || req.body.pwd || 'No');
    const pwdSpecifyFinal = pwdFinal === 'Yes'
        ? (pwdSpecify || req.body.pwdSpecify || null)
        : null;

    let signatureImagePath = null;
    let documentPaths = {};
    
    // Handle all uploaded files (signature + documents)
    if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
            try {
                const fileBuffer = fs.readFileSync(file.path);
                const base64Data = fileBuffer.toString('base64');
                const mimeType = file.mimetype || 'application/octet-stream';
                const fileDataUrl = `data:${mimeType};base64,${base64Data}`;
                
                // Map files to their destination fields
                if (file.fieldname === 'signatureImage') {
                    signatureImagePath = fileDataUrl;
                } else {
                    // Store document paths by field name
                    documentPaths[file.fieldname] = fileDataUrl;
                }
                
                // Clean up temp file
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error(`Error processing file ${file.fieldname}:`, err.message);
            }
        });
        
        // Debug log the documents saved
        console.log('📄 Documents processed:', Object.keys(documentPaths));
    }
    
    // Handle canvas signature data (already base64 data URL)
    if (!signatureImagePath && signatureData) {
        signatureImagePath = signatureData;
    }

    try {
        // Generate unique token
        let requestToken;
        let tokenExists = true;
        while (tokenExists) {
            requestToken = generateToken();
            const check = await pool.query('SELECT id FROM enrollment_requests WHERE request_token = $1', [requestToken]);
            tokenExists = check.rows.length > 0;
        }

        const insertQuery = `
            INSERT INTO enrollment_requests (
                request_token, gmail_address, school_year, lrn, grade_level,
                last_name, first_name, middle_name, ext_name,
                birthday, age, sex, religion, current_address,
                ip_community, ip_community_specify, pwd, pwd_specify,
                father_name, mother_name, guardian_name, contact_number,
                registration_date, printed_name, signature_image_path, 
                enrollee_type, birth_cert_psa, eccd_checklist, report_card_previous, sf10_original, sf10_optional,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
            RETURNING id, request_token
        `;

        // ============= SECURITY: SANITIZE TEXT INPUTS =============
        const values = [
            requestToken, 
            gmail.toLowerCase().trim(), 
            sanitizeText(schoolYear), 
            lrn || null, 
            sanitizeText(gradeLevel),
            sanitizeText(lastName), 
            sanitizeText(givenName), 
            sanitizeText(middleName) || null, 
            sanitizeText(extName) || null,
            birthday, 
            parseInt(age), 
            sex, 
            sanitizeText(religion) || null, 
            sanitizeText(currentAddress) || 'N/A',
            ipCommunityFinal, 
            sanitizeText(ipCommunitySpecifyFinal), 
            pwdFinal, 
            sanitizeText(pwdSpecifyFinal),
            sanitizeText(fatherNameFinal) || null, 
            sanitizeText(motherNameFinal) || null, 
            sanitizeText(guardianNameFinal) || null,
            contactNumber || null, 
            registrationDate, 
            sanitizeText(printedName), 
            signatureImagePath,
            enrolleeType || null,
            documentPaths['birthCertificatePSA_NewKinder'] || documentPaths['birthCertificatePSA_Transferee'] || documentPaths['birthCertificatePSA_Returnee'] || null,
            documentPaths['eccdChecklist'] || null,
            documentPaths['reportCardPrevious_Transferee'] || documentPaths['reportCardPrevious_Returnee'] || null,
            documentPaths['sf10Original_Transferee'] || null,
            documentPaths['sf10Optional_Returnee'] || null,
            'pending'  // Default status for new enrollment requests
        ];

        // Debug log all values before INSERT
        console.log('📊 Enrollment data being saved:');
        console.log('  - Enrollee Type ($25):', values[24]);
        console.log('  - Birth Cert ($26):', values[25] ? 'Saved' : 'NULL');
        console.log('  - ECCD Checklist ($27):', values[26] ? 'Saved' : 'NULL');
        console.log('  - Report Card ($28):', values[27] ? 'Saved' : 'NULL');
        console.log('  - SF10 Original ($29):', values[28] ? 'Saved' : 'NULL');
        console.log('  - SF10 Optional ($30):', values[29] ? 'Saved' : 'NULL');

        const result = await pool.query(insertQuery, values);
        const token = result.rows[0].request_token;
        
        // ============= SECURITY: LOG SUCCESSFUL SUBMISSION =============
        await logSubmission('enrollment', req, 'success', null, token, { 
            gmail, lrn, gradeLevel, lastName, givenName 
        });
        
        // ============= SEND ENROLLMENT CONFIRMATION EMAIL =============
        if (emailService && emailService.sendEnrollmentConfirmation) {
            const studentName = `${sanitizeText(givenName)} ${sanitizeText(lastName)}`.trim();
            const studentEmail = gmail.toLowerCase().trim();
            const dateToSend = registrationDate instanceof Date ? registrationDate.toISOString() : registrationDate;
            
            emailService.sendEnrollmentConfirmation(studentEmail, studentName, token, dateToSend)
                .catch(err => console.error('Error sending enrollment confirmation email:', err.message));
        }
        
        // Return success with token
        res.json({ 
            success: true, 
            message: 'Enrollment request submitted successfully!',
            token: token
        });

    } catch (err) {
        console.error('Error submitting enrollment:', err);
        
        // Auto-create schema if missing
        if (err.message && /relation "enrollment_requests" does not exist/i.test(err.message)) {
            console.warn('âš ï¸ enrollment_requests table missing â€“ creating now...');
            try {
                await ensureEnrollmentRequestsSchema();
                
                // Retry the submission
                let requestToken;
                let tokenExists = true;
                while (tokenExists) {
                    requestToken = generateToken();
                    const check = await pool.query('SELECT id FROM enrollment_requests WHERE request_token = $1', [requestToken]);
                    tokenExists = check.rows.length > 0;
                }

                const insertQuery = `
                    INSERT INTO enrollment_requests (
                        request_token, gmail_address, school_year, lrn, grade_level,
                        last_name, first_name, middle_name, ext_name,
                        birthday, age, sex, religion, current_address,
                        ip_community, ip_community_specify, pwd, pwd_specify,
                        father_name, mother_name, guardian_name, contact_number,
                        registration_date, printed_name, signature_image_path, 
                        enrollee_type, birth_cert_psa, eccd_checklist, report_card_previous, sf10_original, sf10_optional,
                        status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
                    RETURNING id, request_token
                `;

                const values = [
                    requestToken, 
                    gmail.toLowerCase().trim(), 
                    sanitizeText(schoolYear), 
                    lrn || null, 
                    sanitizeText(gradeLevel),
                    sanitizeText(lastName), 
                    sanitizeText(givenName), 
                    sanitizeText(middleName) || null, 
                    sanitizeText(extName) || null,
                    birthday, 
                    parseInt(age), 
                    sex, 
                    sanitizeText(religion) || null, 
                    sanitizeText(currentAddress) || 'N/A',
                    ipCommunityFinal, 
                    sanitizeText(ipCommunitySpecifyFinal), 
                    pwdFinal, 
                    sanitizeText(pwdSpecifyFinal),
                    sanitizeText(fatherNameFinal) || null, 
                    sanitizeText(motherNameFinal) || null, 
                    sanitizeText(guardianNameFinal) || null,
                    contactNumber || null, 
                    registrationDate, 
                    sanitizeText(printedName), 
                    signatureImagePath,
                    enrolleeType || null,
                    documentPaths['birthCertificatePSA_NewKinder'] || documentPaths['birthCertificatePSA_Transferee'] || documentPaths['birthCertificatePSA_Returnee'] || null,
                    documentPaths['eccdChecklist'] || null,
                    documentPaths['reportCardPrevious_Transferee'] || documentPaths['reportCardPrevious_Returnee'] || null,
                    documentPaths['sf10Original_Transferee'] || null,
                    documentPaths['sf10Optional_Returnee'] || null,
                    'pending'  // Default status for new enrollment requests
                ];

                const result = await pool.query(insertQuery, values);
                const token = result.rows[0].request_token;
                
                await logSubmission('enrollment', req, 'success', null, token, { 
                    gmail, lrn, gradeLevel, lastName, givenName 
                });
                
                return res.json({ 
                    success: true, 
                    message: 'Enrollment request submitted successfully!',
                    token: token
                });
            } catch (inner) {
                console.error('âŒ Failed after creating schema:', inner.message);
                await logSubmission('enrollment', req, 'error', inner.message, null, { gmail, lrn });
                return res.status(500).json({ success: false, message: 'Error after schema creation: ' + inner.message });
            }
        }
        
        await logSubmission('enrollment', req, 'error', err.message, null, { gmail, lrn });
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting enrollment: ' + err.message 
        });
    }
});

// Download enrollment form as text/JSON/PDF file
app.get('/download-enrollment/:token', async (req, res) => {
    const token = req.params.token;
    const format = req.query.format || 'pdf'; // 'txt', 'json', or 'pdf'

    try {
        const result = await pool.query(`
            SELECT * FROM enrollment_requests WHERE request_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment request not found' });
        }

        const data = result.rows[0];
        const filename = `enrollment-${token}`;

        if (format === 'json') {
            // Download as JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json(data);
        } else if (format === 'pdf') {
            // Generate PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(res);

            // Helper function to format date without time
            const formatDateOnly = (dateString) => {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            };

            // Title
            doc.fontSize(20).font('Helvetica-Bold').text('ENROLLMENT FORM', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('Copy/Download Record', { align: 'center' });
            doc.moveDown();

            // Metadata
            doc.fontSize(9).text(`Generated: ${formatDateOnly(new Date().toISOString())}`, { align: 'right' });
            doc.text(`Request Token: ${data.request_token}`, { align: 'right' });
            doc.text(`Status: ${data.status || 'Pending'}`, { align: 'right' });
            doc.moveDown();

            // Personal Information Section
            doc.fontSize(12).font('Helvetica-Bold').text('PERSONAL INFORMATION');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Email: ${data.gmail_address}`);
            doc.text(`Name: ${data.last_name}, ${data.first_name} ${data.middle_name || ''} ${data.ext_name || ''}`.trim());
            doc.text(`Birthdate: ${data.birthday}`);
            doc.text(`Age: ${data.age}`);
            doc.text(`Sex: ${data.sex}`);
            doc.text(`Religion: ${data.religion || 'N/A'}`);
            doc.text(`LRN: ${data.lrn || 'N/A'}`);
            doc.moveDown();

            // Enrollment Details Section
            doc.fontSize(12).font('Helvetica-Bold').text('ENROLLMENT DETAILS');
            doc.fontSize(9).font('Helvetica');
            doc.text(`School Year: ${data.school_year}`);
            doc.text(`Grade Level: ${data.grade_level}`);
            doc.text(`Current Address: ${data.current_address || 'N/A'}`);
            doc.text(`Contact Number: ${data.contact_number || 'N/A'}`);
            doc.moveDown();

            // Special Information Section
            doc.fontSize(12).font('Helvetica-Bold').text('SPECIAL INFORMATION');
            doc.fontSize(9).font('Helvetica');
            doc.text(`IP Community: ${data.ip_community}`);
            if (data.ip_community_specify) {
                doc.text(`IP Community Specify: ${data.ip_community_specify}`);
            }
            doc.text(`PWD: ${data.pwd}`);
            if (data.pwd_specify) {
                doc.text(`PWD Specify: ${data.pwd_specify}`);
            }
            doc.moveDown();

            // Parent/Guardian Information Section
            doc.fontSize(12).font('Helvetica-Bold').text('PARENT/GUARDIAN INFORMATION');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Father: ${data.father_name || 'N/A'}`);
            doc.text(`Mother: ${data.mother_name || 'N/A'}`);
            doc.text(`Guardian: ${data.guardian_name || 'N/A'}`);
            doc.moveDown();

            // Submission Details Section
            doc.fontSize(12).font('Helvetica-Bold').text('SUBMISSION DETAILS');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Submitted: ${formatDateOnly(data.created_at)}`);
            doc.text(`Printed Name: ${data.printed_name || 'N/A'}`);
            doc.text(`Signature: ${data.signature_image_path ? 'Provided' : 'Not provided'}`);

            // Add footer
            doc.fontSize(8).text('---', { align: 'center' });
            doc.text('This is an official copy of the enrollment form', { align: 'center' });

            doc.end();
        } else {
            // Download as text file
            let content = `ENROLLMENT FORM - COPY/DOWNLOAD\n`;
            content += `===============================================\n`;
            content += `Generated: ${new Date().toLocaleString()}\n`;
            content += `Request Token: ${data.request_token}\n`;
            content += `Status: ${data.status || 'Pending'}\n\n`;
            
            content += `PERSONAL INFORMATION\n`;
            content += `-------------------\n`;
            content += `Gmail: ${data.gmail_address}\n`;
            content += `Name: ${data.last_name}, ${data.first_name} ${data.middle_name || ''} ${data.ext_name || ''}\n`;
            content += `Birthdate: ${data.birthday}\n`;
            content += `Age: ${data.age}\n`;
            content += `Sex: ${data.sex}\n`;
            content += `Religion: ${data.religion || 'N/A'}\n`;
            content += `LRN: ${data.lrn || 'N/A'}\n\n`;

            content += `ENROLLMENT DETAILS\n`;
            content += `------------------\n`;
            content += `School Year: ${data.school_year}\n`;
            content += `Grade Level: ${data.grade_level}\n`;
            content += `Current Address: ${data.current_address || 'N/A'}\n`;
            content += `Contact Number: ${data.contact_number || 'N/A'}\n\n`;

            content += `SPECIAL INFORMATION\n`;
            content += `-------------------\n`;
            content += `IP Community: ${data.ip_community}\n`;
            if (data.ip_community_specify) {
                content += `IP Community Specify: ${data.ip_community_specify}\n`;
            }
            content += `PWD: ${data.pwd}\n`;
            if (data.pwd_specify) {
                content += `PWD Specify: ${data.pwd_specify}\n`;
            }
            content += `\n`;

            content += `PARENT/GUARDIAN INFORMATION\n`;
            content += `---------------------------\n`;
            content += `Father: ${data.father_name || 'N/A'}\n`;
            content += `Mother: ${data.mother_name || 'N/A'}\n`;
            content += `Guardian: ${data.guardian_name || 'N/A'}\n\n`;

            content += `SUBMISSION DETAILS\n`;
            content += `------------------\n`;
            content += `Submitted: ${data.created_at}\n`;
            content += `Printed Name: ${data.printed_name || 'N/A'}\n`;
            content += `Signature: ${data.signature_image_path ? 'Provided' : 'Not provided'}\n`;

            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
            res.send(content);
        }
    } catch (err) {
        console.error('Error downloading enrollment:', err);
        res.status(500).json({ error: 'Error generating download' });
    }
});

// Get enrollment data for display (for copy to clipboard)
app.get('/api/enrollment/:token', async (req, res) => {
    const token = req.params.token;

    try {
        const result = await pool.query(`
            SELECT * FROM enrollment_requests WHERE request_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment request not found' });
        }

        const data = result.rows[0];
        const formattedData = {
            requestToken: data.request_token,
            status: data.status || 'Pending',
            submissionDate: data.created_at,
            learnerName: `${data.last_name}, ${data.first_name} ${data.middle_name || ''} ${data.ext_name || ''}`.trim(),
            gmail: data.gmail_address,
            schoolYear: data.school_year,
            gradeLevel: data.grade_level,
            birthdate: data.birthday,
            age: data.age,
            sex: data.sex,
            lrn: data.lrn || 'N/A',
            address: data.current_address || 'N/A',
            contactNumber: data.contact_number || 'N/A'
        };

        res.json(formattedData);
    } catch (err) {
        console.error('Error fetching enrollment:', err);
        res.status(500).json({ error: 'Error fetching enrollment data' });
    }
});

// Check enrollment status by token
app.get('/check-status/:token', async (req, res) => {
    const token = req.params.token;
    try {
        const result = await pool.query(`
            SELECT id, request_token, status, gmail_address,
                   COALESCE(last_name, '') || ', ' || COALESCE(first_name, '') || ' ' || COALESCE(middle_name, '') as learner_name,
                   grade_level, created_at, registration_date, reviewed_at, rejection_reason
            FROM enrollment_requests 
            WHERE request_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.render('checkStatus', { error: 'Invalid token. Please check and try again.' });
        }

        res.render('checkStatus', { request: result.rows[0], error: null });
    } catch (err) {
        console.error('Error checking status:', err);
        res.render('checkStatus', { error: 'An error occurred. Please try again later.' });
    }
});

// Approve enrollment request
app.post('/approve-request/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).send('Access denied');
    }

    const requestId = req.params.id;
    const registrarId = req.session.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get request details
        const requestResult = await client.query('SELECT * FROM enrollment_requests WHERE id = $1', [requestId]);
        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const request = requestResult.rows[0];

        // Prevent double-approval
        if (request.status && request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: `Request already ${request.status}.` });
        }

        // Safe defaults for NOT NULL columns in early_registration
        const currentAddress = (request.current_address && String(request.current_address).trim()) || 'N/A';
        const ipCommunity = (request.ip_community && String(request.ip_community).trim()) || 'No';
        const ipCommunitySpecify = ipCommunity === 'Yes' ? (request.ip_community_specify || null) : null;
        const pwd = (request.pwd && String(request.pwd).trim()) || 'No';
        const pwdSpecify = pwd === 'Yes' ? (request.pwd_specify || null) : null;

        const insertQuery = `
            INSERT INTO early_registration (
                gmail_address, school_year, lrn, grade_level,
                last_name, first_name, middle_name, ext_name,
                birthday, age, sex, religion, current_address,
                ip_community, ip_community_specify, pwd, pwd_specify,
                father_name, mother_name, guardian_name, contact_number,
                registration_date, printed_name, signature_image_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10::integer, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::date, $23, $24)
            RETURNING id
        `;

        const insertValues = [
            request.gmail_address,
            request.school_year,
            request.lrn || null,
            request.grade_level,
            request.last_name,
            request.first_name,
            request.middle_name || null,
            request.ext_name || null,
            request.birthday,
            request.age,
            request.sex,
            request.religion || null,
            currentAddress,
            ipCommunity,
            ipCommunitySpecify,
            pwd,
            pwdSpecify,
            request.father_name || null,
            request.mother_name || null,
            request.guardian_name || null,
            request.contact_number || null,
            request.registration_date,
            request.printed_name,
            request.signature_image_path || null
        ];

        const inserted = await client.query(insertQuery, insertValues);

        // Update request status
        await client.query(
            `UPDATE enrollment_requests 
             SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [registrarId, requestId]
        );

        // Store learner name for email (before releasing client)
        const learnerName = `${request.first_name} ${request.last_name}`;
        const studentEmail = request.gmail_address;
        const studentToken = request.request_token;
        
        // Commit transaction and release client
        await client.query('COMMIT');
        client.release();

        // Send approval notification email AFTER transaction completes (non-blocking)
        // Don't await - let it send in background so response isn't blocked
        console.log(`ðŸ“§ Triggering approval email send to ${studentEmail} for ${learnerName}`);
        if (emailService) {
            emailService.sendEnrollmentStatusUpdate(studentEmail, learnerName, studentToken, 'approved')
                .catch(err => console.error('âŒ Error sending approval email:', err.message));
        } else {
            console.warn('âš ï¸ Email service not available, skipping approval email');
        }

        res.json({ success: true, message: 'Request approved successfully', early_registration_id: inserted.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error approving request:', err);
        console.error('Full error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint
        });
        res.status(500).json({ success: false, message: 'Error approving request: ' + err.message });
    } finally {
        try {
            if (client && !client._released) client.release();
        } catch (e) {
            // Client already released
        }
    }
});

// Reject enrollment request
app.post('/reject-request/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'registrar') {
        return res.status(403).send('Access denied');
    }

    const requestId = req.params.id;
    const registrarId = req.session.user.id;
    const { reason } = req.body;

    try {
        // Get request details before updating (for email notification)
        const requestResult = await pool.query(`
            SELECT first_name, last_name, gmail_address, request_token 
            FROM enrollment_requests 
            WHERE id = $1
        `, [requestId]);
        
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        const enrollmentRequest = requestResult.rows[0];
        
        await pool.query(`
            UPDATE enrollment_requests 
            SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $2
            WHERE id = $3
        `, [registrarId, reason || 'No reason provided', requestId]);

        // Send rejection notification email (non-blocking)
        const learnerName = `${enrollmentRequest.first_name} ${enrollmentRequest.last_name}`;
        if (emailService) {
            emailService.sendEnrollmentStatusUpdate(enrollmentRequest.gmail_address, learnerName, enrollmentRequest.request_token, 'rejected', reason || 'No reason provided')
                .catch(err => console.error('âŒ Error sending rejection email:', err.message));
        } else {
            console.warn('âš ï¸ Email service not available, skipping rejection email');
        }

        res.json({ success: true, message: 'Request rejected' });
    } catch (err) {
        console.error('Error rejecting request:', err);
        res.status(500).json({ success: false, message: 'Error rejecting request' });
    }
});

// ==================== DOCUMENT REQUEST ROUTES ====================

// Submit document request (public)
app.post('/api/document-request/submit', documentRequestLimiter, async (req, res) => {
    const {
        studentName, studentId, contactNumber, email,
        documentType, purpose, additionalNotes,
        adviserName, adviserSchoolYear, studentType, honeypot
    } = req.body || {};

    // Note: Rate limiting is handled by documentRequestLimiter middleware

    // Helper to insert request
    async function insertRequest() {
        let requestToken;
        let tokenExists = true;
        while (tokenExists) {
            requestToken = generateToken();
            const check = await pool.query('SELECT id FROM document_requests WHERE request_token = $1', [requestToken]);
            tokenExists = check.rows.length > 0;
        }
        const insertQuery = `
            INSERT INTO document_requests (
                request_token, student_name, student_id, contact_number, email,
                document_type, purpose, additional_notes,
                adviser_name, adviser_school_year, student_type, status, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending', CURRENT_TIMESTAMP)
            RETURNING id, request_token, created_at`;
        // ============= SECURITY: SANITIZE TEXT INPUTS =============
        const values = [
            requestToken, 
            sanitizeText(studentName), 
            sanitizeText(studentId) || null, 
            contactNumber, 
            email.toLowerCase().trim(),
            sanitizeText(documentType), 
            sanitizeText(purpose), 
            sanitizeText(additionalNotes) || null,
            sanitizeText(adviserName), 
            sanitizeText(adviserSchoolYear), 
            studentType
        ];
        const result = await pool.query(insertQuery, values);
        return result.rows[0].request_token;
    }

    try {
        const token = await insertRequest();
        // ============= SECURITY: LOG SUCCESSFUL SUBMISSION =============
        await logSubmission('document_request', req, 'success', null, token, { 
            email, studentName, documentType 
        });
        return res.json({ success: true, message: 'Document request submitted successfully!', token });
    } catch (err) {
        // Auto-create schema if missing
        if (err.message && /relation "document_requests" does not exist/i.test(err.message)) {
            console.warn('âš ï¸ document_requests table missing â€“ creating now...');
            try {
                await ensureDocumentRequestsSchema();
                const token = await insertRequest();
                await logSubmission('document_request', req, 'success', null, token, { 
                    email, studentName, documentType 
                });
                return res.json({ success: true, message: 'Document request submitted successfully!', token });
            } catch (inner) {
                console.error('âŒ Failed after creating schema:', inner.message);
                await logSubmission('document_request', req, 'error', inner.message, null, { email });
                return res.status(500).json({ success: false, message: 'Error after schema creation: ' + inner.message });
            }
        }
        console.error('Error submitting document request:', err.message);
        await logSubmission('document_request', req, 'error', err.message, null, { email });
        return res.status(500).json({ success: false, message: 'Error submitting request: ' + err.message });
    }
});

// Check document request status by token (public)
app.get('/api/document-request/status/:token', async (req, res) => {
    const token = req.params.token.trim().toUpperCase();

    try {
        const result = await pool.query(`
            SELECT id, request_token, status, student_name, student_id,
                   contact_number, email, document_type, purpose, 
                   additional_notes, adviser_name, adviser_school_year,
                   student_type, created_at, processed_at,
                   completion_notes, rejection_reason
            FROM document_requests
            WHERE request_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid token. Please check and try again.'
            });
        }

        res.json({
            success: true,
            request: result.rows[0]
        });

    } catch (err) {
        console.error('Error checking document request status:', err);
        res.status(500).json({
            success: false,
            message: 'Error checking status'
        });
    }
});

// Guidance: Get document requests page
app.get('/guidance/document-requests', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/guidance/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'guidance', 'guidance-document-requests.html'));
});

// Guidance: Get all document requests
app.get('/api/guidance/document-requests', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                dr.id, dr.request_token, dr.status,
                dr.student_name, dr.student_id, dr.contact_number, dr.email,
                dr.document_type, dr.purpose, dr.additional_notes,
                dr.adviser_name, dr.adviser_school_year, dr.student_type,
                dr.created_at, dr.updated_at, dr.processed_at,
                dr.completion_notes, dr.rejection_reason,
                ga.fullname as processed_by_name
            FROM document_requests dr
            LEFT JOIN guidance_accounts ga ON dr.processed_by = ga.id
            ORDER BY 
                CASE 
                    WHEN dr.status = 'pending' THEN 1
                    WHEN dr.status = 'processing' THEN 2
                    WHEN dr.status = 'ready' THEN 3
                    WHEN dr.status = 'completed' THEN 4
                    WHEN dr.status = 'rejected' THEN 5
                END,
                dr.created_at DESC
        `);

        res.json({
            success: true,
            requests: result.rows
        });

    } catch (err) {
        console.error('Error fetching document requests:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching requests'
        });
    }
});

// Guidance: Update document request status
app.put('/api/guidance/document-requests/:id/status', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requestId = req.params.id;
    const { status, completion_notes, rejection_reason } = req.body;
    const guidanceId = req.session.guidance_id;

    // Validation
    const validStatuses = ['pending', 'processing', 'ready', 'completed', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    if (status === 'rejected' && !rejection_reason) {
        return res.status(400).json({
            success: false,
            message: 'Rejection reason is required'
        });
    }

    try {
        // Get request details before updating (for email notification)
        const getQuery = `SELECT * FROM document_requests WHERE id = $1`;
        const getResult = await pool.query(getQuery, [requestId]);
        
        if (getResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        const documentRequest = getResult.rows[0];
        
        const updateQuery = `
            UPDATE document_requests
            SET status = $1,
                processed_by = $2,
                processed_at = CURRENT_TIMESTAMP,
                completion_notes = $3,
                rejection_reason = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;

        const result = await pool.query(updateQuery, [
            status,
            guidanceId,
            completion_notes || null,
            rejection_reason || null,
            requestId
        ]);

        // Send email notification for status updates that warrant notification
        if (status === 'processing' || status === 'ready' || status === 'rejected') {
            if (emailService) {
                await emailService.sendDocumentRequestStatusUpdate(
                    documentRequest.email,
                    documentRequest.student_name,
                    documentRequest.request_token,
                    documentRequest.document_type,
                    status,
                    rejection_reason || null
                );
            } else {
                console.warn('âš ï¸ Email service not available, skipping document request email');
            }
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            request: result.rows[0]
        });

    } catch (err) {
        console.error('Error updating document request status:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating status: ' + err.message
        });
    }
});

// Guidance: Delete a document request (permanent)
app.delete('/api/guidance/document-requests/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const requestId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Optionally, fetch the request for logging/audit
        const existing = await client.query('SELECT id, request_token, student_name FROM document_requests WHERE id = $1', [requestId]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Delete the request
        const del = await client.query('DELETE FROM document_requests WHERE id = $1 RETURNING id', [requestId]);
        await client.query('COMMIT');

        // Optionally log deletion to submission_logs
        try {
            await pool.query(`
                INSERT INTO submission_logs (submission_type, ip_address, user_agent, email, form_data, status, request_token)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
            `, ['document_request_delete', getClientIP(req), req.headers['user-agent'] || null, null, JSON.stringify({ deletedRequestId: requestId }), 'deleted', existing.rows[0].request_token || null]);
        } catch (e) {
            console.warn('Failed to log document request deletion:', e.message);
        }

        res.json({ success: true, message: 'Request deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting document request:', err);
        res.status(500).json({ success: false, message: 'Error deleting request: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Assign student to section
app.post('/assign-section/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentIdentifier = req.params.id;
    const { section } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if this is an enrollment_requests student (ID starts with 'ER')
        if (String(studentIdentifier).startsWith('ER')) {
            // Extract the actual enrollment_requests ID
            const enrollmentId = parseInt(String(studentIdentifier).substring(2));

            // Get enrollment_requests details (new system)
            const enrolleeResult = await client.query(`
                SELECT * FROM enrollment_requests WHERE id = $1
            `, [enrollmentId]);

            if (enrolleeResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Enrollee not found' });
            }

            const enrollee = enrolleeResult.rows[0];

            // Verify section exists and has capacity
            const sectionResult = await client.query(`
                SELECT id, section_name, max_capacity, current_count 
                FROM sections 
                WHERE id = $1 AND is_active = true
            `, [section]);

            if (sectionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Section not found or inactive' });
            }

            const sectionData = sectionResult.rows[0];

            if (sectionData.current_count >= sectionData.max_capacity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: `Section ${sectionData.section_name} is full (${sectionData.current_count}/${sectionData.max_capacity})` 
                });
            }

            // Check if this enrollee is already in students table
            const existingStudent = await client.query(`
                SELECT id FROM students WHERE lrn = $1 AND school_year = $2
            `, [enrollee.lrn, enrollee.school_year]);

            if (existingStudent.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'This enrollee has already been assigned to a section' });
            }

            // Insert into students table from enrollment_requests
            const insertQuery = `
                INSERT INTO students (
                    lrn, school_year, grade_level,
                    last_name, first_name, middle_name, ext_name,
                    birthday, age, sex, religion, current_address, contact_number,
                    section_id, enrollment_status, is_archived
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (lrn, school_year) DO UPDATE SET section_id = $14, enrollment_status = 'active'
                RETURNING id
            `;

            const insertValues = [
                enrollee.lrn, enrollee.school_year, enrollee.grade_level,
                enrollee.last_name, enrollee.first_name, enrollee.middle_name, enrollee.ext_name,
                enrollee.birthday, enrollee.age, enrollee.sex, enrollee.religion, enrollee.current_address,
                enrollee.contact_number, section, 'active', false
            ];

            await client.query(insertQuery, insertValues);

            // Increment section current_count
            await client.query(`
                UPDATE sections 
                SET current_count = current_count + 1
                WHERE id = $1
            `, [section]);

            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student successfully assigned to ${sectionData.section_name}`
            });
        } else {
            // Handle regular students table (unassigned students)
            const studentId = parseInt(studentIdentifier);

            // Get student details
            const studentResult = await client.query(`
                SELECT * FROM students WHERE id = $1 AND section_id IS NULL
            `, [studentId]);

            if (studentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Unassigned student not found' });
            }

            // Verify section exists and has capacity
            const sectionResult = await client.query(`
                SELECT id, section_name, max_capacity, current_count 
                FROM sections 
                WHERE id = $1 AND is_active = true
            `, [section]);

            if (sectionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Section not found or inactive' });
            }

            const sectionData = sectionResult.rows[0];

            if (sectionData.current_count >= sectionData.max_capacity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: `Section ${sectionData.section_name} is full (${sectionData.current_count}/${sectionData.max_capacity})` 
                });
            }

            // Assign student to section and clear the reassignment flag
            await client.query(`
                UPDATE students 
                SET section_id = $1, needs_reassignment_due_to_grade_change = false 
                WHERE id = $2
            `, [section, studentId]);

            // Increment section current_count
            await client.query(`
                UPDATE sections 
                SET current_count = current_count + 1
                WHERE id = $1
            `, [section]);

            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student successfully assigned to ${sectionData.section_name}`
            });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error assigning student to section:', err);
        res.status(500).json({ success: false, message: 'Error assigning student: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Get active sections for dropdown
app.get('/api/sections', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const result = await pool.query(`
            SELECT s.id,
                   s.section_name,
                   s.grade_level,
                   s.max_capacity,
                   COALESCE(cnt.cnt, 0) AS current_count,
                   (s.max_capacity - COALESCE(cnt.cnt, 0)) as available_slots,
                   s.adviser_name,
                   s.room_number
            FROM sections s
            LEFT JOIN (
                SELECT section_id, COUNT(*) AS cnt
                FROM students
                WHERE enrollment_status = 'active'
                GROUP BY section_id
            ) cnt ON cnt.section_id = s.id
            WHERE s.is_active = true
            ORDER BY 
                CASE 
                    WHEN grade_level = 'Kindergarten' THEN 1
                    WHEN grade_level = 'Grade 1' THEN 2
                    WHEN grade_level = 'Grade 2' THEN 3
                    WHEN grade_level = 'Grade 3' THEN 4
                    WHEN grade_level = 'Grade 4' THEN 5
                    WHEN grade_level = 'Grade 5' THEN 6
                    WHEN grade_level = 'Grade 6' THEN 7
                    WHEN grade_level = 'Grade 7' THEN 8
                    WHEN grade_level = 'Grade 8' THEN 9
                    WHEN grade_level = 'Grade 9' THEN 10
                    WHEN grade_level = 'Grade 10' THEN 11
                    WHEN grade_level = 'Non-Graded' THEN 12
                    ELSE 13
                END,
                section_name
        `);

        res.json({ success: true, sections: result.rows });
    } catch (err) {
        console.error('Error fetching sections:', err);
        res.status(500).json({ success: false, message: 'Error fetching sections' });
    }
});

// ICT Coordinator: Get all sections (including inactive) for management
app.get('/api/sections/all', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const result = await pool.query(`
            SELECT s.id,
                   s.section_name,
                   s.grade_level,
                   s.max_capacity,
                   COALESCE(cnt.cnt, 0) AS current_count,
                   s.adviser_name,
                   s.room_number,
                   s.is_active,
                   s.created_at
            FROM sections s
            LEFT JOIN (
                SELECT section_id, COUNT(*) AS cnt
                FROM students
                WHERE enrollment_status = 'active'
                GROUP BY section_id
            ) cnt ON cnt.section_id = s.id
            ORDER BY 
                CASE 
                    WHEN grade_level = 'Kindergarten' THEN 1
                    WHEN grade_level = 'Grade 1' THEN 2
                    WHEN grade_level = 'Grade 2' THEN 3
                    WHEN grade_level = 'Grade 3' THEN 4
                    WHEN grade_level = 'Grade 4' THEN 5
                    WHEN grade_level = 'Grade 5' THEN 6
                    WHEN grade_level = 'Grade 6' THEN 7
                    WHEN grade_level = 'Grade 7' THEN 8
                    WHEN grade_level = 'Grade 8' THEN 9
                    WHEN grade_level = 'Grade 9' THEN 10
                    WHEN grade_level = 'Grade 10' THEN 11
                    WHEN grade_level = 'Non-Graded' THEN 12
                    ELSE 13
                END,
                section_name
        `);

        res.json({ success: true, sections: result.rows });
    } catch (err) {
        console.error('Error fetching all sections:', err);
        res.status(500).json({ success: false, message: 'Error fetching sections' });
    }
});

// Save snapshot with student dataset
app.post('/api/snapshots/dataset', async (req, res) => {
    console.log('ðŸ“¸ POST /api/snapshots/dataset called');
    console.log('Session user:', req.session.user);
    
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        console.log('âŒ Access denied - user role:', req.session.user?.role);
        return res.status(403).json({ success: false, message: 'Access denied - only ICT Coordinator can import' });
    }

    let { snapshotName, students } = req.body || {};
    console.log('Snapshot name:', snapshotName, 'Students count:', students?.length);
    
    if (!snapshotName || !String(snapshotName).trim()) {
        return res.status(400).json({ success: false, message: 'Snapshot name is required' });
    }

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ success: false, message: 'No students provided' });
    }

    const client = await pool.connect();
    try {
        // Create tables if they don't exist (DO NOT DROP - keep all snapshots)
        await client.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name TEXT NOT NULL UNIQUE,
                created_by INTEGER,
                is_archived BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create items table with proper structure
        await client.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER NOT NULL REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name TEXT,
                grade_level TEXT,
                adviser_name TEXT,
                student_full_name TEXT,
                current_address TEXT,
                barangay_extracted TEXT,
                teacher_name TEXT,
                sex TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('BEGIN');

        // Handle duplicate snapshot names by auto-generating unique names
        let finalSnapshotName = String(snapshotName).trim();
        let counter = 1;
        const originalName = finalSnapshotName;
        
        while (true) {
            const checkResult = await client.query(
                'SELECT id FROM section_snapshot_groups WHERE snapshot_name = $1 LIMIT 1',
                [finalSnapshotName]
            );
            
            if (checkResult.rows.length === 0) {
                // Name is unique, we can use it
                break;
            }
            
            // Name exists, try with a counter
            finalSnapshotName = `${originalName} (${counter})`;
            counter++;
            
            // Safety check - stop after 100 attempts
            if (counter > 100) {
                throw new Error('Could not generate unique snapshot name');
            }
        }
        
        console.log('Using snapshot name:', finalSnapshotName);

        // Create snapshot group
        const groupResult = await client.query(
            'INSERT INTO section_snapshot_groups (snapshot_name, created_by) VALUES ($1, $2) RETURNING id, snapshot_name, created_at',
            [finalSnapshotName, req.session.user.id || null]
        );
        const groupId = groupResult.rows[0].id;
        console.log('Created snapshot group:', groupId, 'with name:', finalSnapshotName);

        // Batch insert all students for much better performance
        // Process in chunks of 100 to avoid query size limits
        const batchSize = 100;
        let insertedCount = 0;
        
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, Math.min(i + batchSize, students.length));
            
            // Build batch insert query
            let valuesList = [];
            let params = [groupId];
            let paramIdx = 2;
            
            for (const student of batch) {
                const barangay = extractBarangayFlexible(student.barangay || student.current_address);
                const fullName = student.name || student.full_name || 'Unknown';
                const sectionLevel = student.sectionLevel || student.section_name || 'Unassigned';
                
                valuesList.push(`($1, $${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`);
                
                params.push(
                    sectionLevel,
                    student.grade_level || '-',
                    fullName,
                    student.current_address || '-',
                    barangay,
                    student.adviser || student.adviser_name || '-',
                    student.sex || 'N/A'
                );
                
                paramIdx += 7;
            }
            
            const batchQuery = `
                INSERT INTO section_snapshot_items 
                (group_id, section_name, grade_level, student_full_name, current_address, barangay_extracted, adviser_name, sex)
                VALUES ${valuesList.join(', ')}
            `;
            
            try {
                await client.query(batchQuery, params);
                insertedCount += batch.length;
                console.log(`Inserted batch of ${batch.length} students, total: ${insertedCount}`);
            } catch (err) {
                console.warn('Error inserting batch:', err.message);
                // Continue with next batch instead of failing completely
            }
        }

        await client.query('COMMIT');
        console.log('âœ… Snapshot saved successfully:', groupId, 'with', insertedCount, 'students');
        res.json({ 
            success: true, 
            message: `Snapshot '${finalSnapshotName}' saved with ${insertedCount} students`,
            snapshotName: finalSnapshotName,
            studentCount: insertedCount
        });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (e) {}
        console.error('Error saving snapshot dataset:', err);
        res.status(500).json({ success: false, message: 'Error saving snapshot: ' + err.message });
    } finally {
        client.release();
    }
});

// Helper function for flexible barangay extraction
function extractBarangayFlexible(address) {
    if (!address) return 'Others';
    const addressStr = String(address).trim();
    
    // Common barangay patterns
    const barangayPatterns = [
        'San Francisco', 'Mabini', 'Mainaga', 'Brgy', 'Barangay',
        'Talahib', 'Marilog', 'Suisui', 'Layaw', 'Maharlika'
    ];
    
    for (const pattern of barangayPatterns) {
        if (addressStr.toLowerCase().includes(pattern.toLowerCase())) {
            return pattern;
        }
    }
    
    const parts = addressStr.split(/[\s,]+/).filter(p => p.length > 0);
    return parts.length > 0 ? parts[0] : 'Others';
}

// New snapshot/grouped snapshot endpoints
app.post('/api/sections/snapshots', async (req, res) => {
    console.log('ðŸ“¸ POST /api/sections/snapshots called');
    console.log('Session user:', req.session.user);
    console.log('Request body:', req.body);
    
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        console.log('âŒ Access denied - not ictcoor');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
        console.log('âŒ No snapshot name provided');
        return res.status(400).json({ success: false, message: 'Snapshot name is required' });
    }

    // Helper function to extract barangay from address (flexible - takes first word or main barangay)
    const extractBarangay = (address) => {
        if (!address) return 'Others';
        const addressStr = String(address).trim();
        
        // Common barangay patterns in the school area
        const barangayPatterns = [
            'San Francisco', 'Mabini', 'Mainaga', 'Brgy', 'Barangay',
            'Talahib', 'Marilog', 'Suisui', 'Layaw', 'Maharlika'
        ];
        
        // Check if any known barangay is in the address
        for (const pattern of barangayPatterns) {
            if (addressStr.toLowerCase().includes(pattern.toLowerCase())) {
                return pattern;
            }
        }
        
        // Otherwise, take the first word as barangay
        const parts = addressStr.split(/[\s,]+/).filter(p => p.length > 0);
        return parts.length > 0 ? parts[0] : 'Others';
    };

    const snapshotName = String(name).trim();
    const client = await pool.connect();
    try {
        // Create tables if they don't exist (but DO NOT DROP - preserve existing snapshots)
        await client.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name TEXT NOT NULL UNIQUE,
                created_by INTEGER,
                is_archived BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create items table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER NOT NULL REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name TEXT,
                grade_level TEXT,
                adviser_name TEXT,
                student_full_name TEXT,
                current_address TEXT,
                barangay_extracted TEXT,
                teacher_name TEXT,
                sex TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('BEGIN');

        // Handle duplicate snapshot names by auto-generating unique names
        let finalSnapshotName = snapshotName;
        let counter = 1;
        const originalName = snapshotName;
        
        while (true) {
            try {
                // Try to insert with this name
                const checkResult = await client.query(
                    'SELECT id FROM section_snapshot_groups WHERE snapshot_name = $1 LIMIT 1',
                    [finalSnapshotName]
                );
                
                if (checkResult.rows.length === 0) {
                    // Name is unique, we can use it
                    break;
                }
                
                // Name exists, try with a counter
                finalSnapshotName = `${originalName} (${counter})`;
                counter++;
                
                // Safety check - stop after 100 attempts
                if (counter > 100) {
                    throw new Error('Could not generate unique snapshot name');
                }
            } catch (err) {
                if (counter > 100) throw err;
                finalSnapshotName = `${originalName} (${counter})`;
                counter++;
            }
        }

        console.log('Using snapshot name:', finalSnapshotName);

        // Insert group with the final unique name
        const g = await client.query(`INSERT INTO section_snapshot_groups (snapshot_name, created_by) VALUES ($1, $2) RETURNING id, snapshot_name, created_at`, [finalSnapshotName, req.session.user.id || null]);
        const groupId = g.rows[0].id;

        // Get all students with their sections, sorted by section and name
        const students = await client.query(`
            SELECT 
                s.id,
                s.last_name,
                s.first_name,
                s.middle_name,
                s.ext_name,
                s.last_name || ', ' || s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || COALESCE(s.ext_name, '') AS full_name,
                s.current_address,
                s.section_id,
                sec.section_name,
                sec.grade_level,
                sec.adviser_name
            FROM students s
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.enrollment_status = 'active' AND s.section_id IS NOT NULL
            ORDER BY sec.section_name, s.last_name, s.first_name
        `);

        // Get current section counts (still save them for summary)
        const counts = await client.query(`
            SELECT s.id AS section_id, s.section_name, s.grade_level, COALESCE(cnt.cnt, 0) AS count, s.adviser_name
            FROM sections s
            LEFT JOIN (
                SELECT section_id, COUNT(*) AS cnt
                FROM students
                WHERE enrollment_status = 'active'
                GROUP BY section_id
            ) cnt ON cnt.section_id = s.id
        `);

        // Insert section summary rows (for backward compatibility)
        for (const r of counts.rows) {
            await client.query(`
                INSERT INTO section_snapshot_items 
                (group_id, section_id, section_name, grade_level, count, adviser_name, teacher_name)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [groupId, r.section_id, r.section_name, r.grade_level, r.count, r.adviser_name || null, null]);
        }

        // Insert individual student records
        for (const student of students.rows) {
            const barangay = extractBarangay(student.current_address);
            await client.query(`
                INSERT INTO section_snapshot_items 
                (group_id, section_id, section_name, grade_level, student_name, last_name, first_name, current_address, barangay_extracted, adviser_name, teacher_name)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                groupId,
                student.section_id,
                student.section_name,
                student.grade_level,
                student.full_name,
                student.last_name,
                student.first_name,
                student.current_address,
                barangay,
                student.adviser_name,
                student.adviser_name  // Using adviser_name as teacher_name for now
            ]);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: `Snapshot '${finalSnapshotName}' saved with ${students.rows.length} students`, group: g.rows[0] });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (e) {}
        console.error('Error creating snapshot group:', err);
        res.status(500).json({ success: false, message: 'Error creating snapshot: ' + err.message });
    } finally {
        client.release();
    }
});

// List snapshot groups
app.get('/api/sections/snapshots', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    try {
        // Ensure tables exist with EXACT same schema as POST endpoint (but DO NOT drop them - we need to preserve data)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_groups (
                id SERIAL PRIMARY KEY,
                snapshot_name TEXT NOT NULL UNIQUE,
                created_by INTEGER,
                is_archived BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS section_snapshot_items (
                id SERIAL PRIMARY KEY,
                group_id INTEGER NOT NULL REFERENCES section_snapshot_groups(id) ON DELETE CASCADE,
                section_id INTEGER,
                section_name TEXT,
                grade_level TEXT,
                adviser_name TEXT,
                student_full_name TEXT,
                current_address TEXT,
                barangay_extracted TEXT,
                teacher_name TEXT,
                sex TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const groups = await pool.query(`SELECT id, snapshot_name, created_by, is_archived, created_at FROM section_snapshot_groups ORDER BY created_at DESC`);
        res.json({ success: true, groups: groups.rows });
    } catch (err) {
        console.error('Error listing snapshot groups:', err);
        res.status(500).json({ success: false, message: 'Error listing snapshots' });
    }
});

// Get items for a snapshot group
app.get('/api/sections/snapshots/:id/items', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const gid = req.params.id;
    try {
        const items = await pool.query('SELECT id, section_id, section_name, grade_level, adviser_name FROM section_snapshot_items WHERE group_id = $1 AND student_full_name IS NULL GROUP BY section_name, grade_level, adviser_name, section_id ORDER BY grade_level, section_name', [gid]);
        res.json({ success: true, items: items.rows });
    } catch (err) {
        console.error('Error fetching snapshot items:', err);
        res.status(500).json({ success: false, message: 'Error fetching snapshot items' });
    }
});

// Get student-level details for a snapshot group with barangay count per section
app.get('/api/sections/snapshots/:id/students', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const gid = req.params.id;
    try {
        // Get all student records from snapshot
        const students = await pool.query(`
            SELECT 
                id,
                section_id,
                section_name,
                grade_level,
                student_full_name,
                current_address,
                barangay_extracted,
                adviser_name,
                teacher_name,
                sex
            FROM section_snapshot_items 
            WHERE group_id = $1 AND student_full_name IS NOT NULL
            ORDER BY section_name, student_full_name
        `, [gid]);

        // Get barangay count per section
        const barangayCounts = await pool.query(`
            SELECT 
                section_name,
                barangay_extracted,
                COUNT(*) as barangay_count
            FROM section_snapshot_items 
            WHERE group_id = $1 AND student_name IS NOT NULL AND barangay_extracted IS NOT NULL
            GROUP BY section_name, barangay_extracted
            ORDER BY section_name, barangay_extracted
        `, [gid]);

        res.json({ 
            success: true, 
            students: students.rows,
            barangay_counts: barangayCounts.rows 
        });
    } catch (err) {
        console.error('Error fetching snapshot students:', err);
        res.status(500).json({ success: false, message: 'Error fetching snapshot students' });
    }
});

// Get snapshot with sections and students grouped by section
app.get('/api/snapshots/:id/full-data', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const groupId = req.params.id;
    try {
        // Get snapshot group info
        const groupRes = await pool.query(
            'SELECT id, snapshot_name, created_at FROM section_snapshot_groups WHERE id = $1',
            [groupId]
        );
        if (groupRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Snapshot not found' });
        }
        const group = groupRes.rows[0];

        // Get all items from the snapshot - both section summaries and student records
        const itemsRes = await pool.query(`
            SELECT 
                id, group_id, section_name, grade_level, "count", adviser_name,
                student_full_name, current_address, barangay_extracted, sex
            FROM section_snapshot_items 
            WHERE group_id = $1
            ORDER BY grade_level, section_name, student_full_name
        `, [groupId]);

        // Organize by section
        const sections = {};
        const sectionOrder = [];

        itemsRes.rows.forEach(item => {
            const sectionKey = `${item.grade_level}|${item.section_name}`;
            
            if (!sections[sectionKey]) {
                sections[sectionKey] = {
                    grade_level: item.grade_level,
                    section_name: item.section_name,
                    adviser_name: item.adviser_name || '-',
                    student_count: 0,
                    students: []
                };
                sectionOrder.push(sectionKey);
            }

            // Only add if it's a student record (has student_full_name and is NOT just a section summary)
            if (item.student_full_name && item.student_full_name !== '-' && item.student_full_name !== item.section_name) {
                sections[sectionKey].students.push({
                    name: item.student_full_name,
                    barangay: item.barangay_extracted || 'Others',
                    address: item.current_address || '-',
                    sex: item.sex || 'N/A'
                });
                sections[sectionKey].student_count++;
            }
        });

        // Build final response
        const sectionsArray = sectionOrder.map(key => sections[key]);

        res.json({
            success: true,
            snapshot: {
                id: group.id,
                name: group.snapshot_name,
                created_at: group.created_at
            },
            sections: sectionsArray
        });
    } catch (err) {
        console.error('Error fetching full snapshot data:', err);
        res.status(500).json({ success: false, message: 'Error fetching snapshot data: ' + err.message });
    }
});

// Archive (soft-delete) snapshot group
app.put('/api/sections/snapshots/:id/archive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') return res.status(403).json({ success: false, message: 'Access denied' });
    const gid = req.params.id;
    try {
        const r = await pool.query('UPDATE section_snapshot_groups SET is_archived = true WHERE id = $1 RETURNING id', [gid]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Snapshot not found' });
        res.json({ success: true, message: 'Snapshot archived' });
    } catch (err) {
        console.error('Error archiving snapshot:', err);
        res.status(500).json({ success: false, message: 'Error archiving snapshot' });
    }
});

// Recover snapshot group
app.put('/api/sections/snapshots/:id/recover', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') return res.status(403).json({ success: false, message: 'Access denied' });
    const gid = req.params.id;
    try {
        const r = await pool.query('UPDATE section_snapshot_groups SET is_archived = false WHERE id = $1 RETURNING id', [gid]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Snapshot not found' });
        res.json({ success: true, message: 'Snapshot recovered' });
    } catch (err) {
        console.error('Error recovering snapshot:', err);
        res.status(500).json({ success: false, message: 'Error recovering snapshot' });
    }
});

// Permanently delete snapshot group and its items
app.delete('/api/sections/snapshots/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') return res.status(403).json({ success: false, message: 'Access denied' });
    const gid = req.params.id;
    try {
        const r = await pool.query('DELETE FROM section_snapshot_groups WHERE id = $1 RETURNING id', [gid]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Snapshot not found' });
        res.json({ success: true, message: 'Snapshot permanently deleted' });
    } catch (err) {
        console.error('Error deleting snapshot:', err);
        res.status(500).json({ success: false, message: 'Error deleting snapshot' });
    }
});

// ICT Coordinator: Reset all sections (unassign students). Optionally save snapshot first by providing { snapshotName }
app.post('/api/sections/reset', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { snapshotName } = req.body || {};
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Optionally save snapshot
        if (snapshotName && String(snapshotName).trim()) {
            const name = String(snapshotName).trim();
            await client.query(`
                CREATE TABLE IF NOT EXISTS section_snapshots (
                    id SERIAL PRIMARY KEY,
                    snapshot_name TEXT NOT NULL,
                    section_id INTEGER,
                    section_name TEXT,
                    grade_level TEXT,
                    count INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const counts = await client.query(`
                SELECT s.id AS section_id, s.section_name, s.grade_level, COALESCE(cnt.cnt, 0) AS count
                FROM sections s
                LEFT JOIN (
                    SELECT section_id, COUNT(*) AS cnt
                    FROM students
                    WHERE enrollment_status = 'active'
                    GROUP BY section_id
                ) cnt ON cnt.section_id = s.id
            `);

            for (const r of counts.rows) {
                await client.query(`
                    INSERT INTO section_snapshots (snapshot_name, section_id, section_name, grade_level, count)
                    VALUES ($1, $2, $3, $4, $5)
                `, [name, r.section_id, r.section_name, r.grade_level, r.count]);
            }
        }

        // Count how many students will be unassigned
        const countRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM students WHERE enrollment_status = 'active' AND section_id IS NOT NULL`);
        const toUnassign = countRes.rows[0].cnt || 0;

        // Unassign students from sections (move to unassigned)
        await client.query(`UPDATE students SET section_id = NULL WHERE enrollment_status = 'active' AND section_id IS NOT NULL`);

        await client.query('COMMIT');
        res.json({ success: true, message: `Reset completed. ${toUnassign} student(s) moved to Unassigned.`, unassigned: toUnassign });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error performing reset of sections:', err);
        res.status(500).json({ success: false, message: 'Error resetting sections' });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Create new section
app.post('/api/sections', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { section_name, grade_level, max_capacity, adviser_name, room_number } = req.body;

    try {
        // Check if section name already exists
        const existing = await pool.query('SELECT id FROM sections WHERE section_name = $1', [section_name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Section name already exists' });
        }

        const result = await pool.query(`
            INSERT INTO sections (section_name, grade_level, max_capacity, adviser_name, room_number)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [section_name, grade_level, max_capacity || 40, adviser_name || null, room_number || null]);

        res.json({ success: true, message: 'Section created successfully', section: result.rows[0] });
    } catch (err) {
        console.error('Error creating section:', err);
        res.status(500).json({ success: false, message: 'Error creating section: ' + err.message });
    }
});

// ICT Coordinator: Update section
app.put('/api/sections/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;
    const { section_name, grade_level, max_capacity, adviser_name, room_number, is_active } = req.body;

    try {
        // Check if new section name conflicts with existing (excluding current section)
        if (section_name) {
            const existing = await pool.query(
                'SELECT id FROM sections WHERE section_name = $1 AND id != $2', 
                [section_name, sectionId]
            );
            if (existing.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Section name already exists' });
            }
        }

        const result = await pool.query(`
            UPDATE sections 
            SET section_name = COALESCE($1, section_name),
                grade_level = COALESCE($2, grade_level),
                max_capacity = COALESCE($3, max_capacity),
                adviser_name = $4,
                room_number = $5,
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [section_name, grade_level, max_capacity, adviser_name, room_number, is_active, sectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, message: 'Section updated successfully', section: result.rows[0] });
    } catch (err) {
        console.error('Error updating section:', err);
        res.status(500).json({ success: false, message: 'Error updating section: ' + err.message });
    }
});

// ICT Coordinator: Delete section (soft delete - mark as inactive)
app.delete('/api/sections/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;

    try {
        // Check if section has enrolled students
        const students = await pool.query('SELECT COUNT(*) FROM students WHERE section_id = $1', [sectionId]);
        const studentCount = parseInt(students.rows[0].count);

        if (studentCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete section with ${studentCount} enrolled student(s). Please reassign students first.` 
            });
        }

        // Soft delete - mark as inactive
        const result = await pool.query(`
            UPDATE sections 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1
            RETURNING *
        `, [sectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, message: 'Section deactivated successfully' });
    } catch (err) {
        console.error('Error deleting section:', err);
        res.status(500).json({ success: false, message: 'Error deleting section: ' + err.message });
    }
});

// ICT Coordinator: Toggle section active/inactive status
app.put('/api/sections/:id/toggle', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;

    try {
        // Get current status and toggle it
        const current = await pool.query('SELECT is_active FROM sections WHERE id = $1', [sectionId]);
        
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const newStatus = !current.rows[0].is_active;

        const result = await pool.query(`
            UPDATE sections 
            SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
            RETURNING *
        `, [newStatus, sectionId]);

        const statusText = newStatus ? 'activated' : 'deactivated';
        res.json({ success: true, message: `Section ${statusText} successfully`, is_active: newStatus });
    } catch (err) {
        console.error('Error toggling section status:', err);
        res.status(500).json({ success: false, message: 'Error toggling section status: ' + err.message });
    }
});

// ICT Coordinator: Remove adviser from a section
app.put('/api/sections/:id/adviser/remove', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;

    try {
        let result;
        try {
            // Clear both name and teacher id if column exists
            result = await pool.query(
                `UPDATE sections SET adviser_name = NULL, adviser_teacher_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, section_name`,
                [sectionId]
            );
        } catch (e) {
            // Fallback when adviser_teacher_id doesn't exist
            result = await pool.query(
                `UPDATE sections SET adviser_name = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, section_name`,
                [sectionId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, message: `Adviser removed from section ${result.rows[0].section_name}` });
    } catch (err) {
        console.error('Error removing adviser:', err);
        res.status(500).json({ success: false, message: 'Error removing adviser: ' + err.message });
    }
});

// ICT Coordinator: Permanently delete section
app.delete('/api/sections/:id/permanent', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;

    try {
        // Check if section has enrolled students
        const students = await pool.query('SELECT COUNT(*) FROM students WHERE section_id = $1', [sectionId]);
        const studentCount = parseInt(students.rows[0].count);

        if (studentCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot permanently delete section with ${studentCount} enrolled student(s). Please reassign students first.` 
            });
        }

        // Permanently delete from database
        const result = await pool.query('DELETE FROM sections WHERE id = $1 RETURNING *', [sectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, message: 'Section permanently deleted' });
    } catch (err) {
        console.error('Error permanently deleting section:', err);
        res.status(500).json({ success: false, message: 'Error permanently deleting section: ' + err.message });
    }
});

// ICT Coordinator: Get students by section ID
// ICT Coordinator: View section details page (full page, not modal)
app.get('/sections/:id/view', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.redirect('/login');
    }

    const sectionId = req.params.id;

    try {
        // Get section details
        const sectionResult = await pool.query(`
            SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number, is_active
            FROM sections 
            WHERE id = $1
        `, [sectionId]);

        if (sectionResult.rows.length === 0) {
            return res.status(404).send('Section not found');
        }

        const section = sectionResult.rows[0];

        // Get students in this section with full details
        const studentsResult = await pool.query(`
            SELECT 
                st.id,
                st.enrollment_id,
                st.lrn,
                st.grade_level,
                st.last_name,
                st.first_name,
                (st.last_name || ', ' || st.first_name) as full_name,
                st.current_address,
                COALESCE(st.created_at, CURRENT_TIMESTAMP)::date as enrollment_date,
                st.enrollment_status
            FROM students st
            WHERE st.section_id = $1 AND st.enrollment_status = 'active'
            ORDER BY st.last_name, st.first_name
        `, [sectionId]);

        res.render('sectionView', { 
            section: section,
            students: studentsResult.rows
        });
    } catch (err) {
        console.error('Error loading section view:', err);
        res.status(500).send('Error loading section details');
    }
});

app.get('/api/sections/:id/students', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const sectionId = req.params.id;

    try {
        // Get section details
        const sectionResult = await pool.query(`
            SELECT id, section_name, grade_level, max_capacity, current_count, adviser_name, room_number
            FROM sections 
            WHERE id = $1
        `, [sectionId]);

        if (sectionResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const section = sectionResult.rows[0];

        // Get students in this section
        const studentsResult = await pool.query(`
            SELECT 
                st.id,
                st.lrn,
                (st.last_name || ', ' || st.first_name || ' ' || COALESCE(st.middle_name, '') || ' ' || COALESCE(st.ext_name, '')) as full_name,
                st.last_name,
                st.first_name,
                COALESCE(st.sex, 'N/A') as sex,
                COALESCE(st.age, 0) as age,
                st.guardian_contact,
                st.current_address,
                COALESCE(st.created_at, CURRENT_TIMESTAMP)::date as enrollment_date,
                st.enrollment_status
            FROM students st
            WHERE st.section_id = $1 AND st.enrollment_status = 'active'
            ORDER BY st.last_name, st.first_name
        `, [sectionId]);

        // Count male and female students
        const maleCount = studentsResult.rows.filter(s => s.sex === 'Male').length;
        const femaleCount = studentsResult.rows.filter(s => s.sex === 'Female').length;

        res.json({ 
            success: true, 
            section: section,
            students: studentsResult.rows,
            statistics: {
                total: studentsResult.rows.length,
                male: maleCount,
                female: femaleCount
            }
        });
    } catch (err) {
        console.error('Error fetching section students:', err);
        res.status(500).json({ success: false, message: 'Error fetching section students' });
    }
});

// ICT Coordinator: Reassign student to a new section
app.put('/api/students/:id/reassign', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const { newSectionId } = req.body;
    
    console.log(`ðŸ”„ REASSIGN REQUEST: studentId=${studentId}, newSectionId=${newSectionId}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if this is an enrollment_requests student (ID starts with 'ER')
        if (String(studentId).startsWith('ER')) {
            // Extract the actual enrollment_requests ID
            const enrollmentId = parseInt(String(studentId).substring(2));

            // Get enrollment_requests details (new system)
            const enrollmentResult = await client.query('SELECT * FROM enrollment_requests WHERE id = $1', [enrollmentId]);
            if (enrollmentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Enrollment request not found' });
            }

            const enrollment = enrollmentResult.rows[0];

            // Verify new section exists and has capacity
            const newSectionResult = await client.query(`
                SELECT id, section_name, max_capacity, current_count 
                FROM sections 
                WHERE id = $1 AND is_active = true
            `, [newSectionId]);

            if (newSectionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'New section not found or inactive' });
            }

            const newSection = newSectionResult.rows[0];

            if (newSection.current_count >= newSection.max_capacity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: `Section ${newSection.section_name} is full (${newSection.current_count}/${newSection.max_capacity})` 
                });
            }

            // Insert into students table from enrollment_requests
            // First check if student already exists
            const existingStudent = await client.query(
                'SELECT id FROM students WHERE lrn = $1 AND school_year = $2',
                [enrollment.lrn, enrollment.school_year]
            );

            let studentRecordId;
            if (existingStudent.rows.length > 0) {
                // Update existing record
                const updateResult = await client.query(`
                    UPDATE students SET 
                        section_id = $1, 
                        enrollment_status = 'active',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE lrn = $2 AND school_year = $3
                    RETURNING id
                `, [newSectionId, enrollment.lrn, enrollment.school_year]);
                studentRecordId = updateResult.rows[0].id;
            } else {
                // Insert new record
                const insertResult = await client.query(`
                    INSERT INTO students (
                        lrn, school_year, grade_level, last_name, first_name, middle_name, ext_name,
                        birthday, age, sex, religion, current_address, contact_number,
                        enrollment_status, section_id, ip_community, pwd
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    RETURNING id
                `, [
                    enrollment.lrn,
                    enrollment.school_year,
                    enrollment.grade_level,
                    enrollment.last_name,
                    enrollment.first_name,
                    enrollment.middle_name || null,
                    enrollment.ext_name || null,
                    enrollment.birthday,
                    enrollment.age,
                    enrollment.sex,
                    enrollment.religion || null,
                    enrollment.current_address,
                    enrollment.contact_number || null,
                    'active',
                    newSectionId,
                    'N/A',
                    'N/A'
                ]);
                studentRecordId = insertResult.rows[0].id;
            }

            // Increment new section count
            await client.query('UPDATE sections SET current_count = current_count + 1 WHERE id = $1', [newSectionId]);

            await client.query('COMMIT');
            res.json({ success: true, message: `Student assigned to ${newSection.section_name}` });
        } else {
            // Handle regular students table
            // Get current student info
            const studentResult = await client.query('SELECT section_id FROM students WHERE id = $1', [studentId]);
            if (studentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            const oldSectionId = studentResult.rows[0].section_id;

            // Verify new section exists and has capacity
            const newSectionResult = await client.query(`
                SELECT id, section_name, max_capacity, current_count 
                FROM sections 
                WHERE id = $1 AND is_active = true
            `, [newSectionId]);

            if (newSectionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'New section not found or inactive' });
            }

            const newSection = newSectionResult.rows[0];

            if (newSection.current_count >= newSection.max_capacity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: `Section ${newSection.section_name} is full (${newSection.current_count}/${newSection.max_capacity})` 
                });
            }

            // Update student's section
            await client.query('UPDATE students SET section_id = $1 WHERE id = $2', [newSectionId, studentId]);

            // Decrement old section count (if student had a section)
            if (oldSectionId) {
                await client.query('UPDATE sections SET current_count = current_count - 1 WHERE id = $1', [oldSectionId]);
            }

            // Increment new section count
            await client.query('UPDATE sections SET current_count = current_count + 1 WHERE id = $1', [newSectionId]);

            await client.query('COMMIT');
            res.json({ success: true, message: `Student reassigned to ${newSection.section_name}` });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('âŒ Error reassigning student ER19:', err);
        console.error('Error Code:', err.code);
        console.error('Error Detail:', err.detail);
        console.error('Error Hint:', err.hint);
        console.error('Stack:', err.stack);
        res.status(500).json({ success: false, message: 'Error reassigning student: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Remove student from section (unassign)
app.put('/api/students/:id/remove-section', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get current student info
        const studentResult = await client.query('SELECT section_id FROM students WHERE id = $1', [studentId]);
        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const currentSectionId = studentResult.rows[0].section_id;

        if (!currentSectionId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Student is not assigned to any section' });
        }

        // Remove student from section (set section_id to NULL)
        await client.query('UPDATE students SET section_id = NULL WHERE id = $1', [studentId]);

        // Decrement section count
        await client.query('UPDATE sections SET current_count = current_count - 1 WHERE id = $1', [currentSectionId]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Student removed from section and moved to unassigned' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error removing student from section:', err);
        res.status(500).json({ success: false, message: 'Error removing student: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Get unassigned students (students with section_id = NULL from students table OR newly approved from early_registration)
app.get('/api/students/unassigned', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        // Query 1: Get unassigned students from students table (section_id IS NULL) - INCLUDES ARCHIVED
        const studentsResult = await pool.query(`
            SELECT 
                st.id,
                st.lrn,
                (st.last_name || ', ' || st.first_name) as full_name,
                st.grade_level,
                COALESCE(st.sex, 'N/A') as sex,
                COALESCE(st.age, 0) as age,
                st.contact_number,
                COALESCE(st.created_at, CURRENT_TIMESTAMP)::date as enrollment_date,
                st.enrollment_status,
                CASE WHEN st.is_archived IS NULL THEN false ELSE st.is_archived END as is_archived,
                'students' as source
            FROM students st
            WHERE st.section_id IS NULL OR st.is_archived = true
            ORDER BY st.is_archived, st.grade_level, st.last_name, st.first_name
        `);

        // Query 2: Get newly approved students from enrollment_requests (approved status, not yet added to students table)
        const approvedEnrollmentsResult = await pool.query(`
            SELECT 
                'ER' || er.id as id,
                er.lrn,
                (er.last_name || ', ' || er.first_name || ' ' || COALESCE(er.middle_name, '') || ' ' || COALESCE(er.ext_name, '')) as full_name,
                er.grade_level,
                COALESCE(er.sex, 'N/A') as sex,
                COALESCE(er.age, 0) as age,
                er.contact_number,
                er.created_at as enrollment_date,
                'approved' as enrollment_status,
                false as is_archived,
                'enrollment_requests' as source
            FROM enrollment_requests er
            WHERE er.status = 'approved'
            AND NOT EXISTS (
                SELECT 1 FROM students st 
                WHERE st.lrn = er.lrn 
                AND st.school_year = er.school_year
            )
            ORDER BY er.grade_level, er.last_name, er.first_name
        `);

        // Combine results: students first (already in system), then newly approved enrollments
        const combinedResults = [...studentsResult.rows, ...approvedEnrollmentsResult.rows];

        res.json(combinedResults);
    } catch (err) {
        console.error('Error fetching unassigned students:', err);
        res.status(500).json({ success: false, message: 'Error fetching unassigned students' });
    }
});

// ICT Coordinator: Archive a student
app.put('/api/students/:id/archive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Check if this is an enrollment_requests student (starts with 'ER')
        if (String(studentId).startsWith('ER')) {
            // It's an enrollment_requests record - cannot archive, must delete from enrollment_requests
            const enrollmentId = parseInt(String(studentId).substring(2));
            const enrollmentResult = await client.query(
                'SELECT first_name, last_name FROM enrollment_requests WHERE id = $1',
                [enrollmentId]
            );
            
            if (enrollmentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            const student = enrollmentResult.rows[0];
            const fullName = `${student.last_name}, ${student.first_name}`;
            
            // Delete from enrollment_requests
            await client.query('DELETE FROM enrollment_requests WHERE id = $1', [enrollmentId]);
            
            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student "${fullName}" has been permanently deleted.`
            });
        } else {
            // It's a regular student - archive it
            const studentResult = await client.query(
                'SELECT first_name, last_name, section_id FROM students WHERE id = $1',
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            const student = studentResult.rows[0];
            const fullName = `${student.last_name}, ${student.first_name}`;

            // Archive the student
            await client.query(
                'UPDATE students SET is_archived = true WHERE id = $1',
                [studentId]
            );

            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student "${fullName}" has been archived successfully.`
            });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error archiving student:', err);
        res.status(500).json({ success: false, message: 'Error archiving student: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Unarchive (restore) a student
app.put('/api/students/:id/unarchive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get student info
        const studentResult = await client.query(
            'SELECT first_name, last_name FROM students WHERE id = $1',
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = studentResult.rows[0];
        const fullName = `${student.last_name}, ${student.first_name}`;

        // Restore the student
        await client.query(
            'UPDATE students SET is_archived = false WHERE id = $1',
            [studentId]
        );

        await client.query('COMMIT');
        res.json({ 
            success: true, 
            message: `Student "${fullName}" has been restored successfully.`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error restoring student:', err);
        res.status(500).json({ success: false, message: 'Error restoring student' });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Permanently delete an archived student
app.delete('/api/students/:id/delete', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Check if this is an enrollment_requests student (starts with 'ER')
        if (String(studentId).startsWith('ER')) {
            // It's an enrollment_requests record - delete directly
            const enrollmentId = parseInt(String(studentId).substring(2));
            const enrollmentResult = await client.query(
                'SELECT first_name, last_name FROM enrollment_requests WHERE id = $1',
                [enrollmentId]
            );
            
            if (enrollmentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            const student = enrollmentResult.rows[0];
            const fullName = `${student.last_name}, ${student.first_name}`;
            
            // Permanently delete from enrollment_requests
            await client.query('DELETE FROM enrollment_requests WHERE id = $1', [enrollmentId]);
            
            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student "${fullName}" has been permanently deleted.`
            });
        } else {
            // It's a regular student - delete permanently
            const studentResult = await client.query(
                'SELECT first_name, last_name FROM students WHERE id = $1',
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Student not found' });
            }

            const student = studentResult.rows[0];
            const fullName = `${student.last_name}, ${student.first_name}`;

            // Permanently delete the student
            await client.query('DELETE FROM students WHERE id = $1', [studentId]);

            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Student "${fullName}" has been permanently deleted.`
            });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting student:', err);
        res.status(500).json({ success: false, message: 'Error deleting student: ' + err.message });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Recover (alias for unarchive) a student
app.put('/api/students/:id/recover', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get student info
        const studentResult = await client.query(
            `SELECT last_name || ', ' || first_name || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as full_name FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = studentResult.rows[0];

        // Restore the student
        await client.query(
            'UPDATE students SET is_archived = false WHERE id = $1',
            [studentId]
        );

        await client.query('COMMIT');
        res.json({ 
            success: true, 
            message: `Student "${student.full_name}" has been recovered successfully.`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error recovering student:', err);
        res.status(500).json({ success: false, message: 'Error recovering student' });
    } finally {
        client.release();
    }
});

// Teacher: Update student grade level (with tracking)
app.put('/api/students/:id/update-grade-level', async (req, res) => {
    // Allow both teachers and ictcoor to update
    if (!req.session.user || !['teacher', 'ictcoor'].includes(req.session.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = parseInt(req.params.id);
    const { newGradeLevel } = req.body;
    const userName = req.session.user.name || req.session.user.email || 'Unknown User';
    
    console.log(`\n📚 GRADE UPDATE REQUEST: Student ${studentId}, New Grade: ${newGradeLevel}, Updated By: ${userName}`);
    
    if (!newGradeLevel || newGradeLevel.trim() === '') {
        return res.status(400).json({ success: false, message: 'Grade level is required' });
    }

    try {
        // Get current student info (simple query, no transaction)
        const studentResult = await pool.query(
            `SELECT id, grade_level, last_name || ', ' || first_name as full_name 
             FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = studentResult.rows[0];
        const oldGradeLevel = student.grade_level;

        console.log(`   Current Grade in DB: ${oldGradeLevel}`);
        console.log(`   Requested New Grade: ${newGradeLevel}`);

        // Don't update if grade is the same
        if (oldGradeLevel === newGradeLevel) {
            console.log(`   ⚠️  Grades match - no update needed`);
            return res.status(400).json({ success: false, message: 'New grade level is the same as current grade level' });
        }

        // Update student grade level with tracking info - WITHOUT transaction
        const updateResult = await pool.query(
            `UPDATE students 
             SET grade_level = $1, 
                 previous_grade_level = $2,
                 grade_level_updated_date = CURRENT_TIMESTAMP,
                 grade_level_updated_by = $3,
                 updated_at = CURRENT_TIMESTAMP,
                 needs_reassignment_due_to_grade_change = true
             WHERE id = $4
             RETURNING id, grade_level`,
            [newGradeLevel, oldGradeLevel, userName, studentId]
        );
        
        console.log(`   ✅ UPDATE executed - ${updateResult.rowCount} row(s) updated`);
        
        if (updateResult.rowCount === 0) {
            console.log(`   ❌ WARNING: Update returned 0 rows!`);
            return res.status(500).json({ success: false, message: 'Failed to update student grade level' });
        }
        
        const updatedStudent = updateResult.rows[0];
        console.log(`   ✅ VERIFIED: Grade level in DB is now: ${updatedStudent.grade_level}`);

        // Remove student from their current section (if they have one)
        const sectionCheckResult = await pool.query(
            `SELECT section_id FROM students WHERE id = $1`,
            [studentId]
        );
        
        if (sectionCheckResult.rows[0]?.section_id) {
            const oldSectionId = sectionCheckResult.rows[0].section_id;
            
            // Remove from section
            await pool.query(
                `UPDATE students SET section_id = NULL WHERE id = $1`,
                [studentId]
            );
            
            // Decrement section count
            await pool.query(
                `UPDATE sections SET current_count = current_count - 1 WHERE id = $1`,
                [oldSectionId]
            );
            
            console.log(`   ✅ Student removed from section ${oldSectionId} due to grade level change`);
        }

        // Log the change in grade_level_changes table (if it exists)
        try {
            await pool.query(
                `INSERT INTO grade_level_changes (student_id, old_grade_level, new_grade_level, changed_by, teacher_id)
                 VALUES ($1, $2, $3, $4, NULL)`,
                [studentId, oldGradeLevel, newGradeLevel, userName]
            );
            console.log(`   ✅ Change logged to grade_level_changes table`);
        } catch (e) {
            // Table may not exist yet, that's okay - the main update succeeded
            console.log('   ⚠️  Grade level changes table not available');
        }

        res.json({
            success: true,
            message: `Student "${student.full_name}" grade level updated from ${oldGradeLevel} to ${newGradeLevel}`,
            oldGradeLevel,
            newGradeLevel,
            updatedBy: userName,
            updatedAt: new Date().toISOString()
        });

    } catch (err) {
        console.error('   ❌ Error updating student grade level:', err.message);
        res.status(500).json({ success: false, message: 'Error updating grade level: ' + err.message });
    }
});

// ICT Coordinator: Get students with recent grade level updates (for dashboard)
app.get('/api/students/grade-updates/recent', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const daysBack = req.query.days || 30; // Show updates from last 30 days

    try {
        const result = await pool.query(
            `SELECT 
                id,
                CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, '')) as full_name,
                lrn,
                previous_grade_level,
                grade_level,
                grade_level_updated_date,
                grade_level_updated_by,
                section_id,
                (SELECT section_name FROM sections WHERE id = students.section_id) as current_section
             FROM students
             WHERE grade_level_updated_date IS NOT NULL
             AND grade_level_updated_date > CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
             ORDER BY grade_level_updated_date DESC
             LIMIT 50`,
            [daysBack]
        );

        res.json({
            success: true,
            count: result.rows.length,
            updates: result.rows
        });
    } catch (err) {
        console.error('Error fetching grade updates:', err);
        res.status(500).json({ success: false, message: 'Error fetching grade updates' });
    }
});

// ICT Coordinator: Permanently delete a student
app.delete('/api/students/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get student info
        const studentResult = await client.query(
            `SELECT last_name || ', ' || first_name || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '') as full_name FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = studentResult.rows[0];

        // Delete the student and all related records
        await client.query('DELETE FROM students WHERE id = $1', [studentId]);

        await client.query('COMMIT');
        res.json({ 
            success: true, 
            message: `Student "${student.full_name}" has been permanently deleted.`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting student:', err);
        res.status(500).json({ success: false, message: 'Error deleting student' });
    } finally {
        client.release();
    }
});

// ICT Coordinator: Get archived students
app.get('/api/students/archived', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.enrollment_id,
                s.lrn,
                s.grade_level,
                s.last_name,
                s.first_name,
                NULL::VARCHAR as middle_name,
                NULL::VARCHAR as ext_name,
                s.last_name || ', ' || s.first_name AS full_name,
                NULL::INTEGER as age,
                NULL::VARCHAR as sex,
                NULL::VARCHAR as contact_number,
                sec.section_name as assigned_section,
                COALESCE(s.created_at, CURRENT_TIMESTAMP)::date as enrollment_date
            FROM students s
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.is_archived = true
            ORDER BY s.grade_level, s.last_name, s.first_name
        `);

        res.json({ success: true, students: result.rows });
    } catch (err) {
        console.error('Error fetching archived students:', err);
        res.status(500).json({ success: false, message: 'Error fetching archived students' });
    }
});

// ICT Coordinator: Get ALL students (both active and archived) for checkbox filtering
app.get('/api/students/all', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        // Get students from students table (both active and archived)
        console.log('ðŸ“š Fetching all students...');
        const studentsResult = await pool.query(`
            SELECT 
                s.id,
                s.enrollment_id,
                s.lrn,
                s.grade_level,
                s.last_name,
                s.first_name,
                NULL::VARCHAR as middle_name,
                s.last_name || ', ' || s.first_name AS full_name,
                NULL::VARCHAR as ext_name,
                NULL::INTEGER as age,
                s.sex,
                NULL::VARCHAR as contact_number,
                s.current_address,
                sec.section_name as assigned_section,
                sec.adviser_name as adviser_name,
                COALESCE(s.enrollment_date, CURRENT_TIMESTAMP)::date as enrollment_date,
                s.enrollment_status,
                CASE WHEN s.is_archived IS NULL THEN false ELSE s.is_archived END as is_archived
            FROM students s
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.enrollment_status = 'active'
            AND s.grade_level IN ('Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Non-Graded')
            ORDER BY 
                CASE 
                    WHEN s.grade_level = 'Kindergarten' THEN 1
                    WHEN s.grade_level = 'Grade 1' THEN 2
                    WHEN s.grade_level = 'Grade 2' THEN 3
                    WHEN s.grade_level = 'Grade 3' THEN 4
                    WHEN s.grade_level = 'Grade 4' THEN 5
                    WHEN s.grade_level = 'Grade 5' THEN 6
                    WHEN s.grade_level = 'Grade 6' THEN 7
                    WHEN s.grade_level = 'Non-Graded' THEN 8
                    ELSE 9
                END,
                s.last_name, s.first_name
        `);
        console.log(`âœ… Found ${studentsResult.rows.length} active students`);

        // Also get enrollees who haven't been assigned yet (pending)
        console.log('ðŸ“ Fetching pending enrollees...');
        const enrolleesResult = await pool.query(`
            SELECT 
                'ER' || er.id::text as id,
                er.id::text as enrollment_id,
                er.lrn,
                er.grade_level,
                er.last_name,
                er.first_name,
                er.middle_name,
                COALESCE(er.ext_name, '') as ext_name,
                er.last_name || ', ' || er.first_name || ' ' || COALESCE(er.middle_name || ' ', '') || COALESCE(er.ext_name, '') as full_name,
                COALESCE(er.age, 0) as age,
                COALESCE(er.sex, 'N/A') as sex,
                er.contact_number,
                er.current_address,
                NULL as assigned_section,
                NULL as adviser_name,
                er.created_at as enrollment_date,
                'pending' as enrollment_status,
                false as is_archived
            FROM early_registration er
            WHERE NOT EXISTS (
                SELECT 1 FROM students st WHERE st.enrollment_id::text = er.id::text
            )
            AND er.grade_level IN ('Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Non-Graded')
            ORDER BY 
                CASE 
                    WHEN er.grade_level = 'Kindergarten' THEN 1
                    WHEN er.grade_level = 'Grade 1' THEN 2
                    WHEN er.grade_level = 'Grade 2' THEN 3
                    WHEN er.grade_level = 'Grade 3' THEN 4
                    WHEN er.grade_level = 'Grade 4' THEN 5
                    WHEN er.grade_level = 'Grade 5' THEN 6
                    WHEN er.grade_level = 'Grade 6' THEN 7
                    WHEN er.grade_level = 'Non-Graded' THEN 8
                    ELSE 9
                END,
                er.last_name, er.first_name
        `);
        console.log(`âœ… Found ${enrolleesResult.rows.length} pending enrollees`);

        // Combine: pending enrollees + all students (active & archived)
        const allStudents = [...enrolleesResult.rows, ...studentsResult.rows];
        console.log(`âœ… Total students (active + pending): ${allStudents.length}`);

        res.json({ success: true, students: allStudents });
    } catch (err) {
        console.error('âŒ Error fetching all students:', err.message);
        console.error('Full error details:', {
            code: err.code,
            message: err.message,
            detail: err.detail,
            hint: err.hint,
            position: err.position,
            query: err.query
        });
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching students',
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.detail : undefined
        });
    }
});

// ICT Coordinator: Get full student details by ID
app.get('/api/student/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let studentId = req.params.id;
    try {
        // Check if this is an early_registration student (ID starts with 'ER')
        if (String(studentId).startsWith('ER')) {
            // Extract the numeric ID from the ER prefix
            const erNumericId = parseInt(String(studentId).substring(2));
            
            // Query early_registration table
            const result = await pool.query(`
                SELECT 
                    'ER' || id::text as id,
                    gmail_address,
                    school_year,
                    lrn,
                    grade_level,
                    last_name,
                    first_name,
                    middle_name,
                    ext_name,
                    (last_name || ', ' || first_name || ' ' || COALESCE(middle_name, '') || ' ' || COALESCE(ext_name, '')) AS full_name,
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
                    assigned_section,
                    signature_image_path,
                    created_at,
                    updated_at
                FROM early_registration
                WHERE id = $1
            `, [erNumericId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Early registration student not found' });
            }
            
            return res.json(result.rows[0]);
        }
        
        // For regular students, query students table with only existing columns
        let result = await pool.query(`
            SELECT 
                id,
                enrollment_id,
                school_year,
                lrn,
                grade_level,
                last_name,
                first_name,
                middle_name,
                ext_name,
                (last_name || ', ' || first_name || ' ' || COALESCE(middle_name, '') || ' ' || COALESCE(ext_name, '')) AS full_name,
                birthday,
                age,
                sex,
                religion,
                current_address,
                guardian_name,
                guardian_contact,
                created_at as enrollment_date,
                enrollment_status,
                NULL::text as gmail_address,
                NULL::text as ip_community,
                NULL::text as ip_community_specify,
                NULL::text as pwd,
                NULL::text as pwd_specify,
                NULL::text as father_name,
                NULL::text as mother_name,
                NULL::text as printed_name,
                NULL::text as signature_image_path,
                NULL::text as assigned_section
            FROM students
            WHERE id = $1
        `, [studentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching student details:', err);
        res.status(500).json({ success: false, message: 'Error fetching student details' });
    }
});

// ======================== TEACHERS MANAGEMENT ENDPOINTS ========================

// Debug endpoint to check current session
app.get('/api/debug/session', (req, res) => {
    res.json({
        session: req.session,
        user: req.session.user || null,
        role: req.session.user?.role || 'none'
    });
});

// Get all teachers
app.get('/api/teachers', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        // Fetch active teachers with their assigned sections
        const activeResult = await pool.query(`
            SELECT 
                t.id,
                t.username,
                t.first_name,
                t.middle_name,
                t.last_name,
                t.ext_name,
                t.first_name || ' ' || COALESCE(t.middle_name || ' ', '') || t.last_name || COALESCE(' ' || t.ext_name, '') AS full_name,
                t.email,
                t.contact_number,
                t.birthday,
                t.sex,
                t.address,
                t.employee_id,
                COALESCE(t.department, 'N/A') as department,
                t.position,
                t.specialization,
                t.date_hired,
                t.is_active,
                t.created_at,
                false AS is_archived,
                s.section_name AS assigned_section,
                s.id AS assigned_section_id
            FROM teachers t
            LEFT JOIN sections s ON s.adviser_teacher_id = t.id OR s.adviser_name = (
                t.first_name || ' ' || COALESCE(t.middle_name || ' ', '') || t.last_name || COALESCE(' ' || t.ext_name, '')
            )
            ORDER BY t.last_name, t.first_name
        `);

        // Fetch archived teachers (if table exists)
        let archivedTeachers = [];
        try {
            const tbl = await pool.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'teachers_archive'
                ) AS exists
            `);
            if (tbl.rows[0]?.exists) {
                const archivedResult = await pool.query(`
                    SELECT 
                        original_id AS id,
                        username,
                        first_name,
                        middle_name,
                        last_name,
                        ext_name,
                        first_name || ' ' || COALESCE(middle_name || ' ', '') || last_name || COALESCE(' ' || ext_name, '') AS full_name,
                        email,
                        contact_number,
                        birthday,
                        sex,
                        address,
                        employee_id,
                        department,
                        position,
                        specialization,
                        date_hired,
                        is_active,
                        created_at,
                        true AS is_archived
                    FROM teachers_archive
                    ORDER BY last_name, first_name
                `);
                archivedTeachers = archivedResult.rows;
            }
        } catch (err) {
            console.warn('Warning: Could not fetch archived teachers:', err.message);
        }

        // Combine active and archived teachers
        const allTeachers = [...activeResult.rows, ...archivedTeachers];
        res.json({ success: true, teachers: allTeachers });
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ success: false, message: 'Error fetching teachers' });
    }
});

// Get single teacher by ID
app.get('/api/teachers/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;

    try {
        const result = await pool.query(`
            SELECT 
                id,
                username,
                first_name,
                middle_name,
                last_name,
                ext_name,
                email,
                contact_number,
                birthday,
                sex,
                address,
                employee_id,
                department,
                position,
                specialization,
                date_hired,
                is_active,
                created_at
            FROM teachers
            WHERE id = $1
        `, [teacherId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        res.json({ success: true, teacher: result.rows[0] });
    } catch (err) {
        console.error('Error fetching teacher:', err);
        res.status(500).json({ success: false, message: 'Error fetching teacher' });
    }
});

// Create new teacher
app.post('/api/teachers', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
        username,
        password,
        first_name,
        middle_name,
        last_name,
        ext_name,
        email,
        contact_number,
        birthday,
        sex,
        address,
        employee_id,
        department,
        position,
        specialization,
        date_hired
    } = req.body;

    // Debug: log incoming contact number
    console.log('DEBUG POST /api/teachers contact_number:', req.body && req.body.contact_number);

    // Validate required fields
    if (!username || !password || !first_name || !last_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username, password, first name, and last name are required' 
        });
    }

    try {
        // Check if username already exists
        const existingUser = await pool.query(
            'SELECT id FROM teachers WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new teacher with all available fields
        const result = await pool.query(`
            INSERT INTO teachers (
                username, password, first_name, middle_name, last_name, ext_name,
                email, contact_number, birthday, sex, address, employee_id,
                department, position, specialization, date_hired, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING 
                id, username, first_name, middle_name, last_name, ext_name,
                email, contact_number, birthday, sex, address, employee_id,
                department, position, specialization, date_hired, is_active, created_at
        `, [
            username, hashedPassword, first_name, middle_name || null, last_name, ext_name || null,
            email || null, contact_number || null, birthday || null, sex || null, address || null, employee_id || null,
            department || null, position || null, specialization || null, date_hired || null, true
        ]);

        res.json({ 
            success: true, 
            message: 'Teacher account created successfully',
            teacher: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating teacher:', err);
        res.status(500).json({ success: false, message: 'Error creating teacher account' });
    }
});

// Update teacher
app.put('/api/teachers/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;
    const {
        username,
        password,
        first_name,
        middle_name,
        last_name,
        ext_name,
        email,
        contact_number,
        birthday,
        sex,
        address,
        employee_id,
        department,
        position,
        specialization,
        date_hired,
        is_active
    } = req.body;

    // Debug: log incoming contact number for update
    console.log('DEBUG PUT /api/teachers/:id contact_number:', req.body && req.body.contact_number);

    try {
        // Check if teacher exists
        const existingTeacher = await pool.query(
            'SELECT id FROM teachers WHERE id = $1',
            [teacherId]
        );

        if (existingTeacher.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Check if new username conflicts with another teacher
        if (username) {
            const usernameCheck = await pool.query(
                'SELECT id FROM teachers WHERE username = $1 AND id != $2',
                [username, teacherId]
            );

            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username already taken by another teacher' 
                });
            }
        }

        // Build update query with all available columns
        let updateQuery = `
            UPDATE teachers SET
                username = $1,
                first_name = $2,
                middle_name = $3,
                last_name = $4,
                ext_name = $5,
                email = $6,
                contact_number = $7,
                birthday = $8,
                sex = $9,
                address = $10,
                employee_id = $11,
                department = $12,
                position = $13,
                specialization = $14,
                date_hired = $15,
                is_active = $16
        `;

        let queryParams = [
            username, first_name, middle_name || null, last_name, ext_name || null,
            email || null, contact_number || null, birthday || null, sex || null, address || null,
            employee_id || null, department || null, position || null, specialization || null,
            date_hired || null, is_active !== undefined ? is_active : true
        ];

        // If password is provided, hash and update it
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += `, password = $${queryParams.length + 1}`;
            queryParams.push(hashedPassword);
        }

        updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING id, username, first_name, middle_name, last_name, ext_name, email, contact_number, birthday, sex, address, employee_id, department, position, specialization, date_hired, is_active, created_at`;
        queryParams.push(teacherId);

        const result = await pool.query(updateQuery, queryParams);

        res.json({ 
            success: true, 
            message: 'Teacher updated successfully',
            teacher: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating teacher:', err);
        res.status(500).json({ success: false, message: 'Error updating teacher' });
    }
});

// Delete teacher
app.delete('/api/teachers/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First check if teacher is in active teachers table
        let t = await client.query(
            'SELECT id, first_name, middle_name, last_name, ext_name FROM teachers WHERE id = $1',
            [teacherId]
        );
        
        let teacher = null;
        let fromArchive = false;

        if (t.rows.length === 0) {
            // Check if teacher is in archive table (by original_id)
            const archCheck = await client.query(`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'teachers_archive'
                ) AS has_table
            `);
            
            if (archCheck.rows[0]?.has_table) {
                const archRes = await client.query(
                    'SELECT original_id, first_name, middle_name, last_name, ext_name FROM teachers_archive WHERE original_id = $1',
                    [teacherId]
                );
                if (archRes.rows.length > 0) {
                    teacher = archRes.rows[0];
                    fromArchive = true;
                }
            }
            
            if (!teacher) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Teacher not found' });
            }
        } else {
            teacher = t.rows[0];
        }

        const adviserName = [teacher.first_name, teacher.middle_name, teacher.last_name, teacher.ext_name]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Clear all section adviser references (both by ID and name) without aborting the transaction
        // 1) Check if sections.adviser_teacher_id exists before updating
        const colCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'sections' AND column_name = 'adviser_teacher_id'
            ) AS has_col
        `);
        if (colCheck.rows[0]?.has_col) {
            await client.query('UPDATE sections SET adviser_teacher_id = NULL WHERE adviser_teacher_id = $1', [teacherId]);
        }
        // 2) Always clear by name for backward compatibility
        await client.query('UPDATE sections SET adviser_name = NULL WHERE adviser_name = $1', [adviserName]);

        // Clear behavior reports teacher reference only if the table exists
        const tblCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_behavior_reports'
            ) AS has_table
        `);
        if (tblCheck.rows[0]?.has_table) {
            await client.query('UPDATE student_behavior_reports SET teacher_id = NULL WHERE teacher_id = $1', [teacherId]);
        }

        // Delete from the appropriate table
        let result;
        if (fromArchive) {
            result = await client.query(
                'DELETE FROM teachers_archive WHERE original_id = $1 RETURNING original_id as id, first_name, last_name',
                [teacherId]
            );
        } else {
            result = await client.query(
                'DELETE FROM teachers WHERE id = $1 RETURNING id, first_name, last_name',
                [teacherId]
            );
        }

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Teacher not found or already deleted' });
        }

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: `Teacher ${result.rows[0].first_name} ${result.rows[0].last_name} deleted successfully` 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting teacher:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint
        });
        res.status(500).json({ 
            success: false, 
            message: `Error deleting teacher: ${err.message || 'Database error'}` 
        });
    } finally {
        client.release();
    }
});

// Toggle teacher active status
app.put('/api/teachers/:id/toggle', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;

    try {
        const result = await pool.query(`
            UPDATE teachers 
            SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id, first_name, last_name, is_active
        `, [teacherId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const teacher = result.rows[0];
        const status = teacher.is_active ? 'activated' : 'deactivated';

        res.json({ 
            success: true, 
            message: `Teacher ${teacher.first_name} ${teacher.last_name} has been ${status}`,
            is_active: teacher.is_active
        });
    } catch (err) {
        console.error('Error toggling teacher status:', err);
        res.status(500).json({ success: false, message: 'Error toggling teacher status' });
    }
});

// Assign teacher as adviser to a section
app.put('/api/teachers/:teacherId/assign-section', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.teacherId;
    const { sectionId } = req.body;

    try {
        // Get teacher details
        const teacherResult = await pool.query(
            'SELECT id, first_name, middle_name, last_name, ext_name FROM teachers WHERE id = $1',
            [teacherId]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const teacher = teacherResult.rows[0];
        const adviserName = [teacher.first_name, teacher.middle_name, teacher.last_name, teacher.ext_name]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Exclusively assign: clear teacher as adviser from any other sections first
        // Prefer clearing by adviser_teacher_id if column exists; otherwise by adviser_name
        try {
            await pool.query(
                `UPDATE sections 
                 SET adviser_name = NULL, adviser_teacher_id = NULL, updated_at = CURRENT_TIMESTAMP 
                 WHERE adviser_teacher_id = $1 AND id != $2`,
                [teacherId, sectionId]
            );
        } catch (e) {
            // Column may not exist; clear by name
            await pool.query(
                `UPDATE sections 
                 SET adviser_name = NULL, updated_at = CURRENT_TIMESTAMP 
                 WHERE adviser_name = $1 AND id != $2`,
                [adviserName, sectionId]
            );
        }

        // Update target section with adviser (store teacher id if column exists)
        let result;
        try {
            result = await pool.query(`
                UPDATE sections 
                SET adviser_name = $1, adviser_teacher_id = $2, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $3 
                RETURNING id, section_name, adviser_name
            `, [adviserName, teacherId, sectionId]);
        } catch (e) {
            // Fallback if adviser_teacher_id doesn't exist yet
            result = await pool.query(`
                UPDATE sections 
                SET adviser_name = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2 
                RETURNING id, section_name, adviser_name
            `, [adviserName, sectionId]);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ 
            success: true, 
            message: `${adviserName} has been assigned as adviser to ${result.rows[0].section_name}`,
            section: result.rows[0]
        });
    } catch (err) {
        console.error('Error assigning teacher to section:', err);
        res.status(500).json({ success: false, message: 'Error assigning teacher as adviser' });
    }
});

    // Serve Registrar Analytics Page
    app.get('/registrar/analytics', (req, res) => {
        if (!req.session.user || req.session.user.role !== 'registrar') {
            return res.redirect('/registrarlogin');
        }
        res.render('registrarAnalytics', { user: req.session.user });
    });

    // Serve Guidance Analytics Page
    app.get('/guidance/analytics', (req, res) => {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/guidance/login');
        }
        res.render('guidance/guidanceAnalytics', { user: req.session.user });
    });

// Initialize database schemas on startup
async function initializeSchemas() {
    try {
        await ensureEnrollmentRequestsSchema();
        await ensureDocumentRequestsSchema();
        await ensureSubmissionLogsSchema();
        await ensureBlockedIPsSchema();
    } catch (err) {
        console.error('Error initializing schemas:', err.message);
    }
}

// Dashboard summary and charts data
app.get('/api/dashboard/summary', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        // Aggregate counts - use COALESCE to handle missing columns gracefully
        const [teacherCounts, studentCounts, sectionCounts, avgClassSize] = await Promise.all([
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total,
                    SUM(CASE WHEN COALESCE(is_active, true) THEN 1 ELSE 0 END)::int AS active,
                    SUM(CASE WHEN NOT COALESCE(is_active, true) THEN 1 ELSE 0 END)::int AS inactive
                FROM teachers
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total,
                    SUM(CASE WHEN COALESCE(is_archived, false) = false THEN 1 ELSE 0 END)::int AS active,
                    SUM(CASE WHEN COALESCE(is_archived, false) = true THEN 1 ELSE 0 END)::int AS archived,
                    SUM(CASE WHEN COALESCE(sex, 'N/A') = 'Male' THEN 1 ELSE 0 END)::int AS male,
                    SUM(CASE WHEN COALESCE(sex, 'N/A') = 'Female' THEN 1 ELSE 0 END)::int AS female
                FROM students
            `),
            pool.query(`
                SELECT 
                    COUNT(*)::int AS total,
                    SUM(CASE WHEN COALESCE(is_active, true) THEN 1 ELSE 0 END)::int AS active
                FROM sections
            `),
            pool.query(`
                SELECT COALESCE(ROUND(AVG(COALESCE(current_count, 0))::numeric, 2), 0)::float AS avg_size,
                       COALESCE(SUM(COALESCE(current_count, 0)),0)::int AS total_enrolled,
                       COALESCE(SUM(COALESCE(max_capacity, 0)),0)::int AS total_capacity
                FROM sections
            `)
        ]);

        // Grade-level distribution (by sections joined with students)
        const gradeDist = await pool.query(`
            SELECT s.grade_level, COUNT(st.id)::int AS count
            FROM sections s
            LEFT JOIN students st ON st.section_id = s.id AND st.enrollment_status = 'active'
            GROUP BY s.grade_level
            ORDER BY s.grade_level
        `);

        // Enrollment trend by month (this year)
        const enrollTrend = await pool.query(`
            SELECT TO_CHAR(date_trunc('month', st.created_at), 'YYYY-MM') AS ym,
                   COUNT(*)::int AS count
            FROM students st
            WHERE st.created_at >= date_trunc('year', CURRENT_DATE)
            GROUP BY ym
            ORDER BY ym
        `);

        // Sections overview breakdown
        const sectionsOverview = await pool.query(`
            SELECT s.id, s.section_name,
                   COALESCE(SUM(CASE WHEN st.enrollment_status = 'active' THEN 1 ELSE 0 END),0)::int AS total,
                   COALESCE(SUM(CASE WHEN st.enrollment_status = 'active' AND COALESCE(st.sex, 'N/A') = 'Female' THEN 1 ELSE 0 END),0)::int AS girls,
                   COALESCE(SUM(CASE WHEN st.enrollment_status = 'active' AND COALESCE(st.sex, 'N/A') = 'Male' THEN 1 ELSE 0 END),0)::int AS boys
            FROM sections s
            LEFT JOIN students st ON st.section_id = s.id
            GROUP BY s.id, s.section_name
            ORDER BY s.section_name
        `);

        const tc = teacherCounts.rows[0];
        const sc = studentCounts.rows[0];
        const sec = sectionCounts.rows[0];
        const avg = avgClassSize.rows[0];

        const capacityUtil = avg.total_capacity > 0 ? Math.round((avg.total_enrolled / avg.total_capacity) * 100) : 0;

        return res.json({
            success: true,
            metrics: {
                teachers: { total: tc.total, active: tc.active, inactive: tc.inactive },
                students: { total: sc.total, active: sc.active, archived: sc.archived, male: sc.male, female: sc.female },
                sections: { total: sec.total, active: sec.active },
                avgClassSize: avg.avg_size,
                capacityUtilization: capacityUtil
            },
            charts: {
                gradeDistribution: gradeDist.rows,
                enrollmentTrend: enrollTrend.rows
            },
            sectionsOverview: sectionsOverview.rows
        });
    } catch (err) {
        console.error('Dashboard summary error:', err.message);
        console.error('Full error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to load dashboard summary',
            error: err.message 
        });
    }
});

// ======================== TEACHER AUTH & PORTAL ========================
// Teacher Login API
app.post('/api/teacher/login', async (req, res) => {
    const { username, password, rememberMe } = req.body || {};
    console.log('Login attempt for username:', username);
    try {
        const result = await pool.query(
                'SELECT id, username, password, first_name, middle_name, last_name, is_active FROM teachers WHERE username = $1',
            [username]
        );
        const teacher = result.rows[0];
        if (!teacher || !teacher.is_active) {
            console.log('Login failed: Invalid credentials or inactive account');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const ok = await bcrypt.compare(password, teacher.password);
        if (!ok) {
            console.log('Login failed: Wrong password');
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        console.log('Password verified for teacher:', teacher.id);
        req.session.user = { id: teacher.id, role: 'teacher', name: `${teacher.first_name} ${teacher.middle_name || ''} ${teacher.last_name}`.replace(/\s+/g, ' ').trim() };
        
        if (rememberMe) {
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
        } else {
            req.session.cookie.expires = false; // Session cookie only
        }
        
        console.log('Session before save:', req.session);
        
        // Save session before responding to ensure it's persisted
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, error: 'Session save failed' });
            }
            console.log('Session saved successfully. Session ID:', req.sessionID);
            console.log('Session user:', req.session.user);
            return res.json({ success: true });
        });
    } catch (err) {
        console.error('Teacher login error:', err);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Teacher Logout
app.get('/logout-teacher', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/teacher');
        }
        res.clearCookie('connect.sid');
        res.redirect('/teacher-login');
    });
});

// Guidance: Archive a behavior report (moves to archived table)
app.post('/api/guidance/behavior-reports/:id/archive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const id = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ensure archive table exists (safe to run multiple times)
        await client.query(`
            CREATE TABLE IF NOT EXISTS student_behavior_reports_archive (
                id SERIAL PRIMARY KEY,
                original_id INTEGER,
                student_id INTEGER,
                section_id INTEGER,
                teacher_id INTEGER,
                report_date DATE,
                category VARCHAR(255),
                severity VARCHAR(50),
                notes TEXT,
                archived_by INTEGER,
                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fetch the report
        const r = await client.query('SELECT * FROM student_behavior_reports WHERE id = $1', [id]);
        if (r.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Report not found' });
        }
        const row = r.rows[0];

        // Insert into archive
        await client.query(`
            INSERT INTO student_behavior_reports_archive
                (original_id, student_id, section_id, teacher_id, report_date, category, severity, notes, archived_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [row.id, row.student_id, row.section_id, row.teacher_id, row.report_date, row.category, row.severity, row.notes, req.session.user.id]);

        // Delete original
        await client.query('DELETE FROM student_behavior_reports WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Report archived' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to archive report:', err);
        res.status(500).json({ success: false, error: 'Failed to archive report' });
    } finally {
        client.release();
    }
});

// Guidance: List archived behavior reports
app.get('/api/guidance/behavior-reports/archived', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    try {
        // If archive table doesn't exist, return empty
        const tableCheck = await pool.query(`
            SELECT to_regclass('public.student_behavior_reports_archive') IS NOT NULL AS exists
        `);
        if (!tableCheck.rows[0].exists) {
            return res.json({ success: true, reports: [] });
        }

        const result = await pool.query(`
            SELECT a.id, a.original_id, a.student_id, a.section_id, a.teacher_id, a.report_date, a.category, a.severity, a.notes, a.archived_by, a.archived_at,
                   s.last_name || ', ' || s.first_name || ' ' || COALESCE(s.middle_name || '', '') AS student_full_name,
                   t.last_name || ', ' || t.first_name AS teacher_name,
                   sec.section_name
            FROM student_behavior_reports_archive a
            LEFT JOIN students s ON s.id = a.student_id
            LEFT JOIN teachers t ON t.id = a.teacher_id
            LEFT JOIN sections sec ON sec.id = a.section_id
            ORDER BY a.archived_at DESC
        `);

        res.json({ success: true, reports: result.rows });
    } catch (err) {
        console.error('Failed to load archived reports:', err);
        res.status(500).json({ success: false, error: 'Failed to load archived reports' });
    }
});

// Guidance: Permanently delete an archived behavior report
app.delete('/api/guidance/behavior-reports/archived/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM student_behavior_reports_archive WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Archived report not found' });
        res.json({ success: true, message: 'Archived report permanently deleted' });
    } catch (err) {
        console.error('Failed to delete archived report:', err);
        res.status(500).json({ success: false, error: 'Failed to delete archived report' });
    }
});

// Guidance: Recover an archived behavior report back to active reports
app.post('/api/guidance/behavior-reports/archived/:id/recover', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const archiveId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch the archived row
        const ar = await client.query('SELECT * FROM student_behavior_reports_archive WHERE id = $1', [archiveId]);
        if (ar.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Archived report not found' });
        }
        const a = ar.rows[0];

        // Try insert with original foreign keys first
        try {
            const insert = await client.query(`
                INSERT INTO student_behavior_reports (student_id, section_id, teacher_id, report_date, category, severity, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [a.student_id, a.section_id, a.teacher_id, a.report_date, a.category, a.severity, a.notes]);

            // Delete archive record
            await client.query('DELETE FROM student_behavior_reports_archive WHERE id = $1', [archiveId]);
            await client.query('COMMIT');
            return res.json({ success: true, restored_id: insert.rows[0].id });
        } catch (insertErr) {
            // If insert failed (likely FK constraint), attempt a fallback: insert without FK references
            console.warn('Primary restore insert failed, attempting fallback insert (nullify FK refs):', insertErr.message);
            const fallbackNotes = (a.notes || '') + `\n[RESTORED-FROM-ARCHIVE original_ids: original_id=${a.original_id || 'NULL'}, student_id=${a.student_id || 'NULL'}, section_id=${a.section_id || 'NULL'}, teacher_id=${a.teacher_id || 'NULL'}]`;
            const fallback = await client.query(`
                INSERT INTO student_behavior_reports (student_id, section_id, teacher_id, report_date, category, severity, notes)
                VALUES (NULL, NULL, NULL, $1, $2, $3, $4)
                RETURNING id
            `, [a.report_date, a.category, a.severity, fallbackNotes]);

            // Delete archive record
            await client.query('DELETE FROM student_behavior_reports_archive WHERE id = $1', [archiveId]);
            await client.query('COMMIT');
            return res.json({ success: true, restored_id: fallback.rows[0].id, note: 'Restored with FK references set to NULL; original ids added to notes.' });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to recover archived report:', err);
        // Provide error details to client for easier debugging
        const message = err && err.message ? err.message : 'Failed to recover archived report';
        res.status(500).json({ success: false, error: message, detail: err && err.detail ? err.detail : null });
    } finally {
        client.release();
    }
});

// Guidance: Mark behavior report as done/undone (adds is_done column if missing)
app.put('/api/guidance/behavior-reports/:id/done', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const id = req.params.id;
    const doneFlag = req.body && typeof req.body.done !== 'undefined' ? !!req.body.done : true;
    const client = await pool.connect();
    try {
        // Ensure column exists
        await client.query(`ALTER TABLE student_behavior_reports ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT false`);

        const result = await client.query(`UPDATE student_behavior_reports SET is_done = $1 WHERE id = $2 RETURNING id`, [doneFlag, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Report not found' });
        res.json({ success: true, message: doneFlag ? 'Report marked as done' : 'Report marked as active' });
    } catch (err) {
        console.error('Failed to mark report done:', err);
        res.status(500).json({ success: false, error: 'Failed to update report status' });
    } finally {
        client.release();
    }
});

// Ensure messaging schema includes is_archived column (safe to run at startup)
async function ensureMessagingSchema() {
    try {
        // create table if missing (keeps prior setup_messaging behavior)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guidance_teacher_messages (
                id SERIAL PRIMARY KEY,
                guidance_id INTEGER NOT NULL REFERENCES guidance_accounts(id) ON DELETE CASCADE,
                teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                is_archived BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add column if missing (safe alter)
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'guidance_teacher_messages' AND column_name = 'is_archived'
        `);
        if (colCheck.rows.length === 0) {
            await pool.query(`ALTER TABLE guidance_teacher_messages ADD COLUMN is_archived BOOLEAN DEFAULT false;`);
        }

        // Create helpful indexes (idempotent)
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_gtm_teacher ON guidance_teacher_messages(teacher_id, created_at DESC);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_gtm_guidance ON guidance_teacher_messages(guidance_id, created_at DESC);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_gtm_unread ON guidance_teacher_messages(teacher_id, is_read) WHERE is_read = false;`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_gtm_archived ON guidance_teacher_messages(guidance_id, is_archived);`);

        console.log('âœ… ensureMessagingSchema OK');
    } catch (err) {
        console.error('âŒ ensureMessagingSchema failed:', err.message);
    }
}

// All schema initialization is now handled by initializeSchemas() function
// (called automatically after database connection is established)

// Archive a sent message (soft-delete)
app.post('/api/guidance/messages/:id/archive', async (req, res) => {
    if (!req.session.guidance_id) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const id = req.params.id;
    try {
        const result = await pool.query(`
            UPDATE guidance_teacher_messages
            SET is_archived = true
            WHERE id = $1 AND guidance_id = $2
            RETURNING id
        `, [id, req.session.guidance_id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to archive message:', err);
        res.status(500).json({ success: false, error: 'Failed to archive message' });
    }
});

// Recover an archived message
app.post('/api/guidance/messages/:id/recover', async (req, res) => {
    if (!req.session.guidance_id) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const id = req.params.id;
    try {
        const result = await pool.query(`
            UPDATE guidance_teacher_messages
            SET is_archived = false
            WHERE id = $1 AND guidance_id = $2
            RETURNING id
        `, [id, req.session.guidance_id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to recover message:', err);
        res.status(500).json({ success: false, error: 'Failed to recover message' });
    }
});

// Permanently delete a message (guidance only)
app.delete('/api/guidance/messages/:id', async (req, res) => {
    if (!req.session.guidance_id) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const id = req.params.id;
    try {
        const result = await pool.query(`DELETE FROM guidance_teacher_messages WHERE id = $1 AND guidance_id = $2 RETURNING id`, [id, req.session.guidance_id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete message:', err);
        res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
});

// Archive (move teacher to teachers_archive table)
// Get archived teachers (from teachers_archive)
app.get('/api/teachers/archived', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    try {
        // If archive table doesn't exist yet, return empty list instead of 500
        const tbl = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) AS exists
        `, ['teachers_archive']);
        if (!tbl.rows[0] || !tbl.rows[0].exists) {
            return res.json({ success: true, teachers: [] });
        }

        const result = await pool.query(`
            SELECT id AS archive_id, original_id, username, first_name, middle_name, last_name, ext_name, email, contact_number, is_active, archived_at, archived_by, created_at, updated_at
            FROM teachers_archive
            ORDER BY archived_at DESC
        `);
        res.json({ success: true, teachers: result.rows });
    } catch (err) {
        console.error('Error fetching archived teachers:', err);
        res.status(500).json({ success: false, message: 'Error fetching archived teachers' });
    }
});

// Archive teacher (soft delete) - move from active to archive
app.put('/api/teachers/:id/archive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const tRes = await client.query('SELECT * FROM teachers WHERE id = $1', [teacherId]);
        if (tRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        const teacher = tRes.rows[0];

        // Ensure archive table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS teachers_archive (
                id SERIAL PRIMARY KEY,
                original_id INTEGER,
                username VARCHAR(50),
                password VARCHAR(255),
                first_name VARCHAR(50),
                middle_name VARCHAR(50),
                last_name VARCHAR(50),
                ext_name VARCHAR(10),
                email VARCHAR(100),
                contact_number VARCHAR(20),
                birthday DATE,
                sex VARCHAR(10),
                address TEXT,
                employee_id VARCHAR(50),
                department VARCHAR(100),
                position VARCHAR(100),
                specialization VARCHAR(100),
                date_hired DATE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                archived_by INTEGER,
                archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert teacher into archive with all columns
        const insertRes = await client.query(`
            INSERT INTO teachers_archive (
                original_id, username, password, first_name, middle_name, last_name, ext_name,
                email, contact_number, birthday, sex, address, employee_id, department, position,
                specialization, date_hired, is_active, created_at, updated_at, archived_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING id
        `, [
            teacher.id, teacher.username, teacher.password, teacher.first_name, teacher.middle_name || null, teacher.last_name, teacher.ext_name || null,
            teacher.email || null, teacher.contact_number || null, teacher.birthday || null, teacher.sex || null, teacher.address || null,
            teacher.employee_id || null, teacher.department || null, teacher.position || null, teacher.specialization || null,
            teacher.date_hired || null, teacher.is_active !== undefined ? teacher.is_active : true, teacher.created_at || null, teacher.updated_at || null, req.session.user.id
        ]);

        // Clear adviser references in sections (both by id and by name)
        const adviserName = [teacher.first_name, teacher.middle_name, teacher.last_name, teacher.ext_name]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        try {
            await client.query('UPDATE sections SET adviser_teacher_id = NULL WHERE adviser_teacher_id = $1', [teacherId]);
        } catch (e) {
            // ignore
        }
        await client.query('UPDATE sections SET adviser_name = NULL WHERE adviser_name = $1', [adviserName]);

        // Clear behavior reports teacher reference if table exists
        const tblCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'student_behavior_reports'
            ) AS has_table
        `);
        if (tblCheck.rows[0]?.has_table) {
            await client.query('UPDATE student_behavior_reports SET teacher_id = NULL WHERE teacher_id = $1', [teacherId]);
        }

        // Finally remove from teachers
        await client.query('DELETE FROM teachers WHERE id = $1', [teacherId]);

        await client.query('COMMIT');

        res.json({ success: true, message: `Teacher ${teacher.first_name} ${teacher.last_name} archived`, archive_id: insertRes.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error archiving teacher (move):', err);
        res.status(500).json({ success: false, message: 'Error archiving teacher' });
    } finally {
        client.release();
    }
});

// Recover archived teacher (move back to active teachers table)
app.put('/api/teachers/:id/recover', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if archive table exists and get archived teacher
        const tblCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'teachers_archive'
            ) AS has_table
        `);
        
        if (!tblCheck.rows[0]?.has_table) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Archived teacher not found' });
        }

        // Get archived teacher by original_id
        const archRes = await client.query('SELECT * FROM teachers_archive WHERE original_id = $1', [teacherId]);
        if (archRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Archived teacher not found' });
        }
        const archived = archRes.rows[0];

        // Insert back into active teachers table with all columns
        const insertRes = await client.query(`
            INSERT INTO teachers (
                id, username, password, first_name, middle_name, last_name, ext_name,
                email, contact_number, birthday, sex, address, employee_id, department, position,
                specialization, date_hired, is_active, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            RETURNING id
        `, [
            archived.original_id, archived.username, archived.password, archived.first_name, 
            archived.middle_name || null, archived.last_name, archived.ext_name || null,
            archived.email || null, archived.contact_number || null, archived.birthday || null, 
            archived.sex || null, archived.address || null, archived.employee_id || null, 
            archived.department || null, archived.position || null, archived.specialization || null,
            archived.date_hired || null, archived.is_active !== undefined ? archived.is_active : true, 
            archived.created_at || null, archived.updated_at || null
        ]);

        // Delete from archive table
        await client.query('DELETE FROM teachers_archive WHERE original_id = $1', [teacherId]);

        await client.query('COMMIT');

        res.json({ success: true, message: `Teacher ${archived.first_name} ${archived.last_name} recovered` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error recovering teacher:', err);
        res.status(500).json({ success: false, message: 'Error recovering teacher' });
    } finally {
        client.release();
    }
});

// Recover an archived teacher (move back from teachers_archive to teachers)
app.put('/api/teachers/:archiveId/recover', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const archiveId = req.params.archiveId;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Ensure archive table exists
        const tbl = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) AS exists
        `, ['teachers_archive']);
        if (!tbl.rows[0] || !tbl.rows[0].exists) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Archive table not found' });
        }

        const ar = await client.query('SELECT * FROM teachers_archive WHERE id = $1', [archiveId]);
        if (ar.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Archived teacher not found' });
        }
        const a = ar.rows[0];

        // Try to restore with original_id if possible
        let insertRes;
        try {
            insertRes = await client.query(`
                INSERT INTO teachers (
                    id, username, password, first_name, middle_name, last_name, ext_name,
                    email, contact_number, birthday, sex, address, employee_id, department, position,
                    specialization, date_hired, is_active, created_at, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
                RETURNING id
            `, [
                a.original_id || null, a.username, a.password, a.first_name, a.middle_name || null, a.last_name, a.ext_name || null,
                a.email || null, a.contact_number || null, a.birthday || null, a.sex || null, a.address || null,
                a.employee_id || null, a.department || null, a.position || null, a.specialization || null,
                a.date_hired || null, a.is_active !== undefined ? a.is_active : true, a.created_at || null, a.updated_at || null
            ]);
        } catch (insertErr) {
            // Fallback: insert without specifying id (let sequence pick one)
            console.warn('Primary restore insert failed, attempting fallback insert:', insertErr.message);
            insertRes = await client.query(`
                INSERT INTO teachers (
                    username, password, first_name, middle_name, last_name, ext_name,
                    email, contact_number, birthday, sex, address, employee_id, department, position,
                    specialization, date_hired, is_active, created_at, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                RETURNING id
            `, [
                a.username, a.password, a.first_name, a.middle_name || null, a.last_name, a.ext_name || null,
                a.email || null, a.contact_number || null, a.birthday || null, a.sex || null, a.address || null,
                a.employee_id || null, a.department || null, a.position || null, a.specialization || null,
                a.date_hired || null, a.is_active !== undefined ? a.is_active : true, a.created_at || null, a.updated_at || null
            ]);
        }

        // Delete archive row
        await client.query('DELETE FROM teachers_archive WHERE id = $1', [archiveId]);

        await client.query('COMMIT');

        res.json({ success: true, message: 'Teacher recovered', id: insertRes.rows[0].id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error recovering archived teacher:', err);
        res.status(500).json({ success: false, message: 'Error recovering archived teacher' });
    } finally {
        client.release();
    }
});

// Permanently delete an archived teacher
app.delete('/api/teachers/archive/:archiveId', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const archiveId = req.params.archiveId;
    try {
        // Check archive table exists
        const tbl = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) AS exists
        `, ['teachers_archive']);
        if (!tbl.rows[0] || !tbl.rows[0].exists) {
            return res.status(404).json({ success: false, message: 'Archive table not found' });
        }

        const result = await pool.query('DELETE FROM teachers_archive WHERE id = $1 RETURNING id, original_id, first_name, last_name', [archiveId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Archived teacher not found' });
        const r = result.rows[0];
        res.json({ success: true, message: `Archived teacher ${r.first_name} ${r.last_name} permanently deleted` });
    } catch (err) {
        console.error('Failed to delete archived teacher:', err);
        res.status(500).json({ success: false, message: 'Failed to delete archived teacher' });
    }
});

// DEBUG: inspect teachers_archive (count + sample rows) - useful to verify archive content
app.get('/api/debug/teachers-archive', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    try {
        const tbl = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) AS exists
        `, ['teachers_archive']);
        if (!tbl.rows[0] || !tbl.rows[0].exists) {
            return res.json({ success: true, count: 0, sample: [] });
        }

        const c = await pool.query('SELECT COUNT(*)::int AS cnt FROM teachers_archive');
        const sample = await pool.query('SELECT id AS archive_id, original_id, first_name, last_name, username, archived_at FROM teachers_archive ORDER BY archived_at DESC LIMIT 50');
        res.json({ success: true, count: c.rows[0].cnt, sample: sample.rows });
    } catch (err) {
        console.error('Debug: failed to inspect teachers_archive:', err);
        res.status(500).json({ success: false, message: 'Failed to inspect teachers_archive', error: err && err.message });
    }
});

// Get single archived teacher by archive id
app.get('/api/teachers/archive/:archiveId', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const archiveId = req.params.archiveId;
    try {
        const tbl = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) AS exists
        `, ['teachers_archive']);
        if (!tbl.rows[0] || !tbl.rows[0].exists) {
            return res.status(404).json({ success: false, message: 'Archive table not found' });
        }

        const r = await pool.query('SELECT * FROM teachers_archive WHERE id = $1', [archiveId]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Archived teacher not found' });
        res.json({ success: true, teacher: r.rows[0] });
    } catch (err) {
        console.error('Error fetching archived teacher:', err);
        res.status(500).json({ success: false, message: 'Error fetching archived teacher' });
    }
});

// Barangay distribution stats (counts for specific barangays)
app.get('/api/stats/barangay-distribution', async (req, res) => {
    // Allow ictcoor/registrar/admin roles to view basic distribution
    if (!req.session.user || !['ictcoor','registrar','admin','guidance'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Get ONLY students assigned to sections (in Section Management) with their addresses
        const studentsRes = await pool.query(`
            SELECT current_address FROM students 
            WHERE enrollment_status = 'active' AND section_id IS NOT NULL
        `);
        
        // Use flexible barangay extraction to count
        const distribution = {
            'San Francisco': 0,
            'Mainaga': 0,
            'Calamias': 0,
            'Others': 0
        };
        
        studentsRes.rows.forEach(row => {
            const barangay = extractBarangayFlexibleServer(row.current_address);
            if (distribution.hasOwnProperty(barangay)) {
                distribution[barangay]++;
            } else {
                distribution['Others']++;
            }
        });

        res.json({ success: true, counts: distribution });
    } catch (err) {
        console.error('Error computing barangay distribution:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper function for flexible barangay extraction (server-side)
function extractBarangayFlexibleServer(address) {
    if (!address) return 'Others';
    const addressStr = String(address).trim().toLowerCase();
    
    // Only recognize the 3 main barangays - everything else goes to Others
    if (addressStr.includes('san francisco')) return 'San Francisco';
    if (addressStr.includes('mainaga')) return 'Mainaga';
    if (addressStr.includes('calamias')) return 'Calamias';
    
    // Everything else is Others
    return 'Others';
}

// Get current live enrollment data (students currently enrolled and assigned to sections)
app.get('/api/enrollment/live-count', async (req, res) => {
    if (!req.session.user || !['ictcoor','registrar','admin'].includes(req.session.user.role)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // Count active students ASSIGNED TO SECTIONS (in Section Management)
        const result = await pool.query(`
            SELECT COUNT(*) as total
            FROM students
            WHERE enrollment_status = 'active' AND section_id IS NOT NULL
        `);
        
        const liveCount = parseInt(result.rows[0]?.total || 0);
        
        res.json({ 
            success: true, 
            total: liveCount,
            label: 'Current School Year (Live)',
            schoolYear: 'Current School Year (Live)'
        });
    } catch (err) {
        console.error('Error getting live enrollment count:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===== TEST EMAIL ENDPOINT =====
app.post('/api/test-email', async (req, res) => {
    const { email, type } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }

    if (!emailService) {
        return res.status(400).json({ success: false, error: 'Email service not available' });
    }

    try {
        let result;
        
        if (type === 'enrollment-approved') {
            result = await emailService.sendEnrollmentStatusUpdate(email, 'Test Student', 'TEST-TOKEN-123', 'approved');
        } else if (type === 'enrollment-rejected') {
            result = await emailService.sendEnrollmentStatusUpdate(email, 'Test Student', 'TEST-TOKEN-123', 'rejected', 'Test rejection reason');
        } else if (type === 'document-processing') {
            result = await emailService.sendDocumentRequestStatusUpdate(email, 'Test Student', 'TEST-TOKEN-123', 'Transcript', 'processing');
        } else if (type === 'document-ready') {
            result = await emailService.sendDocumentRequestStatusUpdate(email, 'Test Student', 'TEST-TOKEN-123', 'Transcript', 'ready');
        } else if (type === 'document-rejected') {
            result = await emailService.sendDocumentRequestStatusUpdate(email, 'Test Student', 'TEST-TOKEN-123', 'Transcript', 'rejected', 'Test rejection reason');
        } else {
            return res.status(400).json({ success: false, error: 'Invalid type' });
        }

        res.json({ success: result, message: result ? 'Test email sent successfully' : 'Failed to send test email' });
    } catch (err) {
        console.error('Error sending test email:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Minimal test - just count records
app.get('/api/admin/test-count', async (req, res) => {
    try {
        // Test each table
        const tables = ['users', 'students', 'early_registration', 'sections', 'teachers'];
        const counts = {};
        
        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                counts[table] = parseInt(result.rows[0].count);
            } catch (e) {
                counts[table] = `Error: ${e.message}`;
            }
        }
        
        res.json({ success: true, table_counts: counts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Show actual early registration data
app.get('/api/admin/show-early-registrations', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM early_registration ORDER BY id DESC LIMIT 10
        `);
        
        res.json({ 
            success: true,
            count: result.rows.length,
            columns: result.fields ? result.fields.map(f => f.name) : [],
            records: result.rows
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message,
            hint: 'Table may not exist or may not have records'
        });
    }
});

// Test the pending students query step by step
app.get('/api/admin/test-pending-query', async (req, res) => {
    const debug = [];
    
    try {
        // Step 1: Count early_registration
        const erCount = await pool.query('SELECT COUNT(*) as count FROM early_registration');
        debug.push(`early_registration count: ${erCount.rows[0].count}`);
        
        // Step 2: Count students
        const stCount = await pool.query('SELECT COUNT(*) as count FROM students');
        debug.push(`students count: ${stCount.rows[0].count}`);
        
        // Step 3: Get early_registration IDs
        const erIds = await pool.query('SELECT id, last_name, first_name FROM early_registration ORDER BY id DESC LIMIT 5');
        debug.push(`Sample early_registration records: ${JSON.stringify(erIds.rows)}`);
        
        // Step 4: Run the pending students query
        const pendingQuery = `
            SELECT 
                'ER' || er.id::text as id,
                er.id as enrollment_id,
                er.last_name || ', ' || er.first_name as full_name,
                er.grade_level,
                er.school_year
            FROM early_registration er
            WHERE NOT EXISTS (
                SELECT 1 FROM students st WHERE st.enrollment_id = er.id::text
            )
            ORDER BY er.id DESC
        `;
        
        const pending = await pool.query(pendingQuery);
        debug.push(`Pending students from query: ${pending.rows.length} records`);
        if (pending.rows.length > 0) {
            debug.push(`First record: ${JSON.stringify(pending.rows[0])}`);
        }
        
        res.json({ success: true, debug_info: debug, results: pending.rows });
    } catch (err) {
        debug.push(`Error: ${err.message}`);
        res.status(500).json({ success: false, error: err.message, debug_info: debug });
    }
});

// Admin endpoint to clean up all snapshot data
app.post('/api/admin/cleanup-snapshots', async (req, res) => {
    try {
        console.log('ðŸ§¹ Cleaning up all snapshot data...');
        
        // Delete all snapshot items first (due to foreign key)
        const itemResult = await pool.query('DELETE FROM section_snapshot_items');
        console.log(`âœ… Deleted ${itemResult.rowCount} snapshot items`);
        
        // Delete all snapshot groups
        const groupResult = await pool.query('DELETE FROM section_snapshot_groups');
        console.log(`âœ… Deleted ${groupResult.rowCount} snapshot groups`);
        
        res.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${groupResult.rowCount} snapshots and ${itemResult.rowCount} items.`
        });
    } catch (err) {
        console.error('Error during snapshot cleanup:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Admin endpoint to clean up all test/sample student data
app.post('/api/admin/cleanup-students', async (req, res) => {
    try {
        console.log('ðŸ§¹ Cleaning up all student data...');
        
        // Delete all early registrations
        const erResult = await pool.query('DELETE FROM early_registration');
        console.log(`âœ… Deleted ${erResult.rowCount} early registration records`);
        
        // Delete all students
        const studResult = await pool.query('DELETE FROM students');
        console.log(`âœ… Deleted ${studResult.rowCount} student records`);
        
        res.json({ 
            success: true, 
            message: `Cleanup complete. Deleted ${erResult.rowCount} early registrations and ${studResult.rowCount} students.`
        });
    } catch (err) {
        console.error('Error during cleanup:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Manual database initialization endpoint (for troubleshooting)
app.get('/api/admin/reinit-database', async (req, res) => {
    try {
        console.log('Manual database reinitialization requested...');
        const result = await initializeDatabase();
        res.json({ 
            success: result,
            message: result ? 'Database reinitialized successfully' : 'Database reinitialization encountered errors'
        });
    } catch (err) {
        console.error('Error during manual reinitialization:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Debug endpoint to check early_registration records
app.get('/api/debug/early-registrations', async (req, res) => {
    try {
        // First check if table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'early_registration'
            ) as table_exists
        `);
        
        if (!tableCheck.rows[0].table_exists) {
            return res.json({ 
                success: false, 
                error: 'early_registration table does not exist',
                table_exists: false,
                hint: 'Database initialization may have failed. Visit /api/admin/test-connection to check DB connection.'
            });
        }
        
        // Get all columns
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'early_registration'
            ORDER BY column_name
        `);
        
        // Get data
        const result = await pool.query(`SELECT * FROM early_registration ORDER BY id DESC LIMIT 5`);
        
        res.json({ 
            success: true, 
            count: result.rows.length,
            columns: columnCheck.rows.map(r => r.column_name),
            records: result.rows 
        });
    } catch (err) {
        console.error('Error fetching early registrations:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message,
            details: err.toString(),
            hint: 'Visit /api/admin/test-connection to verify DB connection works'
        });
    }
});

// Debug endpoint to test the exact query from ictcoorLanding
app.get('/api/debug/pending-students', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                'ER' || er.id::text as id,
                er.id as enrollment_id,
                er.last_name || ', ' || er.first_name as full_name,
                er.lrn,
                er.grade_level,
                COALESCE(er.sex, 'N/A') as sex,
                COALESCE(er.age, 0) as age,
                NULL as assigned_section,
                er.school_year,
                er.created_at as enrollment_date,
                'pending' as enrollment_status
            FROM early_registration er
            WHERE NOT EXISTS (
                SELECT 1 FROM students st WHERE st.enrollment_id = er.id::text
            )
            ORDER BY er.created_at DESC
            LIMIT 20
        `);
        res.json({ 
            success: true, 
            count: result.rows.length,
            records: result.rows 
        });
    } catch (err) {
        console.error('Error fetching pending students:', err);
        res.status(500).json({ success: false, error: err.message, details: err.toString() });
    }
});

// Debug endpoint to check students table
app.get('/api/debug/students', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, enrollment_id, last_name, first_name, grade_level, enrollment_status, created_at
            FROM students
            ORDER BY created_at DESC
            LIMIT 20
        `);
        res.json({ 
            success: true, 
            count: result.rows.length,
            records: result.rows 
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DEBUG ENDPOINT: Manually insert sections
app.post('/api/debug/insert-sections', async (req, res) => {
    // Simple auth check - requires ictcoor role
    if (!req.session.user || req.session.user.role !== 'ictcoor') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        console.log('ðŸ”§ Manual section insertion requested...');
        
        const sections = [
            { grade: 'Kindergarten', name: 'angel', capacity: 35, room: 'Room 101' },
            { grade: 'Kindergarten', name: 'dahlia', capacity: 35, room: 'Room 102' },
            { grade: 'Kindergarten', name: 'lily', capacity: 35, room: 'Room 103' },
            { grade: 'Kindergarten', name: 'santan', capacity: 35, room: 'Room 104' },
            { grade: 'Grade 1', name: 'rosal', capacity: 40, room: 'Room 201' },
            { grade: 'Grade 1', name: 'rose', capacity: 40, room: 'Room 202' },
            { grade: 'Grade 2', name: 'camia', capacity: 40, room: 'Room 301' },
            { grade: 'Grade 2', name: 'daisy', capacity: 40, room: 'Room 302' },
            { grade: 'Grade 2', name: 'lirio', capacity: 40, room: 'Room 303' },
            { grade: 'Grade 3', name: 'adelfa', capacity: 40, room: 'Room 401' },
            { grade: 'Grade 3', name: 'orchids', capacity: 40, room: 'Room 402' },
            { grade: 'Grade 4', name: 'ilang-ilang', capacity: 40, room: 'Room 501' },
            { grade: 'Grade 4', name: 'sampaguita', capacity: 40, room: 'Room 502' },
            { grade: 'Grade 5', name: 'blueberry', capacity: 45, room: 'Room 601' },
            { grade: 'Grade 5', name: 'everlasting', capacity: 45, room: 'Room 602' },
            { grade: 'Grade 6', name: 'cattleya', capacity: 45, room: 'Room 701' },
            { grade: 'Grade 6', name: 'sunflower', capacity: 45, room: 'Room 702' },
            { grade: 'Non-Graded', name: 'tulips', capacity: 30, room: 'Room 801' }
        ];

        let inserted = 0;
        let skipped = 0;

        for (const section of sections) {
            const result = await pool.query(
                'INSERT INTO sections (grade_level, section_name, max_capacity, room_number, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (section_name) DO NOTHING RETURNING id',
                [section.grade, section.name, section.capacity, section.room, true]
            );
            if (result.rows.length > 0) {
                inserted++;
                console.log(`   âœ… Inserted: ${section.grade} - ${section.name}`);
            } else {
                skipped++;
            }
        }

        const finalCount = await pool.query('SELECT COUNT(*) as cnt FROM sections');
        
        res.json({
            success: true,
            message: `Sections inserted: ${inserted}, Skipped: ${skipped}`,
            totalSections: finalCount.rows[0].cnt
        });
    } catch (err) {
        console.error('Error inserting sections:', err);
        res.status(500).json({ success: false, message: 'Error inserting sections', error: err.message });
    }
});

// Start the server
app.listen(port, async () => {
    console.log(`\nðŸš€ Server running at http://localhost:${port}\n`);
    
    // Initialize database and create default ictcoor account if needed
    console.log('â•'.repeat(60));
    const dbInitialized = await initializeDatabase();
    console.log('â•'.repeat(60));
    
    if (!dbInitialized) {
        console.warn('âš ï¸  Database initialization encountered issues. Some features may not work correctly.');
    }
});

