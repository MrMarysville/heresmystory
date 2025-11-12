/**
 * Audio Recorder
 * Client-side audio recording using WebAudio API
 */

export interface RecorderConfig {
  sampleRate?: number;
  channels?: number;
  mimeType?: string;
  audioBitsPerSecond?: number;
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private config: Required<RecorderConfig>;
  private isRecording = false;
  private isPaused = false;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;

  constructor(config: RecorderConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate || 48000,
      channels: config.channels || 1,
      mimeType: config.mimeType || 'audio/webm;codecs=opus',
      audioBitsPerSecond: config.audioBitsPerSecond || 128000,
      onDataAvailable: config.onDataAvailable || (() => {}),
      onError: config.onError || ((error) => console.error('Recording error:', error)),
    };
  }

  /**
   * Initialize the recorder and request microphone permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context for analysis
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create media recorder
      const options: MediaRecorderOptions = {
        mimeType: this.config.mimeType,
        audioBitsPerSecond: this.config.audioBitsPerSecond,
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.config.onDataAvailable(event.data);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        const error = new Error(`MediaRecorder error: ${(event as any).error}`);
        this.config.onError(error);
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize recorder');
      this.config.onError(err);
      throw err;
    }
  }

  /**
   * Start recording
   */
  start(): void {
    if (!this.mediaRecorder) {
      throw new Error('Recorder not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      return;
    }

    this.chunks = [];
    this.startTime = Date.now();
    this.pausedDuration = 0;
    this.mediaRecorder.start(1000); // Collect data every second
    this.isRecording = true;
    this.isPaused = false;
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
      return;
    }

    this.mediaRecorder.pause();
    this.isPaused = true;
    this.pauseStartTime = Date.now();
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
      return;
    }

    this.mediaRecorder.resume();
    this.isPaused = false;
    this.pausedDuration += Date.now() - this.pauseStartTime;
  }

  /**
   * Stop recording and return the audio blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.config.mimeType });
        this.isRecording = false;
        this.isPaused = false;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get current recording duration in seconds
   */
  getDuration(): number {
    if (!this.isRecording) {
      return 0;
    }

    const elapsed = Date.now() - this.startTime;
    const activeDuration = elapsed - this.pausedDuration;
    return Math.floor(activeDuration / 1000);
  }

  /**
   * Get current audio level (0-100)
   */
  getAudioLevel(): number {
    if (!this.audioContext || !this.stream) {
      return 0;
    }

    // This is a simplified version. In production, use AnalyserNode for real-time audio level
    return 50; // Placeholder
  }

  /**
   * Check if recording is active
   */
  isActive(): boolean {
    return this.isRecording && !this.isPaused;
  }

  /**
   * Check if recording is paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Release resources
   */
  dispose(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.isPaused = false;
  }
}

/**
 * Create a visualizer for audio input
 */
export class AudioVisualizer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private source: MediaStreamAudioSourceNode;

  constructor(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  /**
   * Get current frequency data
   */
  getFrequencyData(): Uint8Array {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  /**
   * Get current audio level (0-100)
   */
  getLevel(): number {
    this.analyser.getByteFrequencyData(this.dataArray);
    const sum = this.dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / this.dataArray.length;
    return Math.min(100, Math.round((average / 255) * 100));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.source.disconnect();
    this.analyser.disconnect();
    this.audioContext.close();
  }
}
