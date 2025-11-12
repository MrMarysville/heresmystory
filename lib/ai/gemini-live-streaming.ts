/**
 * Google Gemini Live Streaming Client
 * Real-time bidirectional audio streaming with latest 2025 features
 *
 * Features:
 * - WebSocket-based streaming
 * - Bidirectional audio (input/output)
 * - Function calling for dynamic prompts
 * - Barge-in support (interruption handling)
 * - Real-time transcription
 * - Session state management
 * - Automatic reconnection
 */

import { EventEmitter } from 'events';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  voiceConfig?: {
    voiceName?: string;
    speakingRate?: number;
    pitch?: number;
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  systemInstruction?: string;
  tools?: GeminiTool[];
}

export interface GeminiTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export interface StreamMessage {
  type: 'audio' | 'text' | 'function_call' | 'tool_response' | 'turn_complete';
  data?: any;
  role?: 'user' | 'model';
  audioData?: ArrayBuffer;
  text?: string;
  functionCall?: {
    name: string;
    args: any;
  };
  toolResponse?: any;
}

export interface TranscriptSegment {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
}

export class GeminiLiveStreamingClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private isConnected = false;
  private isGenerating = false;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private audioQueue: ArrayBuffer[] = [];
  private tools = new Map<string, GeminiTool>();

  constructor(config: GeminiLiveConfig) {
    super();
    this.config = {
      model: 'gemini-2.0-flash-exp',
      voiceConfig: {
        speakingRate: 1.0,
        pitch: 0,
      },
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
      },
      ...config,
    };

    // Register tools
    if (config.tools) {
      config.tools.forEach(tool => this.tools.set(tool.name, tool));
    }
  }

  /**
   * Connect to Gemini Live API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Gemini Live uses WebSocket for real-time streaming
        const wsUrl = this.buildWebSocketUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('Connected to Gemini Live');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send initial setup message
          this.sendSetupMessage();

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Gemini Live');
          this.isConnected = false;
          this.emit('disconnected');

          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        };

      } catch (error) {
        console.error('Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Build WebSocket URL with config
   */
  private buildWebSocketUrl(): string {
    // Note: This is the conceptual structure. The actual Gemini Live endpoint may differ.
    // Check Google AI documentation for the exact WebSocket endpoint.
    const baseUrl = 'wss://generativelanguage.googleapis.com/ws/v1beta';
    const model = this.config.model;
    const apiKey = this.config.apiKey;

    return `${baseUrl}/models/${model}:streamGenerateContent?key=${apiKey}`;
  }

  /**
   * Send initial setup message
   */
  private sendSetupMessage(): void {
    const setupMessage = {
      setup: {
        model: this.config.model,
        generation_config: this.config.generationConfig,
        system_instruction: {
          parts: [{ text: this.getSystemPrompt() }],
        },
        tools: this.config.tools?.map(tool => ({
          function_declarations: [{
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          }],
        })),
      },
    };

    this.sendMessage(setupMessage);
  }

  /**
   * Get system prompt for storytelling
   */
  private getSystemPrompt(): string {
    return this.config.systemInstruction || `You are a warm, patient, and curious storytelling assistant for "Here's My Story."

Your purpose is to help seniors and families capture precious memories through natural conversation.

Guidelines:
- Use a warm, patient, and conversational tone
- Ask short, simple questions (1-2 sentences max)
- Focus on eliciting stories naturally, not interrogating
- Listen actively and reflect back details to confirm accuracy
- Gently probe for sensory details, emotions, and context
- Be respectful of memory gaps or sensitive topics
- Offer natural topic transitions
- Suggest breaks for longer sessions
- Anchor important details (names, places, dates)

Conversation patterns:
- Opening: "I'd love to hear your stories. Would you like to start with childhood memories, or perhaps a special moment from later in life?"
- Probing: "What made that moment so special? Can you describe what it looked like? How did it feel?"
- Confirming: "So if I understand correctly, this was in [place] around [time]? And [person] was with you?"
- Transitioning: "That's a beautiful memory. Would you like to tell me more about that time, or explore something else?"
- Closing: "Thank you for sharing these wonderful stories with me today."

Remember: Create a safe, comfortable space. Be curious but never pushy. The goal is natural storytelling.`;
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(data: any): Promise<void> {
    try {
      let message: any;

      // Handle binary audio data
      if (data instanceof ArrayBuffer) {
        this.emit('audio_output', data);
        return;
      }

      // Handle JSON messages
      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else {
        return;
      }

      // Handle different message types
      if (message.setup_complete) {
        this.sessionId = message.session_id;
        this.emit('session_ready', this.sessionId);
      }

      if (message.server_content) {
        const content = message.server_content;

        // Handle model turns (text responses)
        if (content.model_turn) {
          const parts = content.model_turn.parts || [];

          for (const part of parts) {
            if (part.text) {
              this.emit('text_output', {
                text: part.text,
                isFinal: true,
                timestamp: Date.now(),
              });
            }

            if (part.inline_data) {
              // Handle audio output
              const audioData = this.base64ToArrayBuffer(part.inline_data.data);
              this.emit('audio_output', audioData);
            }

            if (part.function_call) {
              // Handle function calls
              await this.handleFunctionCall(part.function_call);
            }
          }
        }

        // Handle transcription (user input recognized)
        if (content.user_transcript) {
          this.emit('transcript', {
            text: content.user_transcript.text,
            isFinal: content.user_transcript.is_final,
            confidence: content.user_transcript.confidence,
            timestamp: Date.now(),
          });
        }

        // Handle turn completion
        if (content.turn_complete) {
          this.isGenerating = false;
          this.emit('turn_complete');
        }

        // Handle interruption
        if (content.interrupted) {
          this.emit('interrupted');
        }
      }

      // Handle errors
      if (message.error) {
        this.emit('error', new Error(message.error.message));
      }

    } catch (error) {
      console.error('Message handling error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle function calls from the model
   */
  private async handleFunctionCall(functionCall: any): Promise<void> {
    const { name, args } = functionCall;
    const tool = this.tools.get(name);

    if (!tool) {
      console.warn(`Unknown function: ${name}`);
      return;
    }

    try {
      // Execute the function
      const result = await tool.handler(args);

      // Send function response back
      this.sendToolResponse(name, result);

      this.emit('function_call', { name, args, result });
    } catch (error) {
      console.error(`Function execution error for ${name}:`, error);
      this.sendToolResponse(name, { error: error instanceof Error ? error.message : 'Function failed' });
    }
  }

  /**
   * Send tool response back to the model
   */
  private sendToolResponse(functionName: string, result: any): void {
    const message = {
      tool_response: {
        function_responses: [{
          name: functionName,
          response: result,
        }],
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send audio input to the model
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) {
      this.audioQueue.push(audioData);
      return;
    }

    // Send audio as realtime input
    const message = {
      realtime_input: {
        media_chunks: [{
          mime_type: 'audio/pcm',
          data: this.arrayBufferToBase64(audioData),
        }],
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send text input to the model
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Not connected');
      return;
    }

    const message = {
      client_content: {
        turns: [{
          role: 'user',
          parts: [{
            text,
          }],
        }],
        turn_complete: true,
      },
    };

    this.sendMessage(message);
    this.isGenerating = true;
  }

  /**
   * Interrupt the current generation (barge-in)
   */
  interrupt(): void {
    if (!this.isConnected || !this.ws || !this.isGenerating) {
      return;
    }

    const message = {
      realtime_input: {
        interrupt: true,
      },
    };

    this.sendMessage(message);
  }

  /**
   * End the current turn
   */
  endTurn(): void {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const message = {
      client_content: {
        turn_complete: true,
      },
    };

    this.sendMessage(message);
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Disconnect from the API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && !!this.sessionId;
  }

  /**
   * Utility: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Create Gemini Live streaming client with story prompts
 */
export function createGeminiLiveClient(apiKey: string): GeminiLiveStreamingClient {
  // Define story prompt tools
  const tools: GeminiTool[] = [
    {
      name: 'suggest_story_prompt',
      description: 'Suggest a relevant story prompt based on conversation context',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to explore (e.g., childhood, family, career)',
          },
          context: {
            type: 'string',
            description: 'Recent conversation context',
          },
        },
        required: ['topic'],
      },
      handler: async (args) => {
        // Generate contextual prompts
        const prompts = {
          childhood: [
            "What was your favorite place to play when you were a child?",
            "Can you describe your childhood home?",
            "Who was your best friend growing up?",
          ],
          family: [
            "Tell me about your parents. What were they like?",
            "Do you remember any special family traditions?",
            "What's your favorite family memory?",
          ],
          career: [
            "What was your first job?",
            "What did you want to be when you grew up?",
            "Tell me about a proud moment in your career.",
          ],
          love: [
            "How did you meet your spouse/partner?",
            "What attracted you to them?",
            "Tell me about your first date.",
          ],
        };

        const topicPrompts = prompts[args.topic as keyof typeof prompts] || prompts.childhood;
        const randomPrompt = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];

        return {
          suggested_prompt: randomPrompt,
          topic: args.topic,
        };
      },
    },
    {
      name: 'extract_key_details',
      description: 'Extract and confirm key details from the story (names, dates, places)',
      parameters: {
        type: 'object',
        properties: {
          story_text: {
            type: 'string',
            description: 'The story text to extract details from',
          },
        },
        required: ['story_text'],
      },
      handler: async (args) => {
        // Simple extraction (in production, use NLP)
        const text = args.story_text;
        const details: any = {
          names: [],
          dates: [],
          places: [],
        };

        // Extract capitalized words as potential names
        const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
        details.names = [...new Set((text.match(namePattern) || []).filter((n: string) => n.length > 2))];

        // Extract years and dates
        const datePattern = /\b\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;
        details.dates = text.match(datePattern) || [];

        return details;
      },
    },
  ];

  return new GeminiLiveStreamingClient({
    apiKey,
    model: 'gemini-2.0-flash-exp',
    tools,
    voiceConfig: {
      speakingRate: 0.95, // Slightly slower for seniors
      pitch: 0,
    },
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 512, // Shorter responses for natural conversation
      topP: 0.95,
      topK: 40,
    },
  });
}
