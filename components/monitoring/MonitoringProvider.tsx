/**
 * Monitoring Provider
 * Initializes error logging, analytics, and service worker
 */

'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/lib/monitoring/error-logger'
import { analytics } from '@/lib/analytics/tracker'

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Setup global error handler
    setupGlobalErrorHandler()

    // Register service worker (production only)
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      registerServiceWorker()
    }

    // Track page view on mount
    analytics.page(window.location.pathname)

    // Log monitoring initialized
    console.log('[Monitoring] Initialized successfully')
  }, [])

  // Track page navigation
  useEffect(() => {
    const handleRouteChange = () => {
      analytics.page(window.location.pathname)
    }

    // Listen for Next.js route changes
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  return <>{children}</>
}

/**
 * Register service worker
 */
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[SW] Registered successfully:', registration.scope)

    // Check for updates every 24 hours
    setInterval(() => {
      registration.update()
    }, 24 * 60 * 60 * 1000)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[SW] New version available')

            // Optionally show update notification to user
            if (window.confirm('A new version is available. Reload to update?')) {
              newWorker.postMessage('skipWaiting')
              window.location.reload()
            }
          }
        })
      }
    })
  } catch (error) {
    console.error('[SW] Registration failed:', error)
  }
}
