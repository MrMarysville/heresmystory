/**
 * RecordingControls Component
 * Controls for starting, pausing, and stopping recording
 */

'use client';

import { useState } from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  onStart: () => Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => Promise<void>;
  disabled?: boolean;
}

export function RecordingControls({
  isRecording,
  isPaused,
  duration,
  audioLevel,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: RecordingControlsProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStart();
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStop();
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Audio Level Visualizer */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Audio Level</span>
            <span>{audioLevel}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      )}

      {/* Duration Display */}
      {isRecording && (
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 font-mono">
            {formatDuration(duration)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {isPaused ? 'Paused' : 'Recording...'}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          // Start Button
          <button
            onClick={handleStart}
            disabled={disabled || isStarting}
            className="flex items-center justify-center w-20 h-20 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isStarting ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="6" />
              </svg>
            )}
          </button>
        ) : (
          <>
            {/* Pause/Resume Button */}
            <button
              onClick={isPaused ? onResume : onPause}
              disabled={disabled}
              className="flex items-center justify-center w-16 h-16 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isPaused ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              disabled={disabled || isStopping}
              className="flex items-center justify-center w-20 h-20 bg-gray-800 text-white rounded-full hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isStopping ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center text-sm text-gray-600">
        {!isRecording && (
          <p>Click the red button to start recording your story</p>
        )}
        {isRecording && !isPaused && (
          <p>Speaking... Click pause to take a break</p>
        )}
        {isRecording && isPaused && (
          <p>Take your time. Click play when you&apos;re ready to continue</p>
        )}
      </div>
    </div>
  );
}
