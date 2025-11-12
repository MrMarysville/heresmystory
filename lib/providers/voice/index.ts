/**
 * Voice Provider Factory
 * Creates and manages voice provider instances
 */

import { IVoiceProvider } from '@/types';
import { GoogleCustomVoiceProvider } from './google';
import { VoiceProvider as VoiceProviderEnum } from '@prisma/client';

export class VoiceProviderFactory {
  private static providers = new Map<string, IVoiceProvider>();

  /**
   * Get a voice provider instance
   */
  static async getProvider(
    providerName: VoiceProviderEnum = VoiceProviderEnum.GOOGLE_CUSTOM_VOICE
  ): Promise<IVoiceProvider> {
    // Check cache first
    const cached = this.providers.get(providerName);
    if (cached && (await cached.isAvailable())) {
      return cached;
    }

    // Create new instance
    let provider: IVoiceProvider;

    switch (providerName) {
      case VoiceProviderEnum.GOOGLE_CUSTOM_VOICE:
        provider = new GoogleCustomVoiceProvider();
        break;

      case VoiceProviderEnum.ELEVEN_LABS:
        // Implement ElevenLabs provider when needed
        throw new Error('ElevenLabs provider not yet implemented');

      default:
        throw new Error(`Unknown voice provider: ${providerName}`);
    }

    // Verify availability
    if (!(await provider.isAvailable())) {
      throw new Error(`Voice provider ${providerName} is not available`);
    }

    // Cache and return
    this.providers.set(providerName, provider);
    return provider;
  }

  /**
   * Get the default voice provider
   */
  static async getDefaultProvider(): Promise<IVoiceProvider> {
    return this.getProvider(VoiceProviderEnum.GOOGLE_CUSTOM_VOICE);
  }

  /**
   * Check if a provider is available
   */
  static async isProviderAvailable(
    providerName: VoiceProviderEnum
  ): Promise<boolean> {
    try {
      const provider = await this.getProvider(providerName);
      return await provider.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * List all available providers
   */
  static async listAvailableProviders(): Promise<VoiceProviderEnum[]> {
    const allProviders = Object.values(VoiceProviderEnum);
    const available: VoiceProviderEnum[] = [];

    for (const providerName of allProviders) {
      if (await this.isProviderAvailable(providerName)) {
        available.push(providerName);
      }
    }

    return available;
  }

  /**
   * Clear provider cache
   */
  static clearCache(): void {
    this.providers.clear();
  }
}

// Re-export provider classes for direct use if needed
export { GoogleCustomVoiceProvider } from './google';
export { BaseVoiceProvider } from './base';
