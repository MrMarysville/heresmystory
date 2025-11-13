/**
 * Sessions List API
 * GET /api/sessions - List all sessions for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Verify authentication
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const profileId = searchParams.get('profileId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      profile: {
        userId: user.id, // Only user's sessions
      },
    }

    // Filter by profile if specified
    if (profileId) {
      where.profileId = profileId
    }

    // Filter by status
    if (status === 'ready') {
      where.cleanAudioUrl = { not: null }
    } else if (status === 'processing') {
      where.cleanAudioUrl = null
    }

    // Search across title, summary, and tags
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.session.count({ where })

    // Fetch sessions
    const sessions = await prisma.session.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            colorTheme: true,
            relation: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 100), // Max 100 per request
      skip: offset,
    })

    // Format response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title || 'Untitled Recording',
      profileId: session.profileId,
      profileName: session.profile.displayName,
      profileColor: session.profile.colorTheme,
      profileRelation: session.profile.relation,
      date: session.startedAt,
      duration: session.duration || 0,
      status: session.cleanAudioUrl ? 'ready' : 'processing',
      tags: session.tags || [],
      summary: session.summary || '',
      rawAudioUrl: session.rawAudioUrl,
      cleanAudioUrl: session.cleanAudioUrl,
      hasTranscript: !!session.transcriptJson,
    }))

    return NextResponse.json({
      sessions: formattedSessions,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
