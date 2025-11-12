/**
 * Google Gemini Live API Integration
 * Real-time conversational AI with low-latency audio streaming
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationMessage, ConversationContext } from '@/types';

export interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemPrompt?: string;
}

export class GeminiLiveClient {
  private genAI: GoogleGenerativeAI;
  private config: GeminiLiveConfig;
  private conversationHistory: ConversationMessage[] = [];
  private context: ConversationContext;

  constructor(config: GeminiLiveConfig) {
    this.config = {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.8,
      maxOutputTokens: 2048,
      ...config,
    };

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.context = {
      recentTopics: [],
      entities: [],
      sentiment: 'neutral',
      suggestedPrompts: [],
    };
  }

  /**
   * Get system prompt for the storytelling assistant
   */
  private getSystemPrompt(): string {
    return this.config.systemPrompt || `You are a warm, patient, and curious storytelling assistant for "Here's My Story."
Your purpose is to help seniors and their families capture and preserve precious memories through conversation.

Guidelines:
- Use warm, patient, and conversational tone
- Ask short, simple questions (1-2 sentences max)
- Focus on eliciting stories, not interrogating
- Listen actively and reflect back details to confirm
- Gently probe for sensory details, emotions, and context
- Be respectful of memory gaps or sensitive topics
- Offer natural transitions between topics
- Suggest breaks for longer sessions
- Anchor to names, places, dates for accuracy

Example conversation patterns:
- "Would you like to start with your childhood, or perhaps a special moment from later in life?"
- "What made that moment so special for you?"
- "Who was with you at that time?"
- "Can you describe what it looked like? How it felt?"
- "That's a beautiful memory. Would you like to tell me more about that, or shall we explore something else?"

Remember: You're creating a safe, comfortable space for storytelling. Be curious but never pushy.`;
  }

  /**
   * Start a new conversation session
   */
  async startConversation(profileId: string): Promise<ConversationMessage> {
    this.conversationHistory = [];

    const greetingMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: "Hello! I'm here to help you share your stories. Would you like to start with a memory from your childhood, or is there a particular moment you'd like to talk about today?",
      timestamp: new Date(),
    };

    this.conversationHistory.push(greetingMessage);
    return greetingMessage;
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(
    text: string,
    audioUrl?: string
  ): Promise<ConversationMessage> {
    // Add user message to history
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      audioUrl,
    };
    this.conversationHistory.push(userMessage);

    // Generate response using Gemini
    const model = this.genAI.getGenerativeModel({
      model: this.config.model!,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
      },
      systemInstruction: this.getSystemPrompt(),
    });

    // Build chat history for context
    const chatHistory = this.conversationHistory
      .slice(0, -1) // Exclude the current message
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send message and get response
    const result = await chat.sendMessage(text);
    const responseText = result.response.text();

    // Create assistant message
    const assistantMessage: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    };

    this.conversationHistory.push(assistantMessage);

    // Update context
    await this.updateContext(text, responseText);

    return assistantMessage;
  }

  /**
   * End the conversation session
   */
  async endConversation(): Promise<{
    summary: string;
    topics: string[];
    entities: any[];
  }> {
    // Generate summary using Gemini
    const model = this.genAI.getGenerativeModel({
      model: this.config.model!,
    });

    const conversationText = this.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const summaryPrompt = `Please analyze this conversation and provide:
1. A brief summary (2-3 sentences)
2. Main topics discussed
3. Key people, places, and dates mentioned

Conversation:
${conversationText}

Format your response as JSON with keys: summary, topics, entities`;

    const result = await model.generateContent(summaryPrompt);
    const responseText = result.response.text();

    try {
      // Try to parse JSON response
      const parsed = JSON.parse(responseText);
      return {
        summary: parsed.summary || '',
        topics: parsed.topics || this.context.recentTopics,
        entities: parsed.entities || this.context.entities,
      };
    } catch {
      // Fallback if parsing fails
      return {
        summary: responseText,
        topics: this.context.recentTopics,
        entities: this.context.entities,
      };
    }
  }

  /**
   * Get suggested follow-up questions
   */
  async getSuggestedPrompts(): Promise<string[]> {
    if (this.conversationHistory.length < 2) {
      return [
        "Tell me about your childhood home",
        "What was your first job like?",
        "Do you remember a special family tradition?",
        "What's your favorite memory with your parents?",
      ];
    }

    // Use last few messages to generate contextual prompts
    const recentMessages = this.conversationHistory.slice(-4);
    const context = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const model = this.genAI.getGenerativeModel({
      model: this.config.model!,
    });

    const prompt = `Based on this conversation, suggest 3 natural follow-up questions to continue the storytelling:

${context}

Return only the questions, one per line.`;

    const result = await model.generateContent(prompt);
    const suggestions = result.response
      .text()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3);

    return suggestions;
  }

  /**
   * Update conversation context
   */
  private async updateContext(
    userText: string,
    assistantText: string
  ): Promise<void> {
    // Simple topic extraction (in production, use more sophisticated NLP)
    const commonTopics = [
      'childhood', 'family', 'parents', 'siblings', 'school', 'work',
      'wedding', 'children', 'travel', 'home', 'friends', 'hobbies'
    ];

    const mentionedTopics = commonTopics.filter(
      topic =>
        userText.toLowerCase().includes(topic) ||
        assistantText.toLowerCase().includes(topic)
    );

    // Update recent topics (keep last 5)
    this.context.recentTopics = [
      ...new Set([...mentionedTopics, ...this.context.recentTopics]),
    ].slice(0, 5);

    // Basic sentiment analysis (very simplified)
    const positiveWords = ['love', 'happy', 'joy', 'wonderful', 'beautiful', 'great'];
    const negativeWords = ['sad', 'difficult', 'hard', 'loss', 'pain', 'unfortunate'];

    const text = userText.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) {
      this.context.sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      this.context.sentiment = 'negative';
    } else {
      this.context.sentiment = 'neutral';
    }
  }

  /**
   * Get current conversation context
   */
  getContext(): ConversationContext {
    return this.context;
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.context = {
      recentTopics: [],
      entities: [],
      sentiment: 'neutral',
      suggestedPrompts: [],
    };
  }
}

/**
 * Create a new Gemini Live client instance
 */
export function createGeminiLiveClient(config?: Partial<GeminiLiveConfig>): GeminiLiveClient {
  const apiKey = config?.apiKey || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is required. Set GOOGLE_GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable.');
  }

  return new GeminiLiveClient({
    apiKey,
    ...config,
  });
}
