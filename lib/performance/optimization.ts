/**
 * Performance Optimization Utilities
 * Helpers for lazy loading, caching, and performance improvements
 */

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Simple in-memory cache with TTL
 */
class Cache {
  private cache = new Map<string, { value: any; expires: number }>()

  set(key: string, value: any, ttl: number = 5 * 60 * 1000): void {
    const expires = Date.now() + ttl
    this.cache.set(key, { value, expires })
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)

    if (!item) return false

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    // Clean expired items first
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expires) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }
}

// Singleton cache instance
export const cache = new Cache()

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * React hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [ref, options])

  return isIntersecting
}

/**
 * React hook for cached API calls
 */
export function useCachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl: number = 5 * 60 * 1000
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    const cacheKey = `fetch:${url}`

    // Check cache first
    if (cache.has(cacheKey)) {
      setData(cache.get<T>(cacheKey))
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Store in cache
      cache.set(cacheKey, result, ttl)

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [url, options, ttl])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

/**
 * React hook for idle callback
 */
export function useIdleCallback(callback: () => void, deps: React.DependencyList = []): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let handle: number

    if ('requestIdleCallback' in window) {
      handle = window.requestIdleCallback(callback)
    } else {
      // Fallback for browsers without requestIdleCallback
      handle = setTimeout(callback, 1) as unknown as number
    }

    return () => {
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(handle)
      } else {
        clearTimeout(handle)
      }
    }
  }, deps)
}

/**
 * Preload image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage))
}

/**
 * React hook for lazy image loading
 */
export function useLazyImage(src: string): string | null {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>()

  useEffect(() => {
    const img = new Image()
    imgRef.current = img

    img.onload = () => {
      setImageSrc(src)
    }

    img.src = src

    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null
      }
    }
  }, [src])

  return imageSrc
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string): void {
  if (typeof window === 'undefined' || !window.performance) return

  const startMark = `${componentName}-start`
  const endMark = `${componentName}-end`
  const measureName = `${componentName}-render`

  performance.mark(startMark)

  // Use requestAnimationFrame to measure after paint
  requestAnimationFrame(() => {
    performance.mark(endMark)
    performance.measure(measureName, startMark, endMark)

    const measure = performance.getEntriesByName(measureName)[0]

    if (measure && process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} render time: ${measure.duration.toFixed(2)}ms`)
    }

    // Clean up
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  })
}

/**
 * React hook for measuring component performance
 */
export function usePerformanceMonitor(componentName: string): void {
  useEffect(() => {
    measureRenderTime(componentName)
  })
}

/**
 * Batch multiple state updates
 */
export function batchUpdates(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    requestAnimationFrame(callback)
  } else {
    callback()
  }
}

/**
 * Check if user has slow connection
 */
export function hasSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false
  }

  const connection = (navigator as any).connection
  const effectiveType = connection?.effectiveType

  return effectiveType === 'slow-2g' || effectiveType === '2g'
}

/**
 * Check if user prefers reduced data
 */
export function prefersReducedData(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false
  }

  const connection = (navigator as any).connection
  return connection?.saveData === true
}

/**
 * Get optimal image quality based on connection
 */
export function getOptimalImageQuality(): 'low' | 'medium' | 'high' {
  if (prefersReducedData() || hasSlowConnection()) {
    return 'low'
  }

  const connection = (navigator as any)?.connection
  const effectiveType = connection?.effectiveType

  if (effectiveType === '4g') {
    return 'high'
  }

  return 'medium'
}
