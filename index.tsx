
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Prevent registration in iframes/previews where it fails with security errors (Origin mismatch)
    const isIframe = window.self !== window.top;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Only try to register if likely supported to avoid console red ink
    if (!isIframe || isLocalhost) {
        navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
            // Suppress specific origin error common in previews
            if (registrationError.message?.includes('origin')) {
                console.log('SW registration skipped (Origin mismatch)');
            } else {
                console.warn('SW registration failed: ', registrationError);
            }
        });
    }
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
