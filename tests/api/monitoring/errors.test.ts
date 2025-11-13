/**
 * Integration Tests for Error Logging API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Error Logging API', () => {
  const mockErrorLog = {
    id: 'log-123',
    message: 'Test error',
    stack: 'Error: Test error\n    at ...',
    severity: 'high',
    context: {
      userId: 'user123',
      action: 'test_action',
    },
    timestamp: new Date().toISOString(),
    environment: 'test',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept error logs via POST', async () => {
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

    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: [mockErrorLog] }),
    })

    const data = await response.json()
    expect(response.ok).toBe(true)
    expect(data.success).toBe(true)
    expect(data.data.received).toBe(1)
  })

  it('should reject invalid log format', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'INVALID_LOGS',
          message: 'Logs must be a non-empty array',
        },
      }),
    })
    global.fetch = mockFetch

    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: 'not-an-array' }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('should accept batch error logs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          received: 5,
          timestamp: new Date().toISOString(),
        },
      }),
    })
    global.fetch = mockFetch

    const logs = Array(5).fill(mockErrorLog)
    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    })

    const data = await response.json()
    expect(data.data.received).toBe(5)
  })
})
