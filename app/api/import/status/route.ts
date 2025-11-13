/**
 * Import Status API
 * GET /api/import/status?sessionId=xxx - Get import job status for a session
 * GET /api/import/status?profileId=xxx - Get all import jobs for a profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

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
    const sessionId = searchParams.get('sessionId')
    const profileId = searchParams.get('profileId')

    if (!sessionId && !profileId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_PARAMETER', message: 'sessionId or profileId is required' },
        },
        { status: 400 }
      )
    }

    if (sessionId) {
      // Get status for specific session
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
              id: true,
              displayName: true,
            },
          },
          assets: {
            select: {
              id: true,
              type: true,
              url: true,
              filename: true,
              size: true,
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

      // Get associated jobs
      const jobs = await prisma.job.findMany({
        where: {
          payload: {
            path: '$.sessionId',
            equals: sessionId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Calculate overall progress
      const totalJobs = jobs.length || 1
      const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length
      const failedJobs = jobs.filter((j) => j.status === 'FAILED').length
      const progress = Math.round((completedJobs / totalJobs) * 100)

      let overallStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending'
      if (failedJobs > 0) {
        overallStatus = 'failed'
      } else if (completedJobs === totalJobs) {
        overallStatus = 'completed'
      } else if (completedJobs > 0 || jobs.some((j) => j.status === 'PROCESSING')) {
        overallStatus = 'processing'
      }

      // Get current processing step
      let currentStep = 'Initializing...'
      const processingJob = jobs.find((j) => j.status === 'PROCESSING')
      if (processingJob) {
        switch (processingJob.kind) {
          case 'CLEANUP_AUDIO':
            currentStep = 'Cleaning audio...'
            break
          case 'ASR_DIARIZE':
            currentStep = 'Transcribing audio...'
            break
          case 'NLP_ENRICH':
            currentStep = 'Analyzing content...'
            break
          default:
            currentStep = 'Processing...'
        }
      } else if (overallStatus === 'completed') {
        currentStep = 'Import complete!'
      } else if (overallStatus === 'failed') {
        currentStep = 'Import failed'
      }

      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          profileId: session.profileId,
          profileName: session.profile.displayName,
          title: session.title,
          status: overallStatus,
          progress,
          currentStep,
          jobs: jobs.map((job) => ({
            id: job.id,
            kind: job.kind,
            status: job.status,
            error: job.lastError,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          })),
          assets: session.assets,
          hasTranscript: !!session.transcriptJson,
          hasSummary: !!session.summary,
        },
      })
    }

    if (profileId) {
      // Verify profile belongs to user
      const profile = await prisma.profile.findFirst({
        where: {
          id: profileId,
          userId: user.id,
        },
      })

      if (!profile) {
        return NextResponse.json(
          { success: false, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } },
          { status: 404 }
        )
      }

      // Get all import sessions (sessions created in last 24 hours without endedAt)
      const recentSessions = await prisma.session.findMany({
        where: {
          profileId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          assets: {
            select: {
              id: true,
              type: true,
              filename: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const sessionsWithStatus = []

      for (const session of recentSessions) {
        const jobs = await prisma.job.findMany({
          where: {
            payload: {
              path: '$.sessionId',
              equals: session.id,
            },
          },
        })

        const totalJobs = jobs.length || 1
        const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length
        const failedJobs = jobs.filter((j) => j.status === 'FAILED').length
        const progress = Math.round((completedJobs / totalJobs) * 100)

        let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending'
        if (failedJobs > 0) {
          status = 'failed'
        } else if (completedJobs === totalJobs) {
          status = 'completed'
        } else if (completedJobs > 0 || jobs.some((j) => j.status === 'PROCESSING')) {
          status = 'processing'
        }

        sessionsWithStatus.push({
          id: session.id,
          title: session.title,
          status,
          progress,
          createdAt: session.createdAt,
          assetsCount: session.assets.length,
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          profileId,
          sessions: sessionsWithStatus,
          totalImports: sessionsWithStatus.length,
          pendingImports: sessionsWithStatus.filter((s) => s.status === 'pending').length,
          processingImports: sessionsWithStatus.filter((s) => s.status === 'processing').length,
          completedImports: sessionsWithStatus.filter((s) => s.status === 'completed').length,
          failedImports: sessionsWithStatus.filter((s) => s.status === 'failed').length,
        },
      })
    }
  } catch (error) {
    console.error('Import status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get import status',
        },
      },
      { status: 500 }
    )
  }
}
