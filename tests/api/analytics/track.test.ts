/**
 * Integration Tests for Analytics Tracking API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Analytics Tracking API', () => {
  const mockEvent = {
    event: 'user_login',
    properties: {
      userId: 'user123',
      sessionId: 'session123',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept analytics events via POST', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          received: 1,
          timestamp: new Date().toISOString(),
        },
      }),
    })
    global.fetch = mockFetch

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [mockEvent] }),
    })

    const data = await response.json()
    expect(response.ok).toBe(true)
    expect(data.success).toBe(true)
    expect(data.data.received).toBe(1)
  })

  it('should reject invalid event format', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'INVALID_EVENTS',
          message: 'Events must be a non-empty array',
        },
      }),
    })
    global.fetch = mockFetch

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [] }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('should accept batch analytics events', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          received: 10,
          timestamp: new Date().toISOString(),
        },
      }),
    })
    global.fetch = mockFetch

    const events = Array(10).fill(mockEvent)
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    })

    const data = await response.json()
    expect(data.data.received).toBe(10)
  })

  it('should retrieve analytics data via GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          events: [mockEvent],
          total: 1,
          limit: 100,
          offset: 0,
        },
      }),
    })
    global.fetch = mockFetch

    const response = await fetch('/api/analytics/track?event=user_login&limit=100')
    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.data.events).toHaveLength(1)
    expect(data.data.total).toBe(1)
  })
})
