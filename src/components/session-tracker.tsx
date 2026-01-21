'use client';

import { useEffect } from 'react';

export default function SessionTracker() {
  useEffect(() => {
    // This code runs only on the client, after hydration, and is safe for SSR.
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const hasVisited = sessionStorage.getItem('pisa-vibe-session');
        if (!hasVisited) {
          sessionStorage.setItem('pisa-vibe-session', 'true');
          fetch('https://us-central1-studio-4155277971-b1669.cloudfunctions.net/logAccess', {
            method: 'POST',
          }).catch(e => {
            console.error("SessionTracker: Failed to log access.", e);
          });
        }
      } catch (error) {
        // This can happen if sessionStorage is disabled (e.g., private browsing on some browsers)
        console.error('SessionTracker: Could not access sessionStorage.', error);
      }
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // This component does not render anything.
}
