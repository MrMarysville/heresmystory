/**
 * API Route: Upload Session Audio
 * POST /api/sessions/[id]/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/client';
import { Storage } from '@google-cloud/storage';
import { ApiResponse } from '@/types';

const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'heresmystory-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const chunkIndex = formData.get('chunkIndex') as string;
    const totalChunks = formData.get('totalChunks') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Audio file is required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to GCS
    const filename = chunkIndex
      ? `raw-audio/${sessionId}/chunk_${chunkIndex}.webm`
      : `raw-audio/${sessionId}/audio.webm`;

    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(filename);

    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type || 'audio/webm',
      },
    });

    // Generate public URL
    const audioUrl = `gs://${bucketName}/${filename}`;

    // Update session with audio URL (if final chunk)
    if (!chunkIndex || parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          rawAudioUrl: audioUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        audioUrl,
        filename,
        size: buffer.length,
        chunkIndex: chunkIndex ? parseInt(chunkIndex) : 0,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Upload audio error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Failed to upload audio',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
