/**
 * Single Session Detail API
 * GET /api/sessions/:id - Get detailed session information
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  // Verify authentication
  const { authorized, user } = await verifyAuth(request)
  const { id } = await params

  if (!authorized || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Fetch session with authorization check
    const session = await prisma.session.findFirst({
      where: {
        id,
        profile: {
          userId: user.id, // Ensure session belongs to user's profile
        },
      },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            colorTheme: true,
            relation: true,
            avatarUrl: true,
          },
        },
        assets: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Parse transcript if available
    let transcript = null
    if (session.transcriptJson) {
      try {
        transcript = JSON.parse(session.transcriptJson as string)
      } catch (e) {
        console.error('Error parsing transcript:', e)
      }
    }

    // Parse entities if available
    let entities = null
    if (session.entities) {
      try {
        entities = JSON.parse(session.entities as string)
      } catch (e) {
        console.error('Error parsing entities:', e)
      }
    }

    // Parse timeline if available
    let timeline = null
    if (session.timeline) {
      try {
        timeline = JSON.parse(session.timeline as string)
      } catch (e) {
        console.error('Error parsing timeline:', e)
      }
    }

    // Format response
    const formattedSession = {
      id: session.id,
      title: session.title || 'Untitled Recording',
      profile: session.profile,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration || 0,
      rawAudioUrl: session.rawAudioUrl,
      cleanAudioUrl: session.cleanAudioUrl,
      status: session.cleanAudioUrl ? 'ready' : 'processing',
      transcript,
      summary: session.summary,
      sentiment: session.sentiment,
      tags: session.tags || [],
      entities,
      timeline,
      assets: session.assets.map(asset => ({
        id: asset.id,
        type: asset.type,
        url: asset.url,
        filename: asset.filename,
        size: asset.size,
        mimeType: asset.mimeType,
        duration: asset.duration,
        createdAt: asset.createdAt,
      })),
    }

    return NextResponse.json(formattedSession)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
