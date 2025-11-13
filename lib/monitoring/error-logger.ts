/**
 * Error Logging System
 * Centralized error tracking and logging for production monitoring
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  profileId?: string
  action?: string
  component?: string
  url?: string
  userAgent?: string
  timestamp?: string
  [key: string]: any
}

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  severity: ErrorSeverity
  context: ErrorContext
  timestamp: string
  environment: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private maxLogs = 100
  private endpoint = '/api/monitoring/errors'
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null

  private constructor() {
    // Start auto-flush timer
    if (typeof window !== 'undefined') {
      this.startAutoFlush()

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log an error with context
   */
  log(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      severity,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, errorLog.message, errorLog)
    }

    // Add to batch
    this.logs.push(errorLog)

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Flush immediately for critical errors
    if (severity === 'critical') {
      this.flush()
    } else if (this.logs.length >= this.batchSize) {
      this.flush()
    }
  }

  /**
   * Log with specific severity levels
   */
  info(message: string, context?: ErrorContext): void {
    this.log(message, 'low', context)
  }

  warn(message: string, context?: ErrorContext): void {
    this.log(message, 'medium', context)
  }

  error(error: Error | string, context?: ErrorContext): void {
    this.log(error, 'high', context)
  }

  critical(error: Error | string, context?: ErrorContext): void {
    this.log(error, 'critical', context)
  }

  /**
   * Flush logs to server
   */
  async flush(): Promise<void> {
    if (this.logs.length === 0) return

    const logsToSend = [...this.logs]
    this.logs = []

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send error logs:', response.statusText)
        // Put logs back if failed (up to maxLogs)
        this.logs = [...logsToSend.slice(-this.maxLogs), ...this.logs]
      }
    } catch (err) {
      console.error('Error sending logs:', err)
      // Put logs back if failed
      this.logs = [...logsToSend.slice(-this.maxLogs), ...this.logs]
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
   * Generate unique ID for error
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current logs (for debugging)
   */
  getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = []
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance()

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.error(event.error || event.message, {
      component: 'Global Error Handler',
      action: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error(
      event.reason instanceof Error ? event.reason : String(event.reason),
      {
        component: 'Global Error Handler',
        action: 'unhandled_rejection',
      }
    )
  })
}

/**
 * HOC for error boundary logging
 */
export function logComponentError(
  error: Error,
  errorInfo: { componentStack: string },
  componentName: string
): void {
  errorLogger.error(error, {
    component: componentName,
    action: 'component_error',
    componentStack: errorInfo.componentStack,
  })
}

/**
 * Wrapper for async functions with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      errorLogger.error(error as Error, {
        ...context,
        action: fn.name || 'anonymous_function',
      })
      throw error
    }
  }) as T
}

/**
 * Log API errors
 */
export function logAPIError(
  endpoint: string,
  method: string,
  status: number,
  error: any,
  context?: ErrorContext
): void {
  errorLogger.error(
    error instanceof Error ? error : new Error(JSON.stringify(error)),
    {
      ...context,
      action: 'api_error',
      endpoint,
      method,
      status,
    }
  )
}
