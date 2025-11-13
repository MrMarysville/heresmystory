/**
 * Generate PDF Button Component
 * Trigger PDF album generation for a session
 */

'use client'

import { useState } from 'react'

interface GeneratePDFButtonProps {
  sessionId: string
  sessionTitle?: string
  variant?: 'primary' | 'secondary' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

export function GeneratePDFButton({
  sessionId,
  sessionTitle = 'Story',
  variant = 'secondary',
  size = 'md',
}: GeneratePDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/keepsakes/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          options: {
            includeTranscript: true,
            includeTimeline: true,
            includeEntities: true,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to generate PDF')
      }

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_album.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const getButtonClasses = () => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    const variantClasses = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
      secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      icon: 'p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    }

    return `${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium`
  }

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={getButtonClasses()}
          title="Download PDF Album"
          aria-label="Download PDF Album"
        >
          {isGenerating ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
        {error && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded shadow-lg text-xs text-red-800 w-48 z-10">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`flex items-center gap-2 ${getButtonClasses()}`}
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span>Download PDF Album</span>
          </>
        )}
      </button>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
