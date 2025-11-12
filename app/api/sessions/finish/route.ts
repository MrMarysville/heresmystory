/**
 * API Route: Finish Session
 * POST /api/sessions/finish
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/client';
import { getJobQueue } from '@/lib/jobs/queue';
import { JobKind } from '@prisma/client';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, audioUrl } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SESSION_ID',
            message: 'Session ID is required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { profile: true },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Update session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        rawAudioUrl: audioUrl,
      },
    });

    // Queue background jobs if audio is provided
    if (audioUrl) {
      const jobQueue = getJobQueue();

      // 1. Cleanup audio
      const cleanupJob = await jobQueue.enqueue(JobKind.CLEANUP_AUDIO, {
        sessionId,
        audioUrl,
        options: {
          denoise: true,
          dereverb: true,
          deHum: true,
          deClick: true,
          normalize: true,
          targetLUFS: -16,
          sampleRate: 48000,
        },
      });

      // 2. Transcribe and diarize (depends on cleanup)
      const transcribeJob = await jobQueue.enqueue(JobKind.ASR_DIARIZE, {
        sessionId,
        audioUrl, // Will use cleaned audio URL from cleanup job
      });

      // 3. NLP enrichment (depends on transcription)
      const enrichJob = await jobQueue.enqueue(JobKind.NLP_ENRICH, {
        sessionId,
      });

      return NextResponse.json({
        success: true,
        data: {
          sessionId,
          status: 'processing',
          jobs: {
            cleanup: cleanupJob.id,
            transcribe: transcribeJob.id,
            enrich: enrichJob.id,
          },
        },
      } as ApiResponse);
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status: 'completed',
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Finish session error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to finish session',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
