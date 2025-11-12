/**
 * useGeminiStream Hook
 * React hook for Gemini Live streaming integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveStreamingClient, TranscriptSegment } from '@/lib/ai/gemini-live-streaming';
import { ConversationMessage } from '@/types';

export interface StreamState {
  isConnected: boolean;
  isGenerating: boolean;
  currentTranscript: string;
  error: string | null;
}

export function useGeminiStream(apiKey: string, enabled: boolean = false) {
  const [state, setState] = useState<StreamState>({
    isConnected: false,
    isGenerating: false,
    currentTranscript: '',
    error: null,
  });

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const clientRef = useRef<GeminiLiveStreamingClient | null>(null);
  const currentMessageRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Initialize streaming client
   */
  const initialize = useCallback(async () => {
    if (!apiKey || clientRef.current) {
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const { createGeminiLiveClient } = await import('@/lib/ai/gemini-live-streaming');

      const client = createGeminiLiveClient(apiKey);
      clientRef.current = client;

      // Setup event listeners
      client.on('connected', () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });

      client.on('disconnected', () => {
        setState(prev => ({ ...prev, isConnected: false }));
      });

      client.on('session_ready', (sessionId: string) => {
        console.log('Session ready:', sessionId);
      });

      client.on('text_output', (segment: TranscriptSegment) => {
        if (segment.isFinal) {
          // Add complete message
          const message: ConversationMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: segment.text,
            timestamp: new Date(segment.timestamp),
          };

          setMessages(prev => [...prev, message]);
          currentMessageRef.current = '';
          setState(prev => ({ ...prev, isGenerating: false }));
        } else {
          // Update current transcript (streaming)
          currentMessageRef.current = segment.text;
          setState(prev => ({ ...prev, currentTranscript: segment.text }));
        }
      });

      client.on('transcript', (segment: TranscriptSegment) => {
        // User's speech recognized
        if (segment.isFinal) {
          const message: ConversationMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: segment.text,
            timestamp: new Date(segment.timestamp),
          };

          setMessages(prev => [...prev, message]);
        }
      });

      client.on('audio_output', (audioData: ArrayBuffer) => {
        // Play audio response
        playAudio(audioData);
      });

      client.on('function_call', (data: any) => {
        console.log('Function called:', data.name, data.args);
      });

      client.on('turn_complete', () => {
        setState(prev => ({ ...prev, isGenerating: false }));
      });

      client.on('interrupted', () => {
        console.log('Generation interrupted');
        currentMessageRef.current = '';
        setState(prev => ({ ...prev, currentTranscript: '', isGenerating: false }));
      });

      client.on('error', (error: Error) => {
        setState(prev => ({ ...prev, error: error.message }));
      });

      // Connect
      await client.connect();

    } catch (error) {
      console.error('Failed to initialize streaming:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }));
    }
  }, [apiKey]);

  /**
   * Send audio data to the model
   */
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (!clientRef.current || !state.isConnected) {
      return;
    }

    clientRef.current.sendAudio(audioData);
    setState(prev => ({ ...prev, isGenerating: true }));
  }, [state.isConnected]);

  /**
   * Send text message
   */
  const sendText = useCallback((text: string) => {
    if (!clientRef.current || !state.isConnected) {
      return;
    }

    // Add user message
    const message: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);

    // Send to model
    clientRef.current.sendText(text);
    setState(prev => ({ ...prev, isGenerating: true }));
  }, [state.isConnected]);

  /**
   * Interrupt current generation (barge-in)
   */
  const interrupt = useCallback(() => {
    if (!clientRef.current) {
      return;
    }

    clientRef.current.interrupt();
    currentMessageRef.current = '';
    setState(prev => ({ ...prev, currentTranscript: '', isGenerating: false }));
  }, []);

  /**
   * End the current turn
   */
  const endTurn = useCallback(() => {
    if (!clientRef.current) {
      return;
    }

    clientRef.current.endTurn();
  }, []);

  /**
   * Play audio response
   */
  const playAudio = useCallback((audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const audioContext = audioContextRef.current;

    audioContext.decodeAudioData(audioData, (audioBuffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }).catch(error => {
      console.error('Audio playback error:', error);
    });
  }, []);

  /**
   * Disconnect
   */
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      isConnected: false,
      isGenerating: false,
      currentTranscript: '',
      error: null,
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize when enabled
  useEffect(() => {
    if (enabled && !clientRef.current) {
      initialize();
    }

    return () => {
      if (!enabled && clientRef.current) {
        disconnect();
      }
    };
  }, [enabled, initialize, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    messages,
    sendAudio,
    sendText,
    interrupt,
    endTurn,
    clearError,
  };
}
