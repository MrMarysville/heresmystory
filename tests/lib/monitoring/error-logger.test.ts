/**
 * Unit Tests for Error Logger
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { errorLogger, setupGlobalErrorHandler } from '@/lib/monitoring/error-logger'

describe('Error Logger', () => {
  beforeEach(() => {
    errorLogger.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    errorLogger.stopAutoFlush()
  })

  it('should log errors with context', () => {
    const error = new Error('Test error')
    const context = { userId: 'user123', action: 'test_action' }

    errorLogger.log(error, 'medium', context)

    const logs = errorLogger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Test error')
    expect(logs[0].severity).toBe('medium')
    expect(logs[0].context.userId).toBe('user123')
    expect(logs[0].context.action).toBe('test_action')
  })

  it('should log string errors', () => {
    errorLogger.log('String error message', 'low')

    const logs = errorLogger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('String error message')
    expect(logs[0].stack).toBeUndefined()
  })

  it('should use severity helper methods', () => {
    errorLogger.info('Info message')
    errorLogger.warn('Warning message')
    errorLogger.error('Error message')
    errorLogger.critical('Critical message')

    const logs = errorLogger.getLogs()
    expect(logs).toHaveLength(4)
    expect(logs[0].severity).toBe('low')
    expect(logs[1].severity).toBe('medium')
    expect(logs[2].severity).toBe('high')
    expect(logs[3].severity).toBe('critical')
  })

  it('should batch logs and flush', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    global.fetch = mockFetch

    errorLogger.log('Error 1', 'low')
    errorLogger.log('Error 2', 'low')

    await errorLogger.flush()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(errorLogger.getLogs()).toHaveLength(0)
  })

  it('should limit stored logs to maxLogs', () => {
    // Log 110 errors (max is 100)
    for (let i = 0; i < 110; i++) {
      errorLogger.log(`Error ${i}`, 'low')
    }

    const logs = errorLogger.getLogs()
    expect(logs.length).toBeLessThanOrEqual(100)
  })

  it('should include timestamp and environment', () => {
    errorLogger.log('Test error', 'medium')

    const logs = errorLogger.getLogs()
    expect(logs[0].timestamp).toBeDefined()
    expect(logs[0].environment).toBeDefined()
  })

  it('should clear all logs', () => {
    errorLogger.log('Error 1', 'low')
    errorLogger.log('Error 2', 'low')
    expect(errorLogger.getLogs()).toHaveLength(2)

    errorLogger.clear()
    expect(errorLogger.getLogs()).toHaveLength(0)
  })
})
