import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import SurveyDebugNavigator from './dev/SurveyDebugNavigator.tsx'
import './index.css'

// Check for debug mode via URL params
// In production, requires secret key: ?debug=survey&key=apertus
const isDebugMode = () => {
  const params = new URLSearchParams(window.location.search);
  const isDebugSurvey = params.get('debug') === 'survey';

  if (import.meta.env.PROD) {
    // In production, require secret key
    return isDebugSurvey && params.get('key') === 'apertus';
  }

  // In development, no key required
  return isDebugSurvey;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDebugMode() ? <SurveyDebugNavigator /> : <App />}
  </React.StrictMode>,
)
