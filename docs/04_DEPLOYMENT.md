# Deployment & Testing

## Deployment Order

1. **Python Microservice** (Swiss Voting Data)
2. **PostgreSQL Database** (Infomaniak)
3. **Node.js Backend** (Infomaniak Jelastic)
4. **Frontend** (Lovable → ailights.org/ballot-chat)

---

## 1. Python Microservice

### Deploy to Infomaniak Jelastic

```bash
# Create Python 3.10+ environment
# SSH into environment
ssh user@your-python-node.jelastic.infomaniak.com

# Upload your code
git clone your-repo
cd swiss-voting-tools

# Install dependencies
pip install flask flask-cors
# + any other dependencies from your swiss_voting_tools

# Run
python swiss_voting_api.py

# Or with PM2 for production
pip install pm2
pm2 start swiss_voting_api.py --name swiss-voting
pm2 save
```

### Test
```bash
curl http://your-python-node.jelastic.infomaniak.com:5000/health
# Should return: {"status": "ok"}

curl http://your-python-node.jelastic.infomaniak.com:5000/api/initiatives/upcoming
# Should return: JSON array of upcoming votes
```

---

## 2. PostgreSQL Database

### Create Database

```bash
# In Jelastic dashboard, add PostgreSQL node
# Connect via psql

psql -h postgresql-node.jelastic.infomaniak.com -U admin -d postgres

# Create database
CREATE DATABASE voting_assistant;
\c voting_assistant

# Run schema (from 02_BACKEND.md)
CREATE TABLE participants (...);
CREATE TABLE donation_decisions (...);
CREATE TABLE post_task_measures (...);
```

### Test
```bash
# Verify tables exist
\dt

# Should show:
# participants
# donation_decisions
# post_task_measures
```

---

## 3. Node.js Backend

### Deploy to Infomaniak Jelastic

```bash
# Create Node.js 18+ environment
# SSH into environment
ssh user@your-node.jelastic.infomaniak.com

# Upload backend code
git clone your-backend-repo
cd backend

# Install dependencies
npm install

# Set environment variables
nano .env
# Add:
# INFOMANIAK_APERTUS_ENDPOINT=...
# INFOMANIAK_API_KEY=...
# PYTHON_SERVICE_URL=http://your-python-node:5000
# DATABASE_HOST=...
# FRONTEND_URL=https://ailights.org

# Run
node src/index.js

# Or with PM2
pm2 start src/index.js --name voting-backend
pm2 save
```

### Configure Domain
```bash
# In Jelastic dashboard:
# Environment → Settings → Custom Domains
# Add: api.ailights.org (or use default .jelastic.infomaniak.com)
```

### Test
```bash
curl https://api.ailights.org/health
# Should return: {"status": "ok"}

# Test experiment initialization
curl -X POST https://api.ailights.org/api/experiment/initialize \
  -H "Content-Type: application/json" \
  -d '{"language": "de"}'
# Should return session data
```

---

## 4. Frontend (Lovable)

### Configure

1. **Go to Lovable dashboard** → Your project
2. **Settings** → Environment Variables:
   - `VITE_API_ENDPOINT` = `https://api.ailights.org/api`
3. **Upload all files** from 03_FRONTEND.md
4. **Configure routing** for `/ballot-chat` page

### Deploy

1. **Build** in Lovable
2. **Deploy** (automatically deploys to ailights.org)
3. **Test** at https://ailights.org/ballot-chat

---

## Testing Checklist

### End-to-End Test

- [ ] Visit https://ailights.org/ballot-chat
- [ ] Select language (DE/FR/IT/EN)
- [ ] Click "Start Study"
- [ ] System assigns condition → Chat appears
- [ ] Ask 2+ questions about Swiss ballots
- [ ] Responses appear within 5 seconds
- [ ] After 2 questions, donation modal appears
- [ ] Modal shows correct condition (A/B/C/D)
- [ ] Make decision → Survey appears
- [ ] Complete survey → Debriefing appears

### Test Each Condition

**Condition A (Baseline):**
- [ ] Generic text shown
- [ ] Binary Accept/Decline buttons
- [ ] No DNL, no dashboard

**Condition B (Transparency):**
- [ ] Data Nutrition Label displays
- [ ] All 5 modules visible
- [ ] Binary Accept/Decline

**Condition C (Agency):**
- [ ] Generic text
- [ ] Granular Dashboard displays
- [ ] Toggles and sliders work

**Condition D (Trustworthy AI):**
- [ ] Both DNL and Dashboard
- [ ] Everything works together

### Database Verification

```sql
-- Check participants are created
SELECT condition, COUNT(*) FROM participants GROUP BY condition;

-- Check decisions are recorded
SELECT * FROM donation_decisions ORDER BY decision_timestamp DESC LIMIT 10;

-- Verify language distribution
SELECT language, COUNT(*) FROM participants GROUP BY language;
```

---

## Troubleshooting

### Issue: CORS errors
**Fix:** Check `FRONTEND_URL` in backend .env matches https://ailights.org

### Issue: Apertus API timeout
**Fix:** Check `INFOMANIAK_API_KEY` is valid, test with curl

### Issue: Python service not responding
**Fix:** Check Python service is running: `pm2 status`

### Issue: Database connection failed
**Fix:** Verify `DATABASE_HOST` and credentials in .env

### Issue: Chat responses in wrong language
**Fix:** Verify i18n.language is passed to backend API calls

---

## Monitoring

### Logs

**Backend logs:**
```bash
pm2 logs voting-backend
```

**Python service logs:**
```bash
pm2 logs swiss-voting
```

**Database queries:**
```sql
-- Active participants in last hour
SELECT COUNT(*) FROM participants 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Donation rate by condition
SELECT 
  condition,
  COUNT(*) as total,
  SUM(CASE WHEN decision = 'donate' THEN 1 ELSE 0 END) as donated,
  ROUND(100.0 * SUM(CASE WHEN decision = 'donate' THEN 1 ELSE 0 END) / COUNT(*), 2) as rate
FROM donation_decisions
GROUP BY condition;
```

---

## Production Readiness

Before launching study:

- [ ] All services deployed and running
- [ ] SSL certificates valid (https)
- [ ] Database backups configured
- [ ] Error monitoring set up
- [ ] Test with 5 people end-to-end
- [ ] All 4 conditions tested
- [ ] All 4 languages tested
- [ ] Data collection verified in database

---

## Quick Reference

### URLs
- Frontend: https://ailights.org/ballot-chat
- Backend: https://api.ailights.org
- Python Service: http://internal:5000 (not public)
- Database: postgresql-node.jelastic.infomaniak.com

### API Endpoints
- `POST /api/experiment/initialize` - Start session
- `POST /api/chat/message` - Send chat message
- `POST /api/donation/decision` - Record donation
- `POST /api/donation/post-measures` - Submit survey

### Environment Variables

**Backend:**
```
INFOMANIAK_APERTUS_ENDPOINT=https://api.infomaniak.com/apertus
INFOMANIAK_API_KEY=your_key
PYTHON_SERVICE_URL=http://python-node:5000
DATABASE_HOST=postgresql-node.jelastic.infomaniak.com
FRONTEND_URL=https://ailights.org
```

**Frontend (Lovable):**
```
VITE_API_ENDPOINT=https://api.ailights.org/api
```
