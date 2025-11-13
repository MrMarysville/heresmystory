/**
 * Unit Tests for Analytics Tracker
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { analytics } from '@/lib/analytics/tracker'

describe('Analytics Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    analytics.stopAutoFlush()
  })

  it('should initialize with userId', () => {
    analytics.init('user123')
    // Can't directly access userId, but we can verify it's set via tracking
    analytics.track('user_login')
    const queue = analytics.getQueue()
    expect(queue[0].properties.userId).toBe('user123')
  })

  it('should reset userId on logout', () => {
    analytics.init('user123')
    analytics.reset()
    analytics.track('user_login')
    const queue = analytics.getQueue()
    expect(queue[0].properties.userId).toBeUndefined()
  })

  it('should track events with properties', () => {
    analytics.track('recording_started', { duration: 120 })
    const queue = analytics.getQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].event).toBe('recording_started')
    expect(queue[0].properties.duration).toBe(120)
  })

  it('should use convenience methods for user events', () => {
    analytics.userSignup({ method: 'email' })
    analytics.userLogin({ method: 'google' })
    analytics.userLogout()

    const queue = analytics.getQueue()
    expect(queue).toHaveLength(3)
    expect(queue[0].event).toBe('user_signup')
    expect(queue[1].event).toBe('user_login')
    expect(queue[2].event).toBe('user_logout')
  })

  it('should track profile events', () => {
    analytics.profileCreated({ profileId: 'prof123' })
    analytics.profileViewed('prof123')
    analytics.profileUpdated('prof123', { field: 'name' })

    const queue = analytics.getQueue()
    expect(queue).toHaveLength(3)
    expect(queue[0].event).toBe('profile_created')
    expect(queue[1].event).toBe('profile_viewed')
    expect(queue[2].event).toBe('profile_updated')
  })

  it('should track recording lifecycle events', () => {
    analytics.recordingStarted()
    analytics.recordingPaused(30)
    analytics.recordingResumed()
    analytics.recordingStopped(60)
    analytics.recordingCompleted(120)

    const queue = analytics.getQueue()
    expect(queue).toHaveLength(5)
    expect(queue[1].properties.duration).toBe(30)
    expect(queue[3].properties.duration).toBe(60)
    expect(queue[4].properties.duration).toBe(120)
  })

  it('should track keepsake events', () => {
    analytics.pdfGenerated('session123')
    analytics.videoGenerated('session123')
    analytics.keepsakeDownloaded('pdf')

    const queue = analytics.getQueue()
    expect(queue).toHaveLength(3)
    expect(queue[0].event).toBe('pdf_generated')
    expect(queue[1].event).toBe('video_generated')
    expect(queue[2].event).toBe('keepsake_downloaded')
  })

  it('should include session ID and metadata in events', () => {
    analytics.track('user_login')
    const queue = analytics.getQueue()
    expect(queue[0].properties.sessionId).toBeDefined()
    expect(queue[0].properties.timestamp).toBeDefined()
  })

  it('should flush events to server', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    global.fetch = mockFetch

    analytics.track('user_login')
    await analytics.flush()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(analytics.getQueue()).toHaveLength(0)
  })
})
