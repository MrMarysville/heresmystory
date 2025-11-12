/**
 * API Route: Start Session
 * POST /api/sessions/start
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/helpers';
import { createGeminiLiveClient } from '@/lib/ai/gemini-live';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  // Verify authentication
  const { authorized, user } = await verifyAuth(request);

  if (!authorized || !user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiResponse,
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PROFILE_ID',
            message: 'Profile ID is required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Verify profile exists and belongs to authenticated user
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: user.id,
      },
      include: { user: true },
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

    // Create new session
    const session = await prisma.session.create({
      data: {
        profileId,
        startedAt: new Date(),
      },
    });

    // Initialize conversation
    const gemini = createGeminiLiveClient();
    const greeting = await gemini.startConversation(profileId);

    // Return session info
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        profileId: profile.id,
        displayName: profile.displayName,
        greeting: greeting.content,
        startedAt: session.startedAt,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Start session error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start session',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
