# Error Viewing Guide

This guide shows you where and how to see errors in the Resource Management Tool.

---

## 📋 Table of Contents

1. [Bulk Import Errors](#bulk-import-errors)
2. [Browser Console Errors](#browser-console-errors)
3. [Backend Server Errors](#backend-server-errors)
4. [Database Errors](#database-errors)
5. [Network Errors](#network-errors)

---

## 1. Bulk Import Errors

### Location
Errors appear **directly in the Bulk Import modal** after clicking "Import Developers".

### What You'll See

#### ✅ Success Section (Green)
```
Successfully Added 3 Developers
✓ John Doe (john@example.com)
✓ Jane Smith (jane@example.com)
✓ Mike Johnson (mike@example.com)
```

#### ❌ Error Section (Red)
```
Failed to Add 2 Developers

Row 2:
• Email already exists in database
Data: {"name":"Bob Smith","email":"bob@company.com","skills":["Python"]}

Row 5:
• Invalid email format
Data: {"name":"Test User","email":"invalid-email","skills":["React"]}
```

### Common Bulk Import Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Email already exists in database" | Duplicate email | Use unique email or remove existing developer |
| "Invalid email format" | Bad email syntax | Fix email format (e.g., user@domain.com) |
| "Name is required" | Missing name field | Add name to the row |
| "Skills is required and must be a non-empty array" | Empty/missing skills | Add at least one skill |
| "Failed to parse CSV/JSON" | Invalid format | Check syntax, quotes, commas |

### How to Test Bulk Import Errors

**Test CSV with intentional errors:**
```csv
name,email,skills
Good User,good@example.com,"React,TypeScript"
Bad User,alice@company.com,"Node.js"
Missing Email,,React
Bad Email,not-an-email,"Vue.js"
No Skills,test@example.com,""
```

This will show different error types!

---

## 2. Browser Console Errors

### How to Open Browser Console

#### Chrome/Edge
- **Mac:** `Cmd + Option + J`
- **Windows/Linux:** `Ctrl + Shift + J`
- Or: Right-click → "Inspect" → "Console" tab

#### Firefox
- **Mac:** `Cmd + Option + K`
- **Windows/Linux:** `Ctrl + Shift + K`

#### Safari
- **Mac:** `Cmd + Option + C`
- Enable: Safari → Preferences → Advanced → "Show Develop menu"

### What You'll See

#### Frontend Errors
```javascript
Error fetching developers: Failed to fetch
Error adding developer: Request failed with status 500
Error: Cannot read property 'map' of undefined
```

#### Network Errors
```javascript
GET http://localhost:3001/api/developers net::ERR_CONNECTION_REFUSED
Failed to load resource: net::ERR_FAILED
```

#### API Errors
```javascript
Error adding developer: Email already exists in database
Error creating allocation: Invalid developer or project ID
```

### Console Error Levels

- 🔴 **Red (Error)** - Critical issues
- 🟡 **Yellow (Warning)** - Non-critical issues
- 🔵 **Blue (Info)** - Informational messages
- ⚪ **Gray (Log)** - Debug information

---

## 3. Backend Server Errors

### Where to See Them
Backend errors appear in the **terminal where you ran `npm run dev`**

### Terminal Location
The terminal where you ran:
```bash
cd server
npm run dev
```

### What You'll See

#### Connection Errors
```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect
```
**Solution:** Start PostgreSQL

#### Database Errors
```
error: relation "developers" does not exist
```
**Solution:** Run migrations: `npm run db:migrate`

#### Validation Errors
```
Error creating developer: duplicate key value violates unique constraint "developers_email_key"
```
**Solution:** Use unique email address

#### Request Errors
```
POST /api/developers 400 - 45.234 ms
Error: Name is required and must be a string
```

### Sample Backend Error Log
```
2025-10-13T18:04:40.207Z - POST /api/developers
Error creating developer: Error: duplicate key value violates unique constraint "developers_email_key"
    at Object.create (/Users/.../server/dist/routes/developers.js:45:15)
```

---

## 4. Database Errors

### How to Check Database

#### Connect to PostgreSQL
```bash
/opt/homebrew/opt/postgresql@14/bin/psql resource_management
```

#### Check for Errors
```sql
-- See all developers
SELECT * FROM developers;

-- Check for duplicates
SELECT email, COUNT(*) 
FROM developers 
GROUP BY email 
HAVING COUNT(*) > 1;

-- See recent errors (if logging enabled)
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
```

#### Common Database Errors

```sql
ERROR:  relation "developers" does not exist
Solution: Run migrations

ERROR:  duplicate key value violates unique constraint
Solution: Use unique email addresses

ERROR:  syntax error at or near "INSERT"
Solution: Check SQL syntax
```

---

## 5. Network Errors (API Connection Issues)

### Frontend Shows Connection Error

#### What You See in Browser
```
Unable to Connect
Failed to load data from the server. Please make sure the backend server is running.

Quick fixes:
• Ensure PostgreSQL is running
• Start the backend server: cd server && npm run dev
• Check database connection in server/.env
• Verify API URL in .env
```

#### Network Tab (Chrome DevTools)

1. Open DevTools → **Network** tab
2. Try an action (e.g., load developers)
3. Look for red/failed requests

**Successful Request:**
```
GET /api/developers  200  50ms
Response: [{"id":"dev1","name":"Alice"...}]
```

**Failed Request:**
```
GET /api/developers  Failed  (net::ERR_CONNECTION_REFUSED)
Status: (failed)
```

---

## 🔧 Debugging Steps

### Step 1: Check if Backend is Running
```bash
curl http://localhost:3001/health
```

**Expected:** `{"status":"ok","timestamp":"..."}`

**If fails:** Backend is not running. Start it:
```bash
cd server && npm run dev
```

### Step 2: Check if Database is Running
```bash
/opt/homebrew/opt/postgresql@14/bin/pg_isready
```

**Expected:** `/opt/homebrew/var/postgresql@14:5432 - accepting connections`

**If fails:** Start PostgreSQL:
```bash
brew services start postgresql@14
```

### Step 3: Test API Directly
```bash
# Test developers endpoint
curl http://localhost:3001/api/developers

# Test with verbose output
curl -v http://localhost:3001/api/developers
```

### Step 4: Check Logs
```bash
# Backend terminal - shows server logs
# Frontend terminal - shows build errors
# Browser console - shows runtime errors
```

---

## 📊 Error Checklist

When something goes wrong, check in this order:

- [ ] **Browser Console** - Frontend errors
- [ ] **Network Tab** - API connection issues  
- [ ] **Backend Terminal** - Server errors
- [ ] **Database** - Data/connection issues
- [ ] **Environment Files** - Configuration issues

---

## 🎯 Common Error Scenarios

### Scenario 1: "Unable to Connect" on Frontend

**Check:**
1. Is backend running? (`curl http://localhost:3001/health`)
2. Is PostgreSQL running? (`pg_isready`)
3. Are ports correct? (Backend: 3001, Frontend: 5173)

### Scenario 2: Bulk Import Fails Silently

**Check:**
1. Browser console for JavaScript errors
2. Backend terminal for API errors
3. Network tab for failed requests

### Scenario 3: Data Not Persisting

**Check:**
1. Database connection in `server/.env`
2. Backend terminal for database errors
3. Run: `psql resource_management -c "SELECT COUNT(*) FROM developers;"`

### Scenario 4: Import Shows "Email already exists"

**Check:**
```bash
# See all emails in database
psql resource_management -c "SELECT email FROM developers ORDER BY email;"
```

---

## 💡 Pro Tips

### Enable Verbose Logging

**Backend:**
Add to `server/src/server.ts`:
```typescript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});
```

**Frontend:**
In DataContext, errors are already logged:
```typescript
console.error('Error fetching data:', err);
```

### Save Error Logs

**Backend:**
```bash
cd server
npm run dev 2>&1 | tee error.log
```

**Frontend:**
Right-click in console → "Save as..."

---

## 🚨 Emergency Commands

### Reset Everything
```bash
# Stop all
pkill -f "npm run dev"

# Reset database
psql resource_management -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd server && npm run db:migrate && npm run db:seed

# Restart
cd server && npm run dev &
npm run dev
```

### Clear Browser Cache
- Chrome: `Cmd/Ctrl + Shift + Delete`
- Or use Incognito/Private mode

---

## 📞 Getting Help

If errors persist:

1. **Check this guide** for common solutions
2. **Look at browser console** for exact error messages
3. **Check backend terminal** for server-side errors
4. **Verify database** is running and accessible
5. **Test API directly** with curl commands

Most issues are:
- Backend not running (90% of "Unable to Connect" errors)
- PostgreSQL not started
- Wrong email format in bulk import
- Duplicate emails

---

## ✅ Error Resolution Success Rate

| Error Type | Typical Cause | Time to Fix |
|-----------|---------------|-------------|
| Connection Refused | Backend not running | 10 seconds |
| Database Errors | PostgreSQL stopped | 30 seconds |
| Bulk Import Validation | Bad data format | 2 minutes |
| Duplicate Key | Email exists | 1 minute |

Most errors can be fixed in under 5 minutes! 🎉

