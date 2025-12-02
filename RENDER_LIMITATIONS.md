# Render Platform Limitations & Considerations

## Current Setup on Render

Your OMIAS system is running on:
- **Service**: Web service (Node.js/Express)
- **Database**: PostgreSQL managed database
- **Storage**: Ephemeral file system (uploads don't persist)

## Key Limitations You'll Hit

### 1. **File Storage (CRITICAL - Already Affecting You)**
- ❌ Uploaded files (signatures, documents) are **DELETED** when the app restarts
- ❌ `/uploads/signatures/` returns 404 because files aren't persisted
- ✅ **Solution**: Use cloud storage (AWS S3, Firebase, Cloudinary, or store in database as base64)

### 2. **Web Service Limits**
| Limit | Your Plan | What It Means |
|-------|-----------|--------------|
| **RAM** | 512 MB | Enough for Node.js + small number of concurrent users |
| **CPU** | Shared | Single core, may slow down during peak usage |
| **Concurrent Connections** | Unlimited | Good |
| **Outbound Bandwidth** | 100 GB/month | More than enough for a school |
| **Request Size** | 1 MB | Forms with large files might fail |

**Risk Level**: 🟡 MEDIUM - Will work fine now, but slow if 100+ users try at once

### 3. **Database Limits**
| Limit | Your Plan | What It Means |
|-------|-----------|--------------|
| **Storage** | 50 MB free | Currently using ~5-10 MB |
| **Connections** | 20 active | Enough for typical school usage |
| **Backup Duration** | 7 days | Can restore up to 7 days back |
| **Query Performance** | Shared resources | Queries slow if many running simultaneously |

**Risk Level**: 🟡 MEDIUM - You have plenty of space now, but will outgrow in 1-2 years

### 4. **Cost Escalation**
| Usage | Free Tier Cost | When It Triggers |
|-------|---|---|
| Storage > 50 MB | $0.25/GB/month | Never (unless 5 years of data) |
| Database > 20 connections | Auto-scales | School never hits this |
| High CPU usage | $0.05/hour extra | Peak hours with 200+ concurrent users |
| Bandwidth > 100 GB/month | $0.01/GB | Large file transfers to all students |

**Current Cost**: FREE ✅

### 5. **Deployment Limitations**
- ❌ No auto-scaling (app stops during heavy traffic)
- ❌ 30-second deployment downtime
- ⚠️ Free tier can spin down after 15 minutes of inactivity (then takes ~30 sec to wake up)

## What Will Break First

**In order of likelihood:**

1. **Signature Images 404** (Already happening)
   - Fix: Store in database or cloud storage
   - Time to impact: NOW
   - Difficulty: Medium (2-3 hours work)

2. **Slow Performance During Registration Period**
   - Happens when 100+ students enroll simultaneously
   - Fix: Upgrade to paid tier or use CDN
   - Time to impact: Registration season
   - Difficulty: Low (just upgrade)

3. **Database Space Runs Out**
   - After 5+ years of data
   - Fix: Archive old data or upgrade database
   - Time to impact: ~5 years
   - Difficulty: Medium

4. **Email Sending Rate Limits**
   - Gmail limits ~300 emails/hour from one account
   - Fix: Use SendGrid or AWS SES
   - Time to impact: During bulk operations
   - Difficulty: Medium

## Immediate Fixes Needed

### Priority 1: Signature Image Storage (URGENT)
Your current issue with 404 on signatures.

**Option A: Store in Database (Simplest)**
- Store signature as base64 in enrollment_requests
- Add to download/viewing logic
- Time: 2-3 hours
- Cost: $0
- Limitation: Database gets bigger

**Option B: Use Cloud Storage (Best)**
- AWS S3: $1/month for ~1000 files
- Firebase: Free tier then $0.18/GB
- Cloudinary: Free tier for images
- Time: 4-6 hours
- Cost: $1-5/month
- Benefit: Unlimited storage, CDN included

### Priority 2: Email Configuration (DONE)
✅ Already set up with Gmail
- Limitation: 300 emails/hour
- When to upgrade: If sending 300+ bulk emails

## Recommendations

### For Next 6 Months (Current Setup)
- ✅ Keep using free Render tier
- ✅ Fix signature storage (cloud or database)
- ✅ Monitor performance during peak hours
- ✅ Set up automated database backups

### For Year 1+
- Consider upgrading Web Service to $7/month if you have 100+ concurrent users
- Upgrade database to $16/month once you have 5+ years of data

### For Long-term (3+ years)
- Use S3 or similar for all file storage
- Consider scaling architecture (multiple servers)
- Use Redis for caching if slow
- Archive old data to save storage

## Cost Projection

| Year | Expected Cost | What's Included |
|------|---|---|
| Year 1 | $0-10 | Free tier + small storage |
| Year 2 | $10-50 | Paid database + small server |
| Year 3+ | $30-100 | Multiple services + full monitoring |

**For comparison**: Traditional hosting would cost $200-500/year for equivalent service.

## Action Items

### This Week
- [ ] Fix signature storage (Priority 1)
- [ ] Test approval process thoroughly
- [ ] Verify email sending works with configured credentials

### Next Month
- [ ] Set up automated database backups
- [ ] Monitor Render dashboard for resource usage
- [ ] Plan storage upgrade strategy

### Next Year
- [ ] Evaluate upgrade needs based on actual usage
- [ ] Consider moving to AWS/Google Cloud if scaling needed
- [ ] Set up monitoring/alerting

## Questions to Track

1. How many concurrent users during peak hours?
2. How many new student enrollments per month?
3. Will signature storage need to handle video/large files?
4. Do you need document backups/archives?

These answers will determine when to upgrade.
