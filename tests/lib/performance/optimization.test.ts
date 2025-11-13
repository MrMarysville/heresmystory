/**
 * Unit Tests for Performance Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cache, debounce, throttle, hasSlowConnection, prefersReducedData } from '@/lib/performance/optimization'

describe('Performance Cache', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('should set and get cached values', () => {
    cache.set('test-key', { data: 'test' }, 1000)
    const value = cache.get('test-key')
    expect(value).toEqual({ data: 'test' })
  })

  it('should return null for non-existent keys', () => {
    const value = cache.get('non-existent')
    expect(value).toBeNull()
  })

  it('should expire values after TTL', async () => {
    cache.set('test-key', 'value', 10) // 10ms TTL
    expect(cache.get('test-key')).toBe('value')

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(cache.get('test-key')).toBeNull()
  })

  it('should check if key exists', () => {
    cache.set('test-key', 'value')
    expect(cache.has('test-key')).toBe(true)
    expect(cache.has('non-existent')).toBe(false)
  })

  it('should delete values', () => {
    cache.set('test-key', 'value')
    expect(cache.has('test-key')).toBe(true)
    cache.delete('test-key')
    expect(cache.has('test-key')).toBe(false)
  })

  it('should clear all values', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    expect(cache.size()).toBe(2)
    cache.clear()
    expect(cache.size()).toBe(0)
  })
})

describe('Debounce', () => {
  it('should debounce function calls', async () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 50)

    debouncedFn('call1')
    debouncedFn('call2')
    debouncedFn('call3')

    expect(mockFn).not.toHaveBeenCalled()

    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('call3')
  })
})

describe('Throttle', () => {
  it('should throttle function calls', async () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 50)

    throttledFn('call1')
    throttledFn('call2')
    throttledFn('call3')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('call1')

    await new Promise((resolve) => setTimeout(resolve, 60))
    throttledFn('call4')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenCalledWith('call4')
  })
})

describe('Network Condition Detection', () => {
  it('should detect slow connection', () => {
    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: { effectiveType: '2g' },
    })

    expect(hasSlowConnection()).toBe(true)
  })

  it('should detect data saver mode', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: { saveData: true },
    })

    expect(prefersReducedData()).toBe(true)
  })

  it('should return false when connection API unavailable', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: undefined,
    })

    expect(hasSlowConnection()).toBe(false)
    expect(prefersReducedData()).toBe(false)
  })
})
