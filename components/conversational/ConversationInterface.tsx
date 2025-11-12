/**
 * ConversationInterface Component
 * Displays conversation messages between user and AI assistant
 */

'use client';

import { useEffect, useRef } from 'react';
import { ConversationMessage } from '@/types';

interface ConversationInterfaceProps {
  messages: ConversationMessage[];
  isRecording: boolean;
}

export function ConversationInterface({
  messages,
  isRecording,
}: ConversationInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Your Story
            </h3>
            <p className="text-sm text-gray-500">
              {isRecording ? 'Recording in progress...' : 'Ready to begin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-600 font-medium">Live</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-2">Start recording to begin your story</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Role indicator */}
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'assistant' ? (
                    <>
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                      <span className="text-xs font-medium opacity-75">
                        Assistant
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        U
                      </div>
                      <span className="text-xs font-medium opacity-75">
                        You
                      </span>
                    </>
                  )}
                </div>

                {/* Message content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Timestamp */}
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-white/70'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>

                {/* Audio indicator if available */}
                {message.audioUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-75">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                    <span>Voice message</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {isRecording
              ? 'Your conversation is being recorded and transcribed in real-time'
              : 'Start recording to begin capturing your story'}
          </span>
        </div>
      </div>
    </div>
  );
}
