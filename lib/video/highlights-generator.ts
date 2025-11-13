/**
 * Video Highlights Generator
 * Creates video specifications for highlight reels from sessions
 */

interface SessionData {
  id: string
  title: string
  profileName: string
  profileAvatar?: string
  colorTheme: string
  summary: string | null
  transcriptJson: any
  entities: any
  tags: string[]
  duration: number | null
  audioUrl: string | null
}

interface VideoScene {
  type: 'title' | 'quote' | 'summary' | 'credits'
  duration: number // seconds
  data: any
}

interface VideoSpec {
  sessionId: string
  title: string
  duration: number
  aspectRatio: '16:9' | '9:16' | '1:1'
  backgroundColor: string
  primaryColor: string
  scenes: VideoScene[]
  audioUrl?: string
  audioSegments?: Array<{ start: number; end: number }>
}

export class VideoHighlightsGenerator {
  /**
   * Generate video specification for a highlights reel
   */
  async generateSpec(
    session: SessionData,
    options: {
      maxDuration?: number // seconds
      aspectRatio?: '16:9' | '9:16' | '1:1'
      includeAudio?: boolean
    } = {}
  ): Promise<VideoSpec> {
    const maxDuration = options.maxDuration || 60 // 1 minute default
    const aspectRatio = options.aspectRatio || '16:9'
    const includeAudio = options.includeAudio ?? true

    const scenes: VideoScene[] = []
    let totalDuration = 0

    // Scene 1: Title card (5 seconds)
    scenes.push({
      type: 'title',
      duration: 5,
      data: {
        title: session.title || 'A Family Story',
        subtitle: `as told by ${session.profileName}`,
        backgroundColor: session.colorTheme,
        textColor: '#ffffff',
      },
    })
    totalDuration += 5

    // Scene 2-4: Key quotes from transcript (15 seconds each)
    const keyQuotes = this.extractKeyQuotes(session.transcriptJson, 3)
    keyQuotes.forEach((quote, index) => {
      if (totalDuration + 15 <= maxDuration - 10) {
        // Reserve 10s for closing
        scenes.push({
          type: 'quote',
          duration: 15,
          data: {
            text: quote.text,
            timestamp: quote.timestamp,
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            accentColor: session.colorTheme,
          },
        })
        totalDuration += 15
      }
    })

    // Scene 5: Summary card (if room)
    if (session.summary && totalDuration + 10 <= maxDuration - 5) {
      scenes.push({
        type: 'summary',
        duration: 10,
        data: {
          summary: session.summary.substring(0, 200) + '...',
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
        },
      })
      totalDuration += 10
    }

    // Final scene: Credits (5 seconds)
    scenes.push({
      type: 'credits',
      duration: 5,
      data: {
        text: "Here's My Story",
        subtitle: 'Preserving Family Memories',
        backgroundColor: session.colorTheme,
        textColor: '#ffffff',
      },
    })
    totalDuration += 5

    // Generate audio segments if requested
    let audioSegments: Array<{ start: number; end: number }> | undefined
    if (includeAudio && session.audioUrl && session.transcriptJson) {
      audioSegments = this.extractAudioSegments(session.transcriptJson, keyQuotes, maxDuration)
    }

    return {
      sessionId: session.id,
      title: `${session.title || 'Story'} - Highlights`,
      duration: totalDuration,
      aspectRatio,
      backgroundColor: '#ffffff',
      primaryColor: session.colorTheme,
      scenes,
      audioUrl: includeAudio ? session.audioUrl || undefined : undefined,
      audioSegments,
    }
  }

  /**
   * Extract key quotes from transcript
   */
  private extractKeyQuotes(
    transcriptJson: any,
    count: number = 3
  ): Array<{ text: string; timestamp: number }> {
    try {
      const transcript =
        typeof transcriptJson === 'string' ? JSON.parse(transcriptJson) : transcriptJson

      if (!transcript || !Array.isArray(transcript.segments)) {
        return []
      }

      // Find segments that are good quotes (longer, complete sentences)
      const goodSegments = transcript.segments.filter((segment: any) => {
        const text = segment.text?.trim() || ''
        return (
          text.length > 50 && // At least 50 characters
          text.length < 200 && // Not too long
          (text.endsWith('.') || text.endsWith('!') || text.endsWith('?')) // Complete sentence
        )
      })

      // Distribute quotes evenly across the session
      const step = Math.floor(goodSegments.length / count)
      const quotes: Array<{ text: string; timestamp: number }> = []

      for (let i = 0; i < count && i < goodSegments.length; i++) {
        const index = i * step
        if (goodSegments[index]) {
          quotes.push({
            text: goodSegments[index].text,
            timestamp: goodSegments[index].start || 0,
          })
        }
      }

      return quotes
    } catch (error) {
      console.error('Error extracting quotes:', error)
      return []
    }
  }

  /**
   * Extract audio segments that correspond to key quotes
   */
  private extractAudioSegments(
    transcriptJson: any,
    quotes: Array<{ text: string; timestamp: number }>,
    maxDuration: number
  ): Array<{ start: number; end: number }> {
    try {
      const transcript =
        typeof transcriptJson === 'string' ? JSON.parse(transcriptJson) : transcriptJson

      if (!transcript || !Array.isArray(transcript.segments)) {
        return []
      }

      const segments: Array<{ start: number; end: number }> = []

      quotes.forEach((quote) => {
        // Find the matching segment in transcript
        const segment = transcript.segments.find((s: any) => s.text === quote.text)
        if (segment && segment.start !== undefined && segment.end !== undefined) {
          segments.push({
            start: segment.start,
            end: segment.end,
          })
        }
      })

      return segments
    } catch (error) {
      console.error('Error extracting audio segments:', error)
      return []
    }
  }

  /**
   * Export video spec as JSON for processing
   */
  exportSpec(spec: VideoSpec): string {
    return JSON.stringify(spec, null, 2)
  }
}
