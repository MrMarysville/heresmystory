/**
 * Profile Detail API Route
 * Handle operations on individual profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

/**
 * GET /api/profiles/:id
 * Get a single profile by ID
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { authorized, user } = await verifyAuth(request)
  const { id } = await params

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      voiceModels: true,
      sessions: {
        take: 10,
        orderBy: { startedAt: 'desc' },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}

/**
 * PATCH /api/profiles/:id
 * Update a profile
 */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { authorized, user } = await verifyAuth(request)
  const { id } = await params

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify ownership
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { displayName, relation, avatarUrl, colorTheme } = body

    const updatedProfile = await prisma.profile.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(relation !== undefined && { relation }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(colorTheme && { colorTheme }),
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

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profiles/:id
 * Delete a profile
 */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { authorized, user } = await verifyAuth(request)
  const { id } = await params

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify ownership
    const existingProfile = await prisma.profile.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await prisma.profile.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
