/**
 * Analytics Tracking API
 * POST /api/analytics/track - Receive analytics events from client
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { EventName, EventProperties } from '@/lib/analytics/tracker'

interface AnalyticsEvent {
  event: EventName
  properties: EventProperties
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body as { events: AnalyticsEvent[] }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EVENTS', message: 'Events must be a non-empty array' } },
        { status: 400 }
      )
    }

    // Store events in database (batch insert)
    const eventRecords = events.map((event) => ({
      name: event.event,
      properties: event.properties as any, // JSON type
      timestamp: new Date(event.timestamp),
      userId: (event.properties.userId as string) || null,
      sessionId: (event.properties.sessionId as string) || null,
    }))

    await prisma.analyticsEvent.createMany({
      data: eventRecords,
      skipDuplicates: true,
    })

    // In production, you might also want to send to external service
    // (Plausible, Fathom, Google Analytics, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external analytics service
      // await sendToExternalService(events)
    }

    return NextResponse.json({
      success: true,
      data: {
        received: events.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRACKING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to track events',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analytics/track - Retrieve analytics data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventName = searchParams.get('event')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (eventName) {
      where.name = eventName
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.analyticsEvent.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        events: events.map((event) => ({
          id: event.id,
          name: event.name,
          properties: event.properties,
          timestamp: event.timestamp,
          userId: event.userId,
          sessionId: event.sessionId,
        })),
        total,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch analytics',
        },
      },
      { status: 500 }
    )
  }
}
