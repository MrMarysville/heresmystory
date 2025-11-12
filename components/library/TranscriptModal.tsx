/**
 * Transcript Viewer Modal
 * Display and search session transcripts
 */

'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

interface TranscriptSegment {
  text: string
  start?: number
  end?: number
  speaker?: string
}

interface Session {
  id: string
  title: string
  transcript: {
    segments?: TranscriptSegment[]
  } | null
  summary?: string
}

interface TranscriptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
}

export function TranscriptModal({ open, onOpenChange, session }: TranscriptModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Parse transcript segments
  const segments = useMemo(() => {
    if (!session.transcript?.segments) return []
    return session.transcript.segments
  }, [session.transcript])

  // Filter segments by search query
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments

    const query = searchQuery.toLowerCase()
    return segments.filter(segment =>
      segment.text.toLowerCase().includes(query)
    )
  }, [segments, searchQuery])

  // Get full transcript text
  const fullTranscriptText = useMemo(() => {
    if (segments.length === 0) {
      return session.summary || 'No transcript available'
    }

    return segments
      .map(segment => {
        const speaker = segment.speaker ? `[${segment.speaker}] ` : ''
        const timestamp = segment.start ? `[${formatTimestamp(segment.start)}] ` : ''
        return `${timestamp}${speaker}${segment.text}`
      })
      .join('\n\n')
  }, [segments, session.summary])

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullTranscriptText)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleDownloadText = () => {
    const blob = new Blob([fullTranscriptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title || 'transcript'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={session.title || 'Transcript'}>
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {copiedToClipboard ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadText}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <p className="text-sm text-gray-600">
              Found {filteredSegments.length} {filteredSegments.length === 1 ? 'result' : 'results'}
            </p>
          )}

          {/* Transcript Content */}
          <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
            {segments.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Transcript Available
                </h3>
                <p className="text-gray-600">
                  {session.summary ? (
                    <>
                      <span className="font-medium">Summary:</span>
                      <br />
                      {session.summary}
                    </>
                  ) : (
                    'This recording is still being processed.'
                  )}
                </p>
              </div>
            ) : filteredSegments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No matches found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSegments.map((segment, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    {/* Timestamp and Speaker */}
                    {(segment.start !== undefined || segment.speaker) && (
                      <div className="flex items-center gap-3 mb-2 text-sm">
                        {segment.start !== undefined && (
                          <span className="text-indigo-600 font-medium tabular-nums">
                            {formatTimestamp(segment.start)}
                          </span>
                        )}
                        {segment.speaker && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            {segment.speaker}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Segment Text */}
                    <p className="text-gray-800 leading-relaxed">
                      {highlightText(segment.text, searchQuery)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
