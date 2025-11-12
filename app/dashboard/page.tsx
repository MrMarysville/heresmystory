/**
 * Dashboard Page
 * Main recording interface with live transcription
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecordingControls } from '@/components/audio/RecordingControls';
import { ConversationInterface } from '@/components/conversational/ConversationInterface';
import { useRecording } from '@/lib/hooks/useRecording';
import { useSession } from '@/lib/hooks/useSession';
import { ConversationMessage } from '@/types';

export default function DashboardPage() {
  // For MVP, use a default profile ID
  // In production, this would come from user selection or authentication
  const [profileId] = useState<string>('default-profile');
  const [isInitialized, setIsInitialized] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const recording = useRecording();
  const session = useSession();

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      // Start session
      await session.startSession(profileId);

      // Start recording
      await recording.startRecording();

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to start recording. Please check your microphone permissions.'
      );
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      // Stop recording and get audio blob
      const audioBlob = await recording.stopRecording();

      if (audioBlob && session.sessionId) {
        // Upload audio
        setUploadProgress(10);
        const audioUrl = await session.uploadAudioChunk(audioBlob);
        setUploadProgress(50);

        // Finish session
        await session.finishSession(audioUrl);
        setUploadProgress(100);

        // Show success message
        alert(
          'Recording saved! Your audio is being processed. You can view it in the Library soon.'
        );

        // Reset state
        setIsInitialized(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save recording. Please try again.'
      );
      setUploadProgress(0);
    }
  };

  // Simulate real-time transcription (in production, this would use Web Speech API or streaming)
  useEffect(() => {
    if (recording.isRecording && !recording.isPaused && recording.duration > 0) {
      // Simulate adding user messages periodically
      // In production, this would come from actual speech recognition
      const interval = setInterval(() => {
        // This is just for demonstration
        // Real implementation would use Web Speech API or streaming transcription
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [recording.isRecording, recording.isPaused, recording.duration, session]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <h1 className="text-xl font-bold text-gray-900">
                  Here&apos;s My Story
                </h1>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/library"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Library
              </Link>
              <Link
                href="/profiles"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Profiles
              </Link>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Record Your Story
          </h2>
          <p className="text-gray-600">
            Share your memories and experiences. The AI assistant will guide you
            through the conversation.
          </p>
        </div>

        {/* Error Display */}
        {(recording.error || session.error) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-700">
                  {recording.error || session.error}
                </p>
                <button
                  onClick={() => {
                    if (recording.error) recording.stopRecording();
                    if (session.error) session.clearError();
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <svg
                className="w-5 h-5 text-blue-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <span className="text-sm font-medium text-blue-800">
                Saving your recording... {uploadProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Recording Controls */}
          <div>
            <RecordingControls
              isRecording={recording.isRecording}
              isPaused={recording.isPaused}
              duration={recording.duration}
              audioLevel={recording.audioLevel}
              onStart={handleStartRecording}
              onPause={recording.pauseRecording}
              onResume={recording.resumeRecording}
              onStop={handleStopRecording}
              disabled={session.isLoading || uploadProgress > 0}
            />

            {/* Tips */}
            <div className="mt-6 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Tips for Great Recordings
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Find a quiet space with minimal background noise</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Speak clearly and at a comfortable pace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Take breaks anytime - just pause the recording</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>The AI assistant will guide you with gentle prompts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Aim for 15-40 minutes for the best voice training</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Conversation Interface */}
          <div>
            <ConversationInterface
              messages={session.messages}
              isRecording={recording.isRecording}
            />
          </div>
        </div>

        {/* Session Info */}
        {isInitialized && session.sessionId && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Session ID: {session.sessionId.slice(0, 8)}...
          </div>
        )}
      </main>
    </div>
  );
}
