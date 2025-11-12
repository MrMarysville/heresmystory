/**
 * useSession Hook
 * Manages conversation session with backend API
 */

import { useState, useCallback } from 'react';
import { ConversationMessage } from '@/types';

export interface SessionState {
  sessionId: string | null;
  profileId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    profileId: null,
    messages: [],
    isLoading: false,
    error: null,
  });

  // Start session
  const startSession = useCallback(async (profileId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to start session');
      }

      const greetingMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.data.greeting,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        sessionId: data.data.sessionId,
        profileId: data.data.profileId,
        messages: [greetingMessage],
        isLoading: false,
      }));

      return data.data.sessionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Finish session
  const finishSession = useCallback(async (audioUrl?: string) => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/sessions/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          audioUrl,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to finish session');
      }

      setState(prev => ({
        ...prev,
        sessionId: null,
        profileId: null,
        messages: [],
        isLoading: false,
      }));

      return data.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to finish session';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [state.sessionId]);

  // Upload audio chunk
  const uploadAudioChunk = useCallback(
    async (audioBlob: Blob, chunkIndex?: number, totalChunks?: number) => {
      if (!state.sessionId) {
        throw new Error('No active session');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (chunkIndex !== undefined) formData.append('chunkIndex', chunkIndex.toString());
      if (totalChunks !== undefined) formData.append('totalChunks', totalChunks.toString());

      try {
        const response = await fetch(`/api/sessions/${state.sessionId}/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to upload audio');
        }

        return data.data.audioUrl;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    [state.sessionId]
  );

  // Add message to conversation
  const addMessage = useCallback((message: ConversationMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startSession,
    finishSession,
    uploadAudioChunk,
    addMessage,
    clearError,
  };
}
