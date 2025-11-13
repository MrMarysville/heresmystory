/**
 * Accessibility Settings API
 * GET /api/settings/accessibility - Get user's accessibility preferences
 * PUT /api/settings/accessibility - Update accessibility preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

export interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'x-large'
  highContrast: boolean
  slowMode: boolean
  reducedMotion: boolean
  keyboardNav: boolean
  screenReader: boolean
  focusIndicators: boolean
  buttonLabels: boolean
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'normal',
  highContrast: false,
  slowMode: false,
  reducedMotion: false,
  keyboardNav: true,
  screenReader: false,
  focusIndicators: true,
  buttonLabels: true,
}

export async function GET(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get user's accessibility settings
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { accessibilitySettings: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse settings or return defaults
    let settings = DEFAULT_SETTINGS
    if (dbUser.accessibilitySettings) {
      try {
        settings = {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(dbUser.accessibilitySettings as string),
        }
      } catch (e) {
        console.error('Error parsing accessibility settings:', e)
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching accessibility settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()

    // Validate settings
    const settings: AccessibilitySettings = {
      textSize: ['normal', 'large', 'x-large'].includes(body.textSize)
        ? body.textSize
        : 'normal',
      highContrast: !!body.highContrast,
      slowMode: !!body.slowMode,
      reducedMotion: !!body.reducedMotion,
      keyboardNav: !!body.keyboardNav,
      screenReader: !!body.screenReader,
      focusIndicators: !!body.focusIndicators,
      buttonLabels: !!body.buttonLabels,
    }

    // Update user settings
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        accessibilitySettings: JSON.stringify(settings),
      },
      select: { accessibilitySettings: true },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating accessibility settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
