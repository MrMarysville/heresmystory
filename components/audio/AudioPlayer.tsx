/**
 * Audio Player Component
 * Full-featured audio player with controls, progress bar, and keyboard shortcuts
 */

'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  onEnded?: () => void
  onClose?: () => void
}

export function AudioPlayer({ audioUrl, title, onEnded, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)

  // Load audio and restore saved position
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const savedPosition = localStorage.getItem(`audio-position-${audioUrl}`)
    if (savedPosition) {
      audio.currentTime = parseFloat(savedPosition)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime)
        // Save position every 5 seconds
        if (Math.floor(audio.currentTime) % 5 === 0) {
          localStorage.setItem(`audio-position-${audioUrl}`, audio.currentTime.toString())
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      localStorage.removeItem(`audio-position-${audioUrl}`)
      onEnded?.()
    }

    const handleError = () => {
      setError('Failed to load audio')
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [audioUrl, isSeeking, onEnded])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(-0.1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)

    const audio = audioRef.current
    if (audio) {
      audio.currentTime = newTime
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const changeVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVolume)

    const audio = audioRef.current
    if (audio) {
      audio.volume = newVolume
    }
  }

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate)

    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = rate
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = title || 'recording.mp3'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (error) {
    return (
      <div className="flex items-center justify-between p-4 bg-red-50 border-t border-red-200">
        <p className="text-red-700">{error}</p>
        {onClose && (
          <button onClick={onClose} className="text-red-700 hover:text-red-900">
            Close
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border-t shadow-lg">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {/* Title and Close */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {title || 'Playing...'}
              </p>
              <p className="text-xs text-gray-500">
                {playbackRate !== 1 ? `${playbackRate}x speed` : 'Normal speed'}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close player"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 tabular-nums w-12">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              onTouchStart={() => setIsSeeking(true)}
              onTouchEnd={() => setIsSeeking(false)}
              disabled={isLoading}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xs text-gray-600 tabular-nums w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Left: Playback controls */}
            <div className="flex items-center gap-2">
              {/* Skip back 10s */}
              <button
                onClick={() => skip(-10)}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Skip back 10 seconds"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                  />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Skip forward 10s */}
              <button
                onClick={() => skip(10)}
                disabled={isLoading}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Skip forward 10 seconds"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                  />
                </svg>
              </button>

              {/* Playback speed */}
              <div className="flex items-center gap-1 ml-2">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      playbackRate === rate
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Volume and download */}
            <div className="flex items-center gap-3">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value) - volume)}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Download audio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <p className="text-xs text-gray-500 text-center">
            Space: Play/Pause • ←/→: Skip 10s • ↑/↓: Volume
          </p>
        </div>
      </div>
    </div>
  )
}
