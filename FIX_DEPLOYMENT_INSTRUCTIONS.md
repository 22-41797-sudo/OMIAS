# 🔧 How to Apply the Document Request Fixes

## Issue Summary
The document request system had two main problems:
1. ❌ Date was showing "Not yet set" instead of the submission date
2. ❌ PDF download was not showing request information and token

## Root Cause
The `created_at` timestamp was not being explicitly set in the database INSERT statement when a document request was submitted.

## Fix Applied
**File:** `server.js` (Line 3514-3520)

The INSERT query now explicitly sets `created_at` with `CURRENT_TIMESTAMP`:

```javascript
// BEFORE (didn't set created_at):
INSERT INTO document_requests (
    request_token, student_name, student_id, contact_number, email,
    document_type, purpose, additional_notes,
    adviser_name, adviser_school_year, student_type, status
) VALUES (...)

// AFTER (now sets created_at):
INSERT INTO document_requests (
    request_token, student_name, student_id, contact_number, email,
    document_type, purpose, additional_notes,
    adviser_name, adviser_school_year, student_type, status, created_at
) VALUES (..., CURRENT_TIMESTAMP)
```

## What You Need to Do

### ⚠️ IMPORTANT: Restart Your Server

Since the code has been updated, you **MUST** restart your Node.js server for the changes to take effect:

```powershell
# 1. Stop the currently running server (if it's running)
# Press Ctrl+C in the terminal where the server is running

# 2. Start the server again
npm start
# OR
node server.js
```

### ✅ After Restarting

Once the server is restarted, **any NEW document requests** will have:
- ✅ Correct submission date (not "Not yet set")
- ✅ All data will be saved to the database
- ✅ PDF download will include all information and the token

### Test the Fix

**Option 1: Manual Testing**
1. Go to `/document-request.html`
2. Fill out the form and submit
3. Copy the token from the success message
4. Go to `/check-document-status.html`
5. Paste the token and click "Check Status"
6. Verify the date shows correctly (should be today's date)
7. Click "Download PDF" and verify it includes:
   - Your name
   - Email
   - Contact number
   - Document type
   - Purpose
   - Request date
   - **Tracking token** (prominently displayed)

**Option 2: Automated Testing**
```powershell
cd "c:\Users\Denielle\OneDrive\DEEJAY\ICT Coor (RBAC)"
node test_document_request.js
```

This will:
- Create a test request
- Retrieve it
- Verify all fields are correct
- Show you how to access it online

## Summary of Changes

### Files Modified
- ✅ `server.js` - Fixed INSERT statement to explicitly set `created_at`

### Files Created
- ✅ `test_document_request.js` - Test script to verify system is working

### Previously Fixed
- ✅ `public/check-document-status.html` - PDF CSS and date formatting
- ✅ `init-db.js` - Database schema migrations

## Verification Checklist

After restarting the server:
- [ ] Submit a new document request
- [ ] Note the token provided
- [ ] Check the request status
- [ ] Verify the date shows the current date (not "January 1, 1970" or "Not yet set")
- [ ] Download the PDF
- [ ] Verify PDF contains:
  - [ ] School name
  - [ ] Student information
  - [ ] Document type
  - [ ] Purpose
  - [ ] Request date
  - [ ] Status
  - [ ] **Tracking token**
- [ ] Test on mobile device (if needed)

## Still Having Issues?

If the date still shows "Not yet set" after restarting:

1. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for the logged `created_at` value
   - Note what it shows

2. **Check browser cache:**
   - Clear cache and cookies for your site
   - Do a hard refresh (Ctrl+Shift+R)

3. **Verify server is running latest code:**
   - Make sure you restarted the server after pulling the latest code

4. **Check database directly:**
   - Run: `node test_document_request.js`
   - Check if the created_at field is populated

## Questions?

If you're still experiencing issues:
1. Provide a screenshot of what you see
2. Open browser DevTools (F12) and check the Console tab
3. Look for any error messages
4. Run the test script and share the output

---

**Last Updated:** December 9, 2025
**Status:** ✅ All fixes applied and ready for deployment
