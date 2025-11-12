/**
 * useStreamingRecording Hook
 * Real-time audio recording with streaming to Gemini Live
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface StreamingRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error: string | null;
}

export interface StreamingRecordingOptions {
  onAudioData?: (audioData: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  chunkSize?: number; // milliseconds
}

export function useStreamingRecording(options: StreamingRecordingOptions = {}) {
  const [state, setState] = useState<StreamingRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  const chunkSize = options.chunkSize || 1000; // 1 second chunks

  /**
   * Initialize audio recording
   */
  const initialize = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000, // Gemini Live preferred sample rate
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context for analysis
      audioContextRef.current = new AudioContext({
        sampleRate: 24000,
      });

      // Create analyser for audio level visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Create media recorder with PCM audio for streaming
      // Note: For Gemini Live, we need PCM audio. WebM might need conversion.
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      // Handle data available
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && options.onAudioData) {
          // Convert blob to ArrayBuffer
          const arrayBuffer = await event.data.arrayBuffer();
          options.onAudioData(arrayBuffer);
        }
      };

      // Handle errors
      mediaRecorderRef.current.onerror = (event: Event) => {
        const error = new Error(`MediaRecorder error: ${(event as any).error}`);
        setState(prev => ({ ...prev, error: error.message }));
        if (options.onError) {
          options.onError(error);
        }
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize recorder');
      setState(prev => ({ ...prev, error: err.message }));
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  }, [options, chunkSize]);

  /**
   * Start recording and streaming
   */
  const startRecording = useCallback(async () => {
    try {
      await initialize();

      if (!mediaRecorderRef.current) {
        throw new Error('Recorder not initialized');
      }

      // Start recording with time slicing for streaming
      mediaRecorderRef.current.start(chunkSize);

      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        error: null,
      }));

      // Update duration and audio level
      intervalRef.current = setInterval(() => {
        updateMetrics();
      }, 100);

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      setState(prev => ({ ...prev, error: err.message }));
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    }
  }, [initialize, chunkSize, options]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !state.isRecording || state.isPaused) {
      return;
    }

    mediaRecorderRef.current.pause();
    pauseStartTimeRef.current = Date.now();
    setState(prev => ({ ...prev, isPaused: true }));
  }, [state.isRecording, state.isPaused]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !state.isRecording || !state.isPaused) {
      return;
    }

    mediaRecorderRef.current.resume();
    pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
    setState(prev => ({ ...prev, isPaused: false }));
  }, [state.isRecording, state.isPaused]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !state.isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Cleanup
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          duration: 0,
          audioLevel: 0,
        }));

        resolve(new Blob([], { type: 'audio/webm' }));
      };

      mediaRecorderRef.current.stop();
    });
  }, [state.isRecording]);

  /**
   * Update metrics (duration and audio level)
   */
  const updateMetrics = useCallback(() => {
    if (!state.isRecording) return;

    // Update duration
    const elapsed = Date.now() - startTimeRef.current;
    const activeDuration = elapsed - pausedDurationRef.current;
    const duration = Math.floor(activeDuration / 1000);

    // Update audio level
    let audioLevel = 0;
    if (analyserRef.current && !state.isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;
      audioLevel = Math.min(100, Math.round((average / 255) * 100));
    }

    setState(prev => ({ ...prev, duration, audioLevel }));
  }, [state.isRecording, state.isPaused]);

  /**
   * Get current audio level
   */
  const getAudioLevel = useCallback((): number => {
    if (!analyserRef.current || state.isPaused || !state.isRecording) {
      return 0;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;
    return Math.min(100, Math.round((average / 255) * 100));
  }, [state.isPaused, state.isRecording]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [state.isRecording]);

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    getAudioLevel,
  };
}
