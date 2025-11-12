/**
 * API Route: Train Voice Model
 * POST /api/voice/train
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/client';
import { getJobQueue } from '@/lib/jobs/queue';
import { JobKind, VoiceProvider } from '@prisma/client';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, samples, provider = VoiceProvider.GOOGLE_CUSTOM_VOICE } = body;

    if (!profileId || !samples || !Array.isArray(samples)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Profile ID and samples are required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Verify profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profile not found',
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check for active consent
    const consent = await prisma.consent.findFirst({
      where: {
        profileId,
        type: 'VOICE_TRAINING',
        status: 'ACTIVE',
      },
      orderBy: {
        signedAt: 'desc',
      },
    });

    if (!consent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONSENT_REQUIRED',
            message: 'Voice training consent is required',
          },
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Calculate total duration
    const totalDuration = samples.reduce((sum: number, s: any) => sum + s.duration, 0);

    // Create voice model record
    const voiceModel = await prisma.voiceModel.create({
      data: {
        profileId,
        provider,
        status: 'PENDING',
        samplesCount: samples.length,
        durationMins: totalDuration / 60,
      },
    });

    // Queue training job
    const jobQueue = getJobQueue();
    const job = await jobQueue.enqueue(JobKind.TRAIN_VOICE_MODEL, {
      voiceModelId: voiceModel.id,
      profileId,
      samples,
      provider,
    });

    return NextResponse.json({
      success: true,
      data: {
        voiceModelId: voiceModel.id,
        jobId: job.id,
        status: 'pending',
        samplesCount: samples.length,
        durationMinutes: Math.round(totalDuration / 60),
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Train voice error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TRAINING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start training',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
