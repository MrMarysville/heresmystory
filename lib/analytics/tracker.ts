/**
 * Analytics Tracking System
 * Privacy-friendly analytics with no PII tracking
 */

export type EventName =
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'profile_created'
  | 'profile_viewed'
  | 'profile_updated'
  | 'recording_started'
  | 'recording_paused'
  | 'recording_resumed'
  | 'recording_stopped'
  | 'recording_completed'
  | 'story_listened'
  | 'story_shared'
  | 'import_started'
  | 'import_completed'
  | 'consent_granted'
  | 'consent_revoked'
  | 'pdf_generated'
  | 'video_generated'
  | 'keepsake_downloaded'
  | 'library_searched'
  | 'accessibility_enabled'
  | 'error_occurred'

export interface EventProperties {
  [key: string]: string | number | boolean | undefined
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker
  private enabled = false
  private userId: string | null = null
  private sessionId: string
  private queue: Array<{ event: EventName; properties: EventProperties; timestamp: string }> = []
  private endpoint = '/api/analytics/track'
  private flushInterval = 10000 // 10 seconds
  private flushTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'

    if (this.enabled) {
      this.startAutoFlush()

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker()
    }
    return AnalyticsTracker.instance
  }

  /**
   * Initialize analytics with user ID (called after login)
   */
  init(userId: string): void {
    this.userId = userId
  }

  /**
   * Clear user ID (called after logout)
   */
  reset(): void {
    this.userId = null
  }

  /**
   * Track an event
   */
  track(event: EventName, properties: EventProperties = {}): void {
    if (!this.enabled) {
      console.log('[Analytics]', event, properties)
      return
    }

    // Add event to queue
    this.queue.push({
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId || undefined,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        screenWidth: typeof window !== 'undefined' ? window.screen.width : undefined,
        screenHeight: typeof window !== 'undefined' ? window.screen.height : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      },
      timestamp: new Date().toISOString(),
    })

    // Flush if queue is large
    if (this.queue.length >= 20) {
      this.flush()
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties: EventProperties = {}): void {
    this.track('user_login', {
      page: pageName,
      ...properties,
    })
  }

  /**
   * User lifecycle events
   */
  userSignup(properties?: EventProperties): void {
    this.track('user_signup', properties)
  }

  userLogin(properties?: EventProperties): void {
    this.track('user_login', properties)
  }

  userLogout(properties?: EventProperties): void {
    this.track('user_logout', properties)
    this.reset()
  }

  /**
   * Profile events
   */
  profileCreated(properties?: EventProperties): void {
    this.track('profile_created', properties)
  }

  profileViewed(profileId: string, properties?: EventProperties): void {
    this.track('profile_viewed', {
      profileId,
      ...properties,
    })
  }

  profileUpdated(profileId: string, properties?: EventProperties): void {
    this.track('profile_updated', {
      profileId,
      ...properties,
    })
  }

  /**
   * Recording events
   */
  recordingStarted(properties?: EventProperties): void {
    this.track('recording_started', properties)
  }

  recordingPaused(duration: number, properties?: EventProperties): void {
    this.track('recording_paused', {
      duration,
      ...properties,
    })
  }

  recordingResumed(properties?: EventProperties): void {
    this.track('recording_resumed', properties)
  }

  recordingStopped(duration: number, properties?: EventProperties): void {
    this.track('recording_stopped', {
      duration,
      ...properties,
    })
  }

  recordingCompleted(duration: number, properties?: EventProperties): void {
    this.track('recording_completed', {
      duration,
      ...properties,
    })
  }

  /**
   * Story events
   */
  storyListened(sessionId: string, properties?: EventProperties): void {
    this.track('story_listened', {
      sessionId,
      ...properties,
    })
  }

  storyShared(sessionId: string, method: string, properties?: EventProperties): void {
    this.track('story_shared', {
      sessionId,
      method,
      ...properties,
    })
  }

  /**
   * Import events
   */
  importStarted(fileCount: number, properties?: EventProperties): void {
    this.track('import_started', {
      fileCount,
      ...properties,
    })
  }

  importCompleted(fileCount: number, duration: number, properties?: EventProperties): void {
    this.track('import_completed', {
      fileCount,
      duration,
      ...properties,
    })
  }

  /**
   * Consent events
   */
  consentGranted(profileId: string, properties?: EventProperties): void {
    this.track('consent_granted', {
      profileId,
      ...properties,
    })
  }

  consentRevoked(profileId: string, properties?: EventProperties): void {
    this.track('consent_revoked', {
      profileId,
      ...properties,
    })
  }

  /**
   * Keepsake events
   */
  pdfGenerated(sessionId: string, properties?: EventProperties): void {
    this.track('pdf_generated', {
      sessionId,
      ...properties,
    })
  }

  videoGenerated(sessionId: string, properties?: EventProperties): void {
    this.track('video_generated', {
      sessionId,
      ...properties,
    })
  }

  keepsakeDownloaded(type: string, properties?: EventProperties): void {
    this.track('keepsake_downloaded', {
      type,
      ...properties,
    })
  }

  /**
   * Library events
   */
  librarySearched(query: string, resultsCount: number, properties?: EventProperties): void {
    this.track('library_searched', {
      query,
      resultsCount,
      ...properties,
    })
  }

  /**
   * Accessibility events
   */
  accessibilityEnabled(feature: string, properties?: EventProperties): void {
    this.track('accessibility_enabled', {
      feature,
      ...properties,
    })
  }

  /**
   * Error events
   */
  errorOccurred(errorType: string, properties?: EventProperties): void {
    this.track('error_occurred', {
      errorType,
      ...properties,
    })
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const eventsToSend = [...this.queue]
    this.queue = []

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
        }),
        // Use keepalive for beacon-like behavior on page unload
        keepalive: true,
      })

      if (!response.ok) {
        console.error('Failed to send analytics events:', response.statusText)
      }
    } catch (err) {
      console.error('Error sending analytics:', err)
    }
  }

  /**
   * Start automatic flushing
   */
  private startAutoFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * Stop automatic flushing
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current queue (for debugging)
   */
  getQueue(): typeof this.queue {
    return [...this.queue]
  }
}

// Singleton instance
export const analytics = AnalyticsTracker.getInstance()

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return analytics
}
