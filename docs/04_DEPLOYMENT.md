# Deployment & Testing

## Deployment Order

1. **Python Microservice** (Swiss Voting Data)
2. **PostgreSQL Database** (Infomaniak)
3. **Node.js Backend** (Infomaniak Jelastic)
4. **Frontend** (Infomaniak Jelastic → chat-study.ailights.org)

---

## 1. Python Microservice

### Deploy to Infomaniak Jelastic

```bash
# Create Python 3.10+ environment
# SSH into environment
ssh user@thesis-python.jcloud-ver-jpe.ik-server.com

# Upload your code
git clone your-repo
cd python-service

# Install dependencies
pip install -r requirements.txt

# Set environment variables (add to .bashrc or PM2 ecosystem file)
export SWISSVOTES_DATA_DIR=/app/data
export SWISSVOTES_PREFETCH_ON_STARTUP=true
export SWISSVOTES_CACHE_DAYS=7

# Run
python swiss_voting_api.py

# Or with PM2 for production
pm2 start swiss_voting_api.py --name swiss-voting
pm2 save
```

### Environment Variables (Python Service)

| Variable | Default | Description |
|----------|---------|-------------|
| `SWISSVOTES_DATA_DIR` | `./data` | Directory for cached CSV and PDF data |
| `SWISSVOTES_PREFETCH_ON_STARTUP` | `false` | Set to `true` to fetch all data on startup |
| `SWISSVOTES_CACHE_DAYS` | `7` | Days before CSV/PDF cache is refreshed |
| `SWISSVOTES_CSV_URL` | swissvotes.ch URL | Override CSV source (optional) |

**Setting via PM2 ecosystem file (recommended):**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'swiss-voting',
    script: 'swiss_voting_api.py',
    interpreter: 'python3',
    env: {
      SWISSVOTES_DATA_DIR: '/app/data',
      SWISSVOTES_PREFETCH_ON_STARTUP: 'true',
      SWISSVOTES_CACHE_DAYS: '7'
    }
  }]
};
```

Then: `pm2 start ecosystem.config.js`

### Test
```bash
curl http://thesis-python.jcloud-ver-jpe.ik-server.com/health
# Should return: {"status": "ok", "data_source": "swissvotes_csv"}

curl http://thesis-python.jcloud-ver-jpe.ik-server.com/api/initiatives/upcoming
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
# PYTHON_SERVICE_URL=http://thesis-python.jcloud-ver-jpe.ik-server.com
# DATABASE_HOST=...
# FRONTEND_URL=https://chat-study.ailights.org

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

## 4. Frontend (Infomaniak Jelastic)

### Environment: chat-study

Create Apache PHP environment on Jelastic:
1. Click **New Environment**
2. Select **Apache PHP** (e.g., version 2.4.62)
3. Name: `chat-study`
4. Region: Switzerland
5. Create

### Build Locally

```bash
cd frontend
npm install
npm run build   # Creates dist/ folder
```

### Environment Variables

Create `frontend/.env.production`:
```
VITE_API_ENABLED=true
VITE_API_ENDPOINT=https://thesis.jcloud-ver-jpe.ik-server.com/api
```

### Deploy (Manual)

1. Open Jelastic → `chat-study` environment → Config (gear icon on Apache node)
2. Navigate to `/var/www/webroot/ROOT/`
3. Delete default `index.php` file
4. Upload contents of `frontend/dist/` folder (index.html, assets/, vite.svg)

### Configure SPA Routing

Create `.htaccess` in `/var/www/webroot/ROOT/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Configure DNS (Hostpoint)

Add CNAME record pointing to Jelastic:
- **Name:** `chat-study`
- **Target:** `chat-study.jcloud-ver-jpe.ik-server.com`

Verify DNS propagation:
```bash
nslookup chat-study.ailights.org
# Should return: chat-study.jcloud-ver-jpe.ik-server.com
```

### Configure SSL (Let's Encrypt)

**Important:** DNS must be configured and propagated before SSL setup.

1. In Jelastic dashboard, click **Marketplace** (top menu)
2. Switch to **Add-ons** tab
3. Search for **Let's Encrypt Free SSL**
4. Click **Install**
5. Select environment: `chat-study`
6. Enter domain: `chat-study.ailights.org`
7. Confirm installation

The certificate auto-renews every 90 days.

### Test

Visit https://chat-study.ailights.org

---

## 5. Automated Deployment (Git)

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Build
        working-directory: frontend
        run: |
          npm install
          npm run build
        env:
          VITE_API_ENDPOINT: https://thesis.jcloud-ver-jpe.ik-server.com/api
          VITE_API_ENABLED: true

      - name: Deploy via SSH
        uses: appleboy/scp-action@master
        with:
          host: chat-study.jcloud-ver-jpe.ik-server.com
          username: ${{ secrets.JELASTIC_USER }}
          key: ${{ secrets.JELASTIC_SSH_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/webroot/ROOT/"
          strip_components: 2
```

**Required GitHub Secrets:**
- `JELASTIC_USER`: SSH username for chat-study environment
- `JELASTIC_SSH_KEY`: SSH private key for authentication

### Option B: Jelastic Git Deployment

1. Create a `deploy` branch with only built files
2. In Jelastic → `chat-study` → Deployment → Git/SVN
3. Connect to your GitHub repo, branch `deploy`
4. Set deployment path to `/var/www/webroot/ROOT/`
5. Enable auto-deploy on push

**Workflow:**
```bash
# After code changes
cd frontend
npm run build
git checkout deploy
cp -r dist/* .
git add . && git commit -m "Deploy"
git push origin deploy
git checkout main
```

---

## Testing Checklist

### End-to-End Test

- [ ] Visit https://chat-study.ailights.org
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
**Fix:** Check `FRONTEND_URL` in backend .env matches https://chat-study.ailights.org

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
- Frontend: https://chat-study.ailights.org
- Frontend (Jelastic): https://chat-study.jcloud-ver-jpe.ik-server.com
- Backend: https://thesis.jcloud-ver-jpe.ik-server.com
- Python Service: https://thesis-python.jcloud-ver-jpe.ik-server.com (internal)
- Database: 10.101.29.52:5432 (internal)

### API Endpoints
- `POST /api/experiment/initialize` - Start session
- `POST /api/chat/message` - Send chat message
- `POST /api/donation/decision` - Record donation
- `POST /api/donation/post-measures` - Submit survey

### Environment Variables

**Backend (.env on thesis environment):**
```
PORT=3000
INFOMANIAK_APERTUS_ENDPOINT=https://api.infomaniak.com/2/ai/106600/openai
INFOMANIAK_API_KEY=your_key
PYTHON_SERVICE_URL=http://thesis-python.jcloud-ver-jpe.ik-server.com
DATABASE_HOST=10.101.29.52
DATABASE_PORT=5432
DATABASE_NAME=chatbot-study
DATABASE_USER=webadmin
DATABASE_PASSWORD=your_password
FRONTEND_URL=https://chat-study.ailights.org
```

**Frontend (.env.production):**
```
VITE_API_ENABLED=true
VITE_API_ENDPOINT=https://thesis.jcloud-ver-jpe.ik-server.com/api
```
