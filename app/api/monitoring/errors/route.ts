/**
 * Error Logging API
 * POST /api/monitoring/errors - Receive error logs from client
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import type { ErrorLog } from '@/lib/monitoring/error-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logs } = body as { logs: ErrorLog[] }

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_LOGS', message: 'Logs must be a non-empty array' } },
        { status: 400 }
      )
    }

    // Optional: Verify auth (errors can be logged without auth for signup/login errors)
    const { user } = await verifyAuth(request)
    const userId = user?.id

    // Store errors in database (batch insert)
    const errorRecords = logs.map((log) => ({
      userId: userId || log.context.userId || null,
      message: log.message,
      stack: log.stack || null,
      severity: log.severity,
      context: JSON.stringify(log.context),
      timestamp: new Date(log.timestamp),
      environment: log.environment,
    }))

    await prisma.errorLog.createMany({
      data: errorRecords,
      skipDuplicates: true,
    })

    // In production, you might also want to send to external service
    // (Sentry, DataDog, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Send to Sentry or other service
      // await sendToSentry(logs)
    }

    return NextResponse.json({
      success: true,
      data: {
        received: logs.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error logging endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LOGGING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to log errors',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/monitoring/errors - Retrieve error logs (admin only)
 */
export async function GET(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: user.id, // Only show user's own errors
    }

    if (severity) {
      where.severity = severity
    }

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.errorLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        errors: errors.map((error) => ({
          id: error.id,
          message: error.message,
          stack: error.stack,
          severity: error.severity,
          context: error.context,
          timestamp: error.timestamp,
          environment: error.environment,
        })),
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch error logs',
        },
      },
      { status: 500 }
    )
  }
}
