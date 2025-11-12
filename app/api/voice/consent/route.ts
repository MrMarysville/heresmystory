/**
 * API Route: Voice Training Consent
 * POST /api/voice/consent
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/client';
import { ConsentType } from '@prisma/client';
import { ApiResponse } from '@/types';

const CONSENT_VERSION = '1.0.0';
const CONSENT_TEXT = `
Voice Training Consent

By providing this consent, you agree to:

1. Purpose: Your voice recordings will be used to create a synthetic voice model that can speak in your voice.

2. Data Usage:
   - Your audio recordings will be processed and stored securely
   - The resulting voice model will be used exclusively for retelling your stories to family members
   - Your voice data will never be shared with third parties without explicit additional consent
   - Your voice model will not be used for commercial purposes

3. Storage & Security:
   - Audio samples are encrypted at rest and in transit
   - Voice models are stored securely in isolated cloud infrastructure
   - Access to your voice model is restricted to authorized family members only

4. Your Rights:
   - You can revoke this consent at any time
   - Upon revocation, your voice model will be permanently deleted within 30 days
   - You can request a copy of all your voice data at any time
   - You can review and approve any synthesized speech before it is shared

5. Quality & Accuracy:
   - We will use 15-40 minutes of your voice recordings to create the model
   - The quality of the synthetic voice depends on the quality and variety of your recordings
   - The model may not perfectly replicate your voice in all situations

6. Watermarking:
   - All synthesized speech will include an inaudible watermark
   - An optional audible disclosure can be enabled for playback

By clicking "I Agree," you acknowledge that you have read, understood, and agree to these terms.

Version: ${CONSENT_VERSION}
Last Updated: ${new Date().toISOString().split('T')[0]}
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, agreed, ipAddress, userAgent } = body;

    if (!profileId || agreed !== true) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Profile ID and agreement are required',
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

    // Check if already consented
    const existingConsent = await prisma.consent.findFirst({
      where: {
        profileId,
        type: ConsentType.VOICE_TRAINING,
        status: 'ACTIVE',
      },
    });

    if (existingConsent) {
      return NextResponse.json({
        success: true,
        data: {
          consentId: existingConsent.id,
          alreadyConsented: true,
          signedAt: existingConsent.signedAt,
        },
      } as ApiResponse);
    }

    // Create consent record
    const consent = await prisma.consent.create({
      data: {
        profileId,
        type: ConsentType.VOICE_TRAINING,
        textVersion: CONSENT_VERSION,
        consentText: CONSENT_TEXT,
        status: 'ACTIVE',
        ipAddress: ipAddress || request.headers.get('x-forwarded-for') || undefined,
        userAgent: userAgent || request.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        consentId: consent.id,
        signedAt: consent.signedAt,
        version: CONSENT_VERSION,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Consent error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONSENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to record consent',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

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

    // Get consent status
    const consent = await prisma.consent.findFirst({
      where: {
        profileId,
        type: ConsentType.VOICE_TRAINING,
        status: 'ACTIVE',
      },
      orderBy: {
        signedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        hasConsent: !!consent,
        consent: consent
          ? {
              id: consent.id,
              signedAt: consent.signedAt,
              version: consent.textVersion,
            }
          : null,
        consentText: CONSENT_TEXT,
        version: CONSENT_VERSION,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Get consent error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get consent',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

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

    // Revoke all active voice training consents
    await prisma.consent.updateMany({
      where: {
        profileId,
        type: ConsentType.VOICE_TRAINING,
        status: 'ACTIVE',
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    // Mark voice models for deletion
    await prisma.voiceModel.updateMany({
      where: {
        profileId,
      },
      data: {
        status: 'FAILED', // Mark as failed to prevent usage
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Consent revoked successfully',
        revokedAt: new Date(),
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Revoke consent error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REVOKE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to revoke consent',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
