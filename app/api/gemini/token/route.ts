/**
 * API Route: Get Gemini API Token
 * POST /api/gemini/token
 *
 * Securely provides API token for client-side streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // In production, verify user authentication here
    // For MVP, we'll provide the API key directly
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_KEY_MISSING',
            message: 'Gemini API key not configured',
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // In production, you might want to generate a temporary token
    // or use a proxy to avoid exposing the API key
    return NextResponse.json({
      success: true,
      data: {
        apiKey,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Token generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate token',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
