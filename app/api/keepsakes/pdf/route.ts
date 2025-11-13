/**
 * PDF Album Generation API
 * POST /api/keepsakes/pdf - Generate PDF album from session
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import { PDFAlbumGenerator } from '@/lib/pdf/album-generator'

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

    // Generate PDF
    const generator = new PDFAlbumGenerator(session.profile.colorTheme)

    const sessionData = {
      id: session.id,
      title: session.title || 'Untitled Story',
      profileName: session.profile.displayName,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() || null,
      duration: session.duration,
      summary: session.summary,
      tags: session.tags,
      transcriptJson: session.transcriptJson,
      entities: session.entities,
      timeline: session.timeline,
    }

    const pdfBytes = await generator.generate(sessionData, options)

    // Create asset record
    const filename = `${session.title?.replace(/[^a-z0-9]/gi, '_') || 'story'}_album.pdf`

    await prisma.asset.create({
      data: {
        sessionId: session.id,
        type: 'PDF',
        url: `/generated/${filename}`, // In production: cloud storage URL
        filename,
        size: pdfBytes.byteLength,
        mimeType: 'application/pdf',
        metadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          options,
        }),
      },
    })

    // Return PDF as downloadable response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate PDF',
        },
      },
      { status: 500 }
    )
  }
}
