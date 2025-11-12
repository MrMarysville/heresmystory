/**
 * Dashboard Page - Streaming Version
 * Real-time recording interface with Gemini Live streaming
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RecordingControls } from '@/components/audio/RecordingControls';
import { ConversationInterface } from '@/components/conversational/ConversationInterface';
import { useStreamingRecording } from '@/lib/hooks/useStreamingRecording';
import { useGeminiStream } from '@/lib/hooks/useGeminiStream';
import { useSession } from '@/lib/hooks/useSession';

export default function StreamingDashboardPage() {
  const [profileId] = useState<string>('default-profile');
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const session = useSession();

  // Fetch API key on mount
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const response = await fetch('/api/gemini/token', {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success && data.data.apiKey) {
          setApiKey(data.data.apiKey);
        } else {
          console.error('Failed to fetch API key:', data.error);
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    }

    fetchApiKey();
  }, []);

  // Initialize Gemini stream
  const geminiStream = useGeminiStream(apiKey, isInitialized);

  // Handle audio data from recording
  const handleAudioData = useCallback((audioData: ArrayBuffer) => {
    if (geminiStream.isConnected) {
      geminiStream.sendAudio(audioData);
    }
  }, [geminiStream]);

  // Initialize streaming recording
  const recording = useStreamingRecording({
    onAudioData: handleAudioData,
    chunkSize: 1000, // 1 second chunks
  });

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      // Start session
      await session.startSession(profileId);

      // Start recording (this will start streaming audio to Gemini)
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
      // Stop recording
      const audioBlob = await recording.stopRecording();

      if (session.sessionId) {
        // Upload final audio
        if (audioBlob) {
          setUploadProgress(10);
          const audioUrl = await session.uploadAudioChunk(audioBlob);
          setUploadProgress(50);

          // Finish session
          await session.finishSession(audioUrl);
        } else {
          await session.finishSession();
        }

        setUploadProgress(100);

        // Show success message
        alert(
          'Recording saved! Your conversation has been captured. You can view it in the Library soon.'
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

  // Handle interruption (barge-in)
  const handleInterrupt = useCallback(() => {
    if (geminiStream.isConnected && geminiStream.isGenerating) {
      geminiStream.interrupt();
    }
  }, [geminiStream]);

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
              {geminiStream.isConnected && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live AI Connected
                </span>
              )}
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
            Record Your Story - Live AI
          </h2>
          <p className="text-gray-600">
            Have a natural conversation with AI. Your stories are captured in real-time with intelligent responses.
          </p>
        </div>

        {/* Status Messages */}
        {!apiKey && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Loading AI...
                </h3>
                <p className="text-sm text-yellow-700">
                  Connecting to Google Gemini Live API. Please wait...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(recording.error || session.error || geminiStream.error) && (
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
                  {recording.error || session.error || geminiStream.error}
                </p>
                <button
                  onClick={() => {
                    if (recording.error) recording.stopRecording();
                    if (session.error) session.clearError();
                    if (geminiStream.error) geminiStream.clearError();
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
              disabled={!apiKey || session.isLoading || uploadProgress > 0}
            />

            {/* AI Status */}
            {isInitialized && geminiStream.currentTranscript && (
              <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-purple-900 mb-1">
                      AI is responding...
                    </h3>
                    <p className="text-sm text-purple-700 italic">
                      {geminiStream.currentTranscript}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                Tips for Live AI Conversations
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Speak naturally - the AI listens and responds in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>You can interrupt the AI anytime (barge-in)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Pause anytime to collect your thoughts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>The AI will ask gentle questions to help you share</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Your entire conversation is saved for voice training</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Conversation Interface */}
          <div>
            <ConversationInterface
              messages={geminiStream.messages}
              isRecording={recording.isRecording}
            />
          </div>
        </div>

        {/* Session Info */}
        {isInitialized && session.sessionId && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Session ID: {session.sessionId.slice(0, 8)}... • AI Model: Gemini 2.0 Flash
          </div>
        )}
      </main>
    </div>
  );
}
