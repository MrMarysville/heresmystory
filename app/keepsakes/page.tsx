/**
 * Keepsakes Page
 * Manage and generate PDF albums and video highlights
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/client-utils'
import { GeneratePDFButton } from '@/components/keepsakes/GeneratePDFButton'

interface Session {
  id: string
  title: string | null
  profileName: string
  profileId: string
  startedAt: string
  duration: number | null
  summary: string | null
  hasTranscript: boolean
  hasAssets: boolean
}

interface Asset {
  id: string
  type: string
  filename: string | null
  url: string
  createdAt: string
  sessionTitle: string | null
}

export default function KeepsakesPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const { user, error: authError } = await getCurrentUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      await Promise.all([loadSessions(), loadAssets()])
    }

    loadData()
  }, [router])

  const loadSessions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Failed to load sessions')

      const data = await response.json()
      setSessions(
        data.sessions.map((s: any) => ({
          id: s.id,
          title: s.title,
          profileName: s.profileName,
          profileId: s.profileId,
          startedAt: s.startedAt,
          duration: s.duration,
          summary: s.summary,
          hasTranscript: !!s.hasTranscript,
          hasAssets: s.assets && s.assets.length > 0,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssets = async () => {
    try {
      // In a real implementation, we'd have an API endpoint to fetch keepsake assets
      // For now, we'll show a placeholder
      setAssets([])
    } catch (err) {
      console.error('Failed to load assets:', err)
    }
  }

  const handleGenerateVideo = async (sessionId: string) => {
    setGeneratingVideo(sessionId)

    try {
      const response = await fetch('/api/keepsakes/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          options: {
            maxDuration: 60,
            aspectRatio: '16:9',
            includeAudio: true,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to generate video')
      }

      alert('Video generation started! This may take a few minutes. Check back later.')
      await loadAssets()
    } catch (err) {
      console.error('Video generation error:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate video')
    } finally {
      setGeneratingVideo(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading keepsakes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Keepsakes</h1>
          <p className="text-lg text-gray-600">
            Create beautiful PDFs and video highlights from your family's stories
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">PDF Albums</h3>
                <p className="text-sm text-gray-600">
                  Generate beautiful PDF albums with full transcripts, timelines, and key moments. Perfect for printing and sharing.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Video Highlights</h3>
                <p className="text-sm text-gray-600">
                  Create short video highlights (30-60 seconds) perfect for sharing on social media or family group chats.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Generate Keepsakes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a story to create PDF albums or video highlights
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stories Yet</h3>
              <p className="text-gray-600 mb-6">Record some stories first to create keepsakes</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Recording
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {session.title || 'Untitled Story'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {session.profileName} • {new Date(session.startedAt).toLocaleDateString()}
                        {session.duration && ` • ${Math.floor(session.duration / 60)}:${(session.duration % 60).toString().padStart(2, '0')}`}
                      </p>
                      {session.summary && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{session.summary}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        {session.hasTranscript && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Transcribed</span>
                        )}
                        {session.hasAssets && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Has Audio</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <GeneratePDFButton
                        sessionId={session.id}
                        sessionTitle={session.title || 'Story'}
                        variant="secondary"
                        size="sm"
                      />
                      <button
                        onClick={() => handleGenerateVideo(session.id)}
                        disabled={generatingVideo === session.id}
                        className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {generatingVideo === session.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            <span>Generate Video</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Assets */}
        {assets.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Your Keepsakes</h2>
              <p className="text-sm text-gray-600 mt-1">Previously generated PDFs and videos</p>
            </div>

            <div className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        asset.type === 'PDF' ? 'bg-indigo-100' : 'bg-purple-100'
                      }`}
                    >
                      {asset.type === 'PDF' ? (
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{asset.filename}</h4>
                      <p className="text-sm text-gray-600">
                        {asset.sessionTitle} • {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={asset.url}
                    download
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
