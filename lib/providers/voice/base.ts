/**
 * Base Voice Provider Interface
 * All voice providers must implement this interface
 */

import { IVoiceProvider, VoiceSample, VoiceTrainingStatus } from '@/types';

export abstract class BaseVoiceProvider implements IVoiceProvider {
  abstract name: string;

  /**
   * Check if the provider is available and properly configured
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Start training a voice model
   */
  abstract trainVoice(config: {
    profileId: string;
    samples: VoiceSample[];
    options?: Record<string, any>;
  }): Promise<{ modelId: string; status: VoiceTrainingStatus }>;

  /**
   * Get the status of a voice training job
   */
  abstract getTrainingStatus(modelId: string): Promise<VoiceTrainingStatus>;

  /**
   * Generate speech using a trained voice model
   */
  abstract speak(config: {
    modelId: string;
    text: string;
    options?: {
      speed?: number;
      pitch?: number;
      emotion?: string;
    };
  }): Promise<{ audioUrl: string; duration: number }>;

  /**
   * Delete a voice model
   */
  abstract deleteVoiceModel(modelId: string): Promise<void>;

  /**
   * Validate if samples are sufficient for training
   */
  abstract validateSamples(samples: VoiceSample[]): Promise<{
    valid: boolean;
    issues?: string[];
    recommendations?: string[];
  }>;

  /**
   * Helper: Calculate total duration of samples
   */
  protected getTotalDuration(samples: VoiceSample[]): number {
    return samples.reduce((total, sample) => total + sample.duration, 0);
  }

  /**
   * Helper: Calculate average quality of samples
   */
  protected getAverageQuality(samples: VoiceSample[]): number {
    if (samples.length === 0) return 0;
    const totalQuality = samples.reduce((sum, sample) => sum + sample.quality, 0);
    return totalQuality / samples.length;
  }
}
