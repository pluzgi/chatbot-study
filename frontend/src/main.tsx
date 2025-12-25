import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import SurveyDebugNavigator from './dev/SurveyDebugNavigator.tsx'
import './index.css'

// Check for debug mode via URL params (dev only)
const isDebugMode = () => {
  if (import.meta.env.PROD) return false; // Never in production
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'survey';
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDebugMode() ? <SurveyDebugNavigator /> : <App />}
  </React.StrictMode>,
)
