import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind Imports
import App from './App';

// Global Error Handler for "Async Listener" and "Message Channel" noise
const suppressError = (error: any) => {
  const msg = (error?.message || error?.reason?.message || String(error)).toLowerCase();

  if (msg.includes('message channel closed') ||
    msg.includes('asynchronous response') ||
    msg.includes('resizeobserver') ||
    msg.includes('script error')) {
    return true; // We handled it
  }
  return false;
};

// Catch Unhandled Promise Rejections (e.g. failed fetches, Supabase timeouts)
window.addEventListener('unhandledrejection', (event) => {
  if (suppressError(event.reason)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); // NUCLEAR OPTION
    return;
  }
});

// Catch Runtime Errors
window.addEventListener('error', (event) => {
  if (suppressError(event.error || event.message)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); // NUCLEAR OPTION
    return;
  }
});

// Service Worker Management (Aggressively unregister for dev/stability)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Always unregister existing SWs to prevent stale cache issues during dev
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('[SW] Unregistered old ServiceWorker to prevent conflicts.');
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
