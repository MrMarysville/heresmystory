/**
 * Audio Cleanup Pipeline
 * Server-side audio processing: denoise, normalize, segment, diarize
 */

import ffmpeg from 'fluent-ffmpeg';
import { SpeechClient } from '@google-cloud/speech';
import { AudioCleanupOptions, TranscriptionResult, AudioSegment } from '@/types';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class AudioCleanupPipeline {
  private speechClient: SpeechClient;
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.speechClient = new SpeechClient();
    this.storage = new Storage();
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'heresmystory-storage';
  }

  /**
   * Process audio file through cleanup pipeline
   */
  async processAudio(
    inputUrl: string,
    options: Partial<AudioCleanupOptions> = {}
  ): Promise<{
    cleanAudioUrl: string;
    transcription: TranscriptionResult;
    metadata: Record<string, any>;
  }> {
    const opts: AudioCleanupOptions = {
      denoise: true,
      dereverb: true,
      deHum: true,
      deClick: true,
      normalize: true,
      targetLUFS: -16,
      sampleRate: 48000,
      ...options,
    };

    // Download input file
    const inputPath = await this.downloadFile(inputUrl);

    try {
      // Step 1: Convert to WAV for processing
      const wavPath = await this.convertToWav(inputPath, opts.sampleRate);

      // Step 2: Apply audio cleanup filters
      const cleanedPath = await this.applyCleanupFilters(wavPath, opts);

      // Step 3: Normalize audio
      const normalizedPath = opts.normalize
        ? await this.normalizeAudio(cleanedPath, opts.targetLUFS)
        : cleanedPath;

      // Step 4: Upload cleaned audio
      const cleanAudioUrl = await this.uploadFile(normalizedPath, 'clean');

      // Step 5: Transcribe and diarize
      const transcription = await this.transcribeAndDiarize(normalizedPath);

      // Step 6: Get audio metadata
      const metadata = await this.getAudioMetadata(normalizedPath);

      // Cleanup temporary files
      await this.cleanupTempFiles([inputPath, wavPath, cleanedPath, normalizedPath]);

      return {
        cleanAudioUrl,
        transcription,
        metadata,
      };
    } catch (error) {
      // Cleanup on error
      await this.cleanupTempFiles([inputPath]);
      throw error;
    }
  }

  /**
   * Convert audio to WAV format
   */
  private async convertToWav(
    inputPath: string,
    sampleRate: number
  ): Promise<string> {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.wav');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(sampleRate)
        .format('wav')
        .on('error', reject)
        .on('end', () => resolve(outputPath))
        .save(outputPath);
    });
  }

  /**
   * Apply audio cleanup filters using ffmpeg
   */
  private async applyCleanupFilters(
    inputPath: string,
    options: AudioCleanupOptions
  ): Promise<string> {
    const outputPath = inputPath.replace('.wav', '_cleaned.wav');
    const filters: string[] = [];

    // High-pass filter to remove rumble and hum
    if (options.deHum) {
      filters.push('highpass=f=80');
    }

    // Noise reduction (basic - in production use more advanced tools like rnnoise)
    if (options.denoise) {
      filters.push('afftdn=nf=-25');
    }

    // De-reverb (reduce echo)
    if (options.dereverb) {
      filters.push('arnndn=m=./models/rnnoise.rnnn'); // Requires RNNoise model
    }

    // De-click (remove clicks and pops)
    if (options.deClick) {
      filters.push('adeclick=w=10:t=0.7');
    }

    // Compression to even out volume
    filters.push('acompressor=threshold=-20dB:ratio=4:attack=200:release=1000');

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      if (filters.length > 0) {
        command = command.audioFilters(filters);
      }

      command
        .on('error', reject)
        .on('end', () => resolve(outputPath))
        .save(outputPath);
    });
  }

  /**
   * Normalize audio to target LUFS
   */
  private async normalizeAudio(
    inputPath: string,
    targetLUFS: number
  ): Promise<string> {
    const outputPath = inputPath.replace('.wav', '_normalized.wav');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters([
          `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11:print_format=summary`,
        ])
        .on('error', reject)
        .on('end', () => resolve(outputPath))
        .save(outputPath);
    });
  }

  /**
   * Transcribe audio with speaker diarization
   */
  private async transcribeAndDiarize(
    audioPath: string
  ): Promise<TranscriptionResult> {
    // Read audio file
    const audioBuffer = await readFile(audioPath);
    const audioContent = audioBuffer.toString('base64');

    // Configure request with diarization
    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: 6,
      },
      model: 'latest_long',
      useEnhanced: true,
    };

    const request = {
      audio: { content: audioContent },
      config: config,
    };

    try {
      // Perform transcription
      const [response] = await this.speechClient.recognize(request);
      const result = response.results?.[0];

      if (!result || !result.alternatives || result.alternatives.length === 0) {
        throw new Error('No transcription results');
      }

      const alternative = result.alternatives[0];
      const words = alternative.words || [];

      // Extract segments with speaker labels
      const segments: AudioSegment[] = [];
      const speakers = new Map<number, { id: string; label: string }>();

      let currentSpeaker = -1;
      let currentSegment: AudioSegment | null = null;

      for (const word of words) {
        const speakerTag = word.speakerTag || 0;

        // Track unique speakers
        if (!speakers.has(speakerTag)) {
          speakers.set(speakerTag, {
            id: `speaker_${speakerTag}`,
            label: `Speaker ${speakerTag}`,
          });
        }

        // Start new segment if speaker changed
        if (speakerTag !== currentSpeaker) {
          if (currentSegment) {
            segments.push(currentSegment);
          }

          currentSegment = {
            startTime: parseFloat(word.startTime?.seconds || '0'),
            endTime: parseFloat(word.endTime?.seconds || '0'),
            speaker: `speaker_${speakerTag}`,
            text: word.word || '',
            confidence: alternative.confidence || 0,
          };

          currentSpeaker = speakerTag;
        } else if (currentSegment) {
          // Continue current segment
          currentSegment.text += ' ' + (word.word || '');
          currentSegment.endTime = parseFloat(word.endTime?.seconds || '0');
        }
      }

      // Add last segment
      if (currentSegment) {
        segments.push(currentSegment);
      }

      // Get audio duration
      const metadata = await this.getAudioMetadata(audioPath);

      return {
        text: alternative.transcript || '',
        segments,
        speakers: Array.from(speakers.values()).map((speaker, index) => ({
          ...speaker,
          segments: segments
            .map((seg, idx) => (seg.speaker === speaker.id ? idx : -1))
            .filter(idx => idx >= 0),
        })),
        duration: metadata.duration || 0,
        language: 'en-US',
        confidence: alternative.confidence || 0,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Get audio file metadata
   */
  private async getAudioMetadata(
    audioPath: string
  ): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration || 0,
          bitRate: metadata.format.bit_rate || 0,
          codec: audioStream?.codec_name || '',
          sampleRate: audioStream?.sample_rate || 0,
          channels: audioStream?.channels || 0,
          size: metadata.format.size || 0,
        });
      });
    });
  }

  /**
   * Download file from URL or GCS
   */
  private async downloadFile(url: string): Promise<string> {
    const tempPath = path.join('/tmp', `audio_${Date.now()}.tmp`);

    if (url.startsWith('gs://')) {
      // Download from GCS
      const bucket = url.split('/')[2];
      const filename = url.split('/').slice(3).join('/');
      await this.storage.bucket(bucket).file(filename).download({
        destination: tempPath,
      });
    } else if (url.startsWith('http')) {
      // Download from HTTP
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      await writeFile(tempPath, Buffer.from(buffer));
    } else {
      // Local file
      const buffer = await readFile(url);
      await writeFile(tempPath, buffer);
    }

    return tempPath;
  }

  /**
   * Upload file to GCS
   */
  private async uploadFile(
    filePath: string,
    type: 'raw' | 'clean'
  ): Promise<string> {
    const filename = `audio/${type}/${Date.now()}_${path.basename(filePath)}`;
    const bucket = this.storage.bucket(this.bucketName);

    await bucket.upload(filePath, {
      destination: filename,
      metadata: {
        contentType: 'audio/wav',
      },
    });

    return `gs://${this.bucketName}/${filename}`;
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async file => {
        try {
          if (file.startsWith('/tmp/')) {
            await unlink(file);
          }
        } catch {
          // Ignore cleanup errors
        }
      })
    );
  }
}

/**
 * Create audio cleanup pipeline instance
 */
export function createAudioCleanupPipeline(): AudioCleanupPipeline {
  return new AudioCleanupPipeline();
}
