# Development Mode Guide

## Overview
The survey application now supports a **development mode** that allows you to test the entire survey flow without requiring a backend API connection.

## How It Works

### Development Mode (Default)
When running locally (`npm run dev`), the application:
- ✅ Automatically detects localhost environment
- ✅ Mocks all API calls with successful responses
- ✅ Stores all data in browser localStorage
- ✅ Never blocks user progression due to API failures
- ✅ Logs all actions to browser console with `[DEV]` prefix

### Production Mode
When deployed to production:
- 🔌 Connects to real backend API
- 💾 Stores data in PostgreSQL database
- ⚠️ Falls back to localStorage if API fails (graceful degradation)

## Configuration

### Environment Variables

**Development (.env.development)**
```bash
VITE_API_ENABLED=false  # Disables API, uses mocks
VITE_API_ENDPOINT=http://localhost:3000/api
```

**Production (.env.production)**
```bash
VITE_API_ENABLED=true  # Enables API
VITE_API_ENDPOINT=https://your-backend.jelastic.infomaniak.com/api
```

## Testing the Survey

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Open Browser Console
Press `F12` or `Cmd+Option+I` to see development logs:
- `[DEV] Mock: initializeExperiment` - Experiment started
- `[DEV] Saved to localStorage: baseline_data` - Data saved locally
- `[DEV] Mock: recordBaseline` - Baseline questions saved
- `[DEV] Mock: sendMessage` - Chat message sent
- `[DEV] Mock: recordDonation` - Donation decision saved
- `[DEV] Mock: submitSurvey` - Survey completed

### 3. Check Stored Data
In browser console:
```javascript
// View all stored data
localStorage.getItem('experiment_init')
localStorage.getItem('baseline_data')
localStorage.getItem('donation_decision')
localStorage.getItem('survey_data')

// View all keys
Object.keys(localStorage)

// Clear all data
localStorage.clear()
```

## Features

### ✅ No Blocking Errors
- Users NEVER see "Failed to record data" alerts
- Survey flow continues even if API fails
- Data is always saved locally as fallback

### ✅ Realistic Flow
- Mock participant IDs: `dev-{timestamp}`
- Random condition assignment (A/B/C/D)
- Mock chatbot responses in development

### ✅ Easy Debugging
- All API calls logged to console
- Timestamp added to all localStorage entries
- Clear `[DEV]` prefix for development logs

## Switching to Production API

To test with real backend locally:

1. Start backend server:
```bash
cd backend
npm start  # Runs on http://localhost:3000
```

2. Update `.env` file:
```bash
VITE_API_ENABLED=true
```

3. Restart frontend:
```bash
npm run dev
```

## Troubleshooting

### Issue: Still seeing API errors
**Solution**: Check browser console - if you see `[DEV]` logs, development mode is working correctly. The errors are logged but don't block users.

### Issue: Data not saving
**Solution**: Open browser DevTools → Application → Local Storage → Check if entries exist

### Issue: Changes to .env not applied
**Solution**: Restart dev server - Vite automatically detects .env changes

## Data Structure

### localStorage Keys
- `experiment_init` - Initial language and setup
- `baseline_data` - Tech comfort and privacy concern (Q1-Q2)
- `chat_${timestamp}` - Each chat message
- `donation_decision` - Donate/decline decision + config
- `survey_data` - All post-task survey responses

### Example Data
```json
{
  "participantId": "dev-1701234567890",
  "techComfort": 5,
  "privacyConcern": 6,
  "timestamp": "2025-11-30T10:23:45.678Z"
}
```

## Production Deployment

When deploying to production:

1. Ensure `.env.production` has correct values:
```bash
VITE_API_ENABLED=true
VITE_API_ENDPOINT=https://your-actual-backend.com/api
```

2. Build for production:
```bash
npm run build
```

3. The production build will:
   - Use real API endpoint
   - Gracefully handle API failures
   - Store data in database when available
   - Fall back to localStorage if API unavailable

## Best Practices

1. **Always test in development mode first**
   - Verify full survey flow works
   - Check all questions display correctly
   - Test different language options

2. **Test with API before production**
   - Set `VITE_API_ENABLED=true` locally
   - Verify database records are created
   - Check API error handling

3. **Monitor production logs**
   - Check browser console for API errors
   - Verify data reaching database
   - Test fallback behavior

## Questions?
Contact: hello@ailights.org
