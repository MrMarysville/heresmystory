/**
 * Profile Consent API
 * GET /api/profiles/:id/consent - Get consent record for profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/helpers'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id: profileId } = await params

    // Verify profile belongs to user
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: user.id,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get consent record
    const consent = await prisma.consent.findFirst({
      where: {
        profileId,
        type: 'VOICE_TRAINING',
      },
      orderBy: {
        signedAt: 'desc',
      },
    })

    if (!consent) {
      return NextResponse.json(null)
    }

    // Return consent details
    return NextResponse.json({
      id: consent.id,
      consentType: consent.type,
      version: consent.textVersion,
      grantedAt: consent.signedAt.toISOString(),
      revokedAt: consent.revokedAt?.toISOString() || null,
      ipAddress: consent.ipAddress || '',
      userAgent: consent.userAgent || '',
    })
  } catch (error) {
    console.error('Error fetching consent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent' },
      { status: 500 }
    )
  }
}
