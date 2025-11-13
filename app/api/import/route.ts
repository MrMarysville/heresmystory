/**
 * Import Upload API
 * POST /api/import - Upload audio files for import
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/uploads'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
]

export async function POST(request: NextRequest) {
  const { authorized, user } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const profileId = formData.get('profileId') as string
    const files = formData.getAll('files') as File[]

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PROFILE_ID', message: 'Profile ID is required' } },
        { status: 400 }
      )
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILES', message: 'At least one file is required' } },
        { status: 400 }
      )
    }

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

    // Validate files
    const validationErrors: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`File ${file.name} exceeds maximum size of 100MB`)
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`File ${file.name} has unsupported type ${file.type}`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationErrors.join(', '),
          },
        },
        { status: 400 }
      )
    }

    // Process each file
    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${randomUUID()}.${ext}`
      const filepath = join(UPLOAD_DIR, filename)

      // Save file to disk (in production, this would be cloud storage)
      await writeFile(filepath, buffer)

      // Create asset record
      const asset = await prisma.asset.create({
        data: {
          type: 'RAW_AUDIO',
          url: filepath, // In production: cloud storage URL
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          metadata: JSON.stringify({
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          }),
        },
      })

      // Create session stub
      const session = await prisma.session.create({
        data: {
          profileId,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          rawAudioUrl: filepath,
        },
      })

      // Link asset to session
      await prisma.asset.update({
        where: { id: asset.id },
        data: { sessionId: session.id },
      })

      // Create cleanup job
      const job = await prisma.job.create({
        data: {
          kind: 'CLEANUP_AUDIO',
          payload: JSON.stringify({
            sessionId: session.id,
            assetId: asset.id,
            profileId,
            filePath: filepath,
            originalFilename: file.name,
          }),
          status: 'PENDING',
        },
      })

      uploadedFiles.push({
        id: session.id,
        filename: file.name,
        size: file.size,
        jobId: job.id,
        status: 'pending',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        profileId,
        filesUploaded: uploadedFiles.length,
        files: uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      },
    })
  } catch (error) {
    console.error('Import upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload files',
        },
      },
      { status: 500 }
    )
  }
}
