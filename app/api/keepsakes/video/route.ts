/**
 * Video Highlights Generation API
 * POST /api/keepsakes/video - Generate video highlights spec from session
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import { VideoHighlightsGenerator } from '@/lib/video/highlights-generator'

export async function POST(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { sessionId, options } = body

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_SESSION_ID', message: 'Session ID is required' } },
        { status: 400 }
      )
    }

    // Fetch session with all data
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        profile: {
          userId: user.id,
        },
      },
      include: {
        profile: {
          select: {
            displayName: true,
            colorTheme: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      )
    }

    // Generate video spec
    const generator = new VideoHighlightsGenerator()

    const sessionData = {
      id: session.id,
      title: session.title || 'Untitled Story',
      profileName: session.profile.displayName,
      profileAvatar: session.profile.avatarUrl || undefined,
      colorTheme: session.profile.colorTheme,
      summary: session.summary,
      transcriptJson: session.transcriptJson,
      entities: session.entities,
      tags: session.tags,
      duration: session.duration,
      audioUrl: session.cleanAudioUrl || session.rawAudioUrl,
    }

    const videoSpec = await generator.generateSpec(sessionData, options)

    // Create a job to render the video
    const job = await prisma.job.create({
      data: {
        kind: 'RENDER_VIDEO',
        payload: JSON.stringify({
          sessionId: session.id,
          videoSpec,
          userId: user.id,
        }),
        status: 'PENDING',
      },
    })

    // Create placeholder asset
    const asset = await prisma.asset.create({
      data: {
        sessionId: session.id,
        type: 'VIDEO',
        url: `/pending/${job.id}`, // Placeholder until video is rendered
        filename: `${session.title?.replace(/[^a-z0-9]/gi, '_') || 'story'}_highlights.mp4`,
        mimeType: 'video/mp4',
        metadata: JSON.stringify({
          jobId: job.id,
          status: 'pending',
          createdAt: new Date().toISOString(),
          spec: videoSpec,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        assetId: asset.id,
        spec: videoSpec,
        status: 'pending',
        message: 'Video generation started. This may take a few minutes.',
      },
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate video',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/keepsakes/video?jobId=xxx - Check video generation status
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
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_JOB_ID', message: 'Job ID is required' } },
        { status: 400 }
      )
    }

    // Fetch job status
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } },
        { status: 404 }
      )
    }

    // Find associated asset
    const asset = await prisma.asset.findFirst({
      where: {
        metadata: {
          path: '$.jobId',
          equals: jobId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status.toLowerCase(),
        progress: job.result ? 100 : job.status === 'PROCESSING' ? 50 : 0,
        error: job.lastError,
        assetId: asset?.id,
        videoUrl: job.status === 'COMPLETED' && asset ? asset.url : null,
      },
    })
  } catch (error) {
    console.error('Video status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get video status',
        },
      },
      { status: 500 }
    )
  }
}
