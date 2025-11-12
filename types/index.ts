// Core application types for Here's My Story

export type {
  User,
  Profile,
  Consent,
  Session,
  VoiceModel,
  Asset,
  Job,
  Share,
  Memory,
  UserRole,
  ConsentType,
  ConsentStatus,
  VoiceModelStatus,
  VoiceProvider,
  JobStatus,
  JobKind,
  AssetType,
} from '@prisma/client';

// Conversational AI Types
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  metadata?: Record<string, any>;
}

export interface ConversationSession {
  id: string;
  profileId: string;
  messages: ConversationMessage[];
  startedAt: Date;
  endedAt?: Date;
  context?: ConversationContext;
}

export interface ConversationContext {
  recentTopics: string[];
  entities: ExtractedEntity[];
  sentiment: 'positive' | 'neutral' | 'negative';
  suggestedPrompts: string[];
}

// Audio Processing Types
export interface AudioCleanupOptions {
  denoise: boolean;
  dereverb: boolean;
  deHum: boolean;
  deClick: boolean;
  normalize: boolean;
  targetLUFS: number;
  sampleRate: number;
}

export interface AudioSegment {
  startTime: number;
  endTime: number;
  speaker?: string;
  text?: string;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  segments: AudioSegment[];
  speakers: Speaker[];
  duration: number;
  language: string;
  confidence: number;
}

export interface Speaker {
  id: string;
  label: string;
  segments: number[];
}

// Voice Cloning Types
export interface VoiceTrainingConfig {
  provider: string;
  minDuration: number; // minutes
  targetDuration: number;
  requiredSamples: number;
  quality: 'standard' | 'premium' | 'ultra';
}

export interface VoiceSample {
  url: string;
  duration: number;
  quality: number;
  transcript?: string;
}

export interface VoiceTrainingStatus {
  progress: number; // 0-100
  stage: 'collecting' | 'processing' | 'training' | 'verifying' | 'ready';
  estimatedTimeRemaining?: number;
  quality?: VoiceQualityMetrics;
}

export interface VoiceQualityMetrics {
  clarity: number;
  consistency: number;
  expressiveness: number;
  overall: number;
}

// Memory & Entity Extraction Types
export interface ExtractedEntity {
  type: 'person' | 'place' | 'date' | 'event' | 'organization';
  text: string;
  confidence: number;
  context?: string;
  metadata?: Record<string, any>;
}

export interface TimelineEvent {
  id: string;
  date: Date | string;
  title: string;
  description: string;
  entities: ExtractedEntity[];
  sessionId: string;
  imageUrl?: string;
}

export interface StoryMetadata {
  title: string;
  summary: string;
  topics: string[];
  entities: ExtractedEntity[];
  timeline: TimelineEvent[];
  sentiment: string;
  keyMoments: KeyMoment[];
}

export interface KeyMoment {
  timestamp: number;
  text: string;
  significance: number;
  imageUrl?: string;
}

// Keepsake Types
export interface AlbumConfig {
  title: string;
  sessions: string[];
  includeImages: boolean;
  includeTranscripts: boolean;
  includeQRCodes: boolean;
  style: 'classic' | 'modern' | 'storybook';
  colorScheme?: string;
}

export interface VideoConfig {
  title: string;
  sessions: string[];
  voiceId: string;
  includeSubtitles: boolean;
  includeBroll: boolean;
  musicTrack?: string;
  duration?: number;
  resolution: '720p' | '1080p' | '4k';
}

export interface KeepsakeGenerationJob {
  id: string;
  type: 'album' | 'video';
  config: AlbumConfig | VideoConfig;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
}

// Image Generation Types
export interface ImageGenerationPrompt {
  scene: string;
  style: 'storybook' | 'watercolor' | 'sketch' | 'vintage';
  mood?: string;
  era?: string;
  safetyFilters: boolean;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  width: number;
  height: number;
  metadata?: Record<string, any>;
}

// Import & Digitization Types
export interface ImportJob {
  id: string;
  files: ImportFile[];
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  errors?: string[];
}

export interface ImportFile {
  filename: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export interface TapeDigitizationSession {
  id: string;
  startedAt: Date;
  duration: number;
  chunks: AudioChunk[];
  status: 'recording' | 'paused' | 'completed';
}

export interface AudioChunk {
  id: string;
  startTime: number;
  endTime: number;
  url: string;
  uploaded: boolean;
}

// Consent & Privacy Types
export interface ConsentFlow {
  type: ConsentType;
  version: string;
  title: string;
  description: string;
  legalText: string;
  steps: ConsentStep[];
}

export interface ConsentStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  type: 'info' | 'checkbox' | 'signature' | 'voice';
}

export interface ConsentRecord {
  id: string;
  profileId: string;
  type: ConsentType;
  version: string;
  signedAt: Date;
  revokedAt?: Date;
  status: ConsentStatus;
  auditTrail: ConsentAuditEntry[];
}

export interface ConsentAuditEntry {
  timestamp: Date;
  action: 'signed' | 'viewed' | 'revoked' | 'expired' | 'updated';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Sharing Types
export interface ShareConfig {
  assetId: string;
  expiresAt?: Date;
  allowedEmails?: string[];
  requirePassword?: boolean;
  password?: string;
  maxAccess?: number;
  notifyOnAccess?: boolean;
}

export interface ShareLink {
  id: string;
  token: string;
  url: string;
  expiresAt?: Date;
  accessCount: number;
  maxAccess?: number;
  createdAt: Date;
}

// Accessibility Types
export interface AccessibilitySettings {
  textSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  slowMode: boolean;
  speechRate: number; // 0.5 - 2.0
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}

// Payment & Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
}

export interface PlanLimits {
  maxProfiles: number;
  maxStorageGB: number;
  maxVoiceModels: number;
  maxRecordingMinutes: number;
  keepsakeGeneration: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Voice Provider Interface
export interface IVoiceProvider {
  name: string;

  /**
   * Check if the provider is available and properly configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Start training a voice model
   */
  trainVoice(config: {
    profileId: string;
    samples: VoiceSample[];
    options?: Record<string, any>;
  }): Promise<{ modelId: string; status: VoiceTrainingStatus }>;

  /**
   * Get the status of a voice training job
   */
  getTrainingStatus(modelId: string): Promise<VoiceTrainingStatus>;

  /**
   * Generate speech using a trained voice model
   */
  speak(config: {
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
  deleteVoiceModel(modelId: string): Promise<void>;

  /**
   * Validate if samples are sufficient for training
   */
  validateSamples(samples: VoiceSample[]): Promise<{
    valid: boolean;
    issues?: string[];
    recommendations?: string[];
  }>;
}

// Background Job Types
export interface BackgroundJob {
  id: string;
  kind: JobKind;
  payload: Record<string, any>;
  status: JobStatus;
  progress?: number;
  attempts: number;
  maxRetries: number;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobHandler {
  kind: JobKind;
  execute(payload: Record<string, any>): Promise<Record<string, any>>;
  onError?(error: Error, attempts: number): Promise<boolean>; // Return true to retry
}
