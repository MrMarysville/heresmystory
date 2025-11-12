/**
 * useRecording Hook
 * Manages audio recording state and operations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioRecorder } from '@/lib/audio/recorder';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error: string | null;
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    error: null,
  });

  const recorderRef = useRef<AudioRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize recorder
  const initialize = useCallback(async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder({
          sampleRate: 48000,
          channels: 1,
          mimeType: 'audio/webm;codecs=opus',
          onDataAvailable: (blob) => {
            audioChunksRef.current.push(blob);
          },
          onError: (error) => {
            setState(prev => ({ ...prev, error: error.message }));
          },
        });

        await recorderRef.current.initialize();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize recorder',
      }));
      throw error;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      await initialize();

      if (recorderRef.current) {
        audioChunksRef.current = [];
        recorderRef.current.start();

        setState(prev => ({
          ...prev,
          isRecording: true,
          isPaused: false,
          duration: 0,
          error: null,
        }));

        // Update duration every second
        intervalRef.current = setInterval(() => {
          if (recorderRef.current) {
            const duration = recorderRef.current.getDuration();
            const audioLevel = recorderRef.current.getAudioLevel();
            setState(prev => ({ ...prev, duration, audioLevel }));
          }
        }, 100);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
      throw error;
    }
  }, [initialize]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (recorderRef.current && state.isRecording && !state.isPaused) {
      recorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (recorderRef.current && state.isRecording && state.isPaused) {
      recorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      if (recorderRef.current && state.isRecording) {
        const audioBlob = await recorderRef.current.stop();

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          duration: 0,
          audioLevel: 0,
        }));

        return audioBlob;
      }
      return null;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
      throw error;
    }
  }, [state.isRecording]);

  // Get all audio chunks
  const getAudioChunks = useCallback(() => {
    return [...audioChunksRef.current];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recorderRef.current) {
        recorderRef.current.dispose();
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    getAudioChunks,
  };
}
