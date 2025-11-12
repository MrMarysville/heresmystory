/**
 * Profiles API Route
 * Handle CRUD operations for user profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/profiles
 * Get all profiles for authenticated user
 */
export async function GET(request: NextRequest) {
  const { authorized, user, dbUser } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    include: {
      voiceModels: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(profiles)
}

/**
 * POST /api/profiles
 * Create a new profile
 */
export async function POST(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { displayName, relation, avatarUrl, colorTheme } = body

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        displayName,
        relation: relation || null,
        avatarUrl: avatarUrl || null,
        colorTheme: colorTheme || '#6366f1',
      },
      include: {
        voiceModels: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    })

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    )
  }
}
