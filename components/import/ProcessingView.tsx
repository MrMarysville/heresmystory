/**
 * Processing View Component
 * Shows import progress and status for uploaded files
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ImportSession {
  id: string
  filename: string
  jobId: string
  status: string
}

interface ProcessingViewProps {
  sessions: ImportSession[]
  profileId: string
  onComplete?: () => void
}

interface SessionStatus {
  id: string
  title: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  error?: string
}

export function ProcessingView({ sessions, profileId, onComplete }: ProcessingViewProps) {
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, SessionStatus>>({})
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    // Poll for status updates
    const pollStatus = async () => {
      for (const session of sessions) {
        try {
          const response = await fetch(`/api/import/status?sessionId=${session.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setSessionStatuses((prev) => ({
                ...prev,
                [session.id]: {
                  id: data.data.sessionId,
                  title: data.data.title,
                  status: data.data.status,
                  progress: data.data.progress,
                  currentStep: data.data.currentStep,
                  error: data.data.jobs?.find((j: any) => j.status === 'FAILED')?.error,
                },
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching status:', error)
        }
      }
    }

    // Initial fetch
    pollStatus()

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [sessions])

  // Check if all completed
  useEffect(() => {
    const statuses = Object.values(sessionStatuses)
    if (statuses.length === sessions.length) {
      const completed = statuses.every((s) => s.status === 'completed' || s.status === 'failed')
      if (completed && !allCompleted) {
        setAllCompleted(true)
        if (onComplete) {
          onComplete()
        }
      }
    }
  }, [sessionStatuses, sessions.length, allCompleted, onComplete])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'processing':
        return (
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'processing':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const completedCount = Object.values(sessionStatuses).filter((s) => s.status === 'completed').length
  const failedCount = Object.values(sessionStatuses).filter((s) => s.status === 'failed').length
  const processingCount = Object.values(sessionStatuses).filter((s) => s.status === 'processing').length

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Progress</h2>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{processingCount}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {!allCompleted && (
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500 ease-out"
              style={{
                width: `${(completedCount / sessions.length) * 100}%`,
              }}
            />
          </div>
        )}

        {allCompleted && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {failedCount === 0 ? (
              <>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-medium">All files imported successfully!</p>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-700 font-medium">
                  Import complete with {failedCount} {failedCount === 1 ? 'error' : 'errors'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* File List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Import Details</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {sessions.map((session) => {
            const status = sessionStatuses[session.id]

            return (
              <div key={session.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {status ? getStatusIcon(status.status) : getStatusIcon('pending')}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1 truncate">
                      {status?.title || session.filename}
                    </h4>
                    {status && (
                      <>
                        <p className="text-sm text-gray-600 mb-2">{status.currentStep}</p>
                        {status.status === 'processing' && (
                          <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                            <div
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                            />
                          </div>
                        )}
                        {status.error && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{status.error}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full border text-sm font-medium ${
                    status ? getStatusColor(status.status) : getStatusColor('pending')
                  }`}>
                    {status?.status || 'pending'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      {allCompleted && (
        <div className="flex gap-3 justify-center">
          <Link
            href={`/library?profile=${profileId}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            View Imported Stories
          </Link>
          <Link
            href="/import"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Import More Files
          </Link>
        </div>
      )}
    </div>
  )
}
