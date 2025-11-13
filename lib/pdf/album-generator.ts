/**
 * PDF Generation Service
 * Creates beautiful PDF albums from session data
 */

import { jsPDF } from 'jspdf'

interface SessionData {
  id: string
  title: string
  profileName: string
  startedAt: string
  endedAt: string | null
  duration: number | null
  summary: string | null
  tags: string[]
  transcriptJson: any
  entities: any
  timeline: any
}

interface PDFOptions {
  includeTranscript?: boolean
  includeTimeline?: boolean
  includeEntities?: boolean
  colorTheme?: string
}

const DEFAULT_OPTIONS: PDFOptions = {
  includeTranscript: true,
  includeTimeline: true,
  includeEntities: true,
  colorTheme: '#6366f1',
}

export class PDFAlbumGenerator {
  private doc: jsPDF
  private currentY: number = 20
  private pageHeight: number = 297 // A4 height in mm
  private margin: number = 20
  private contentWidth: number = 170
  private primaryColor: string
  private textColor: string = '#1f2937'
  private lightGray: string = '#f3f4f6'

  constructor(colorTheme: string = '#6366f1') {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    this.primaryColor = colorTheme
  }

  /**
   * Generate a PDF album from session data
   */
  async generate(session: SessionData, options: PDFOptions = {}): Promise<Uint8Array> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // Title Page
    this.addTitlePage(session)

    // Summary Page
    if (session.summary) {
      this.addNewPage()
      this.addSummaryPage(session)
    }

    // Timeline
    if (opts.includeTimeline && session.timeline) {
      this.addNewPage()
      this.addTimelinePage(session)
    }

    // Entities
    if (opts.includeEntities && session.entities) {
      this.addNewPage()
      this.addEntitiesPage(session)
    }

    // Transcript
    if (opts.includeTranscript && session.transcriptJson) {
      this.addNewPage()
      this.addTranscriptPages(session)
    }

    // Return PDF as bytes
    return this.doc.output('arraybuffer')
  }

  /**
   * Add title page with session info
   */
  private addTitlePage(session: SessionData) {
    // Background color block
    this.doc.setFillColor(this.primaryColor)
    this.doc.rect(0, 0, 210, 100, 'F')

    // Title
    this.doc.setTextColor('#ffffff')
    this.doc.setFontSize(32)
    this.doc.setFont('helvetica', 'bold')
    this.addText(session.title || 'Untitled Story', this.margin, 50, { align: 'left' })

    // Profile name
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'normal')
    this.addText(`as told by ${session.profileName}`, this.margin, 70, { align: 'left' })

    // Metadata section
    this.doc.setTextColor(this.textColor)
    this.doc.setFontSize(11)
    this.currentY = 120

    const date = new Date(session.startedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    this.addText(`Recorded: ${date}`, this.margin, this.currentY)
    this.currentY += 8

    if (session.duration) {
      const minutes = Math.floor(session.duration / 60)
      const seconds = session.duration % 60
      this.addText(`Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`, this.margin, this.currentY)
      this.currentY += 8
    }

    if (session.tags && session.tags.length > 0) {
      this.addText(`Topics: ${session.tags.join(', ')}`, this.margin, this.currentY)
      this.currentY += 8
    }

    // Decorative line
    this.doc.setDrawColor(this.primaryColor)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, this.currentY + 10, 210 - this.margin, this.currentY + 10)

    // Footer
    this.doc.setFontSize(9)
    this.doc.setTextColor('#9ca3af')
    this.addText("Here's My Story - Family Memory Album", this.margin, 280, { align: 'center' })
  }

  /**
   * Add summary page
   */
  private addSummaryPage(session: SessionData) {
    this.addSectionHeader('Story Summary')
    this.currentY += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(this.textColor)

    const summary = session.summary || 'No summary available.'
    this.addWrappedText(summary, this.margin, this.currentY, this.contentWidth)
  }

  /**
   * Add timeline page
   */
  private addTimelinePage(session: SessionData) {
    this.addSectionHeader('Timeline')
    this.currentY += 10

    try {
      const timeline = typeof session.timeline === 'string'
        ? JSON.parse(session.timeline)
        : session.timeline

      if (timeline && Array.isArray(timeline.events)) {
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')

        timeline.events.forEach((event: any, index: number) => {
          if (this.currentY > this.pageHeight - 40) {
            this.addNewPage()
            this.currentY = this.margin
          }

          // Year circle
          this.doc.setFillColor(this.primaryColor)
          this.doc.circle(this.margin + 5, this.currentY, 3, 'F')

          // Connection line
          if (index < timeline.events.length - 1) {
            this.doc.setDrawColor(this.primaryColor)
            this.doc.setLineWidth(0.3)
            this.doc.line(this.margin + 5, this.currentY + 3, this.margin + 5, this.currentY + 15)
          }

          // Event text
          this.doc.setTextColor(this.textColor)
          this.doc.setFont('helvetica', 'bold')
          this.addText(event.year || event.date || 'Unknown', this.margin + 12, this.currentY)

          this.doc.setFont('helvetica', 'normal')
          this.doc.setFontSize(9)
          const eventText = event.description || event.event || ''
          this.addWrappedText(eventText, this.margin + 12, this.currentY + 5, this.contentWidth - 12, 4)

          this.currentY += 18
        })
      }
    } catch (error) {
      console.error('Error parsing timeline:', error)
      this.addText('Timeline data unavailable', this.margin, this.currentY)
    }
  }

  /**
   * Add entities page (people, places, dates)
   */
  private addEntitiesPage(session: SessionData) {
    this.addSectionHeader('Key People & Places')
    this.currentY += 10

    try {
      const entities = typeof session.entities === 'string'
        ? JSON.parse(session.entities)
        : session.entities

      if (entities) {
        // People
        if (entities.people && entities.people.length > 0) {
          this.doc.setFontSize(12)
          this.doc.setFont('helvetica', 'bold')
          this.doc.setTextColor(this.primaryColor)
          this.addText('People Mentioned', this.margin, this.currentY)
          this.currentY += 8

          this.doc.setFontSize(10)
          this.doc.setFont('helvetica', 'normal')
          this.doc.setTextColor(this.textColor)

          entities.people.slice(0, 10).forEach((person: any) => {
            if (this.currentY > this.pageHeight - 30) {
              this.addNewPage()
              this.currentY = this.margin
            }

            const name = typeof person === 'string' ? person : person.name
            const relation = typeof person === 'object' ? person.relation : ''
            const text = relation ? `${name} (${relation})` : name

            this.addText(`• ${text}`, this.margin + 5, this.currentY)
            this.currentY += 6
          })

          this.currentY += 5
        }

        // Places
        if (entities.places && entities.places.length > 0) {
          if (this.currentY > this.pageHeight - 50) {
            this.addNewPage()
            this.currentY = this.margin
          }

          this.doc.setFontSize(12)
          this.doc.setFont('helvetica', 'bold')
          this.doc.setTextColor(this.primaryColor)
          this.addText('Places Mentioned', this.margin, this.currentY)
          this.currentY += 8

          this.doc.setFontSize(10)
          this.doc.setFont('helvetica', 'normal')
          this.doc.setTextColor(this.textColor)

          entities.places.slice(0, 10).forEach((place: any) => {
            if (this.currentY > this.pageHeight - 30) {
              this.addNewPage()
              this.currentY = this.margin
            }

            const text = typeof place === 'string' ? place : place.name
            this.addText(`• ${text}`, this.margin + 5, this.currentY)
            this.currentY += 6
          })
        }
      }
    } catch (error) {
      console.error('Error parsing entities:', error)
      this.addText('Entity data unavailable', this.margin, this.currentY)
    }
  }

  /**
   * Add transcript pages
   */
  private addTranscriptPages(session: SessionData) {
    this.addSectionHeader('Full Transcript')
    this.currentY += 10

    try {
      const transcript = typeof session.transcriptJson === 'string'
        ? JSON.parse(session.transcriptJson)
        : session.transcriptJson

      if (transcript && Array.isArray(transcript.segments)) {
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(this.textColor)

        transcript.segments.forEach((segment: any) => {
          if (this.currentY > this.pageHeight - 40) {
            this.addNewPage()
            this.currentY = this.margin
          }

          // Timestamp
          const timestamp = this.formatTimestamp(segment.start)
          this.doc.setFont('helvetica', 'bold')
          this.doc.setTextColor('#6b7280')
          this.addText(`[${timestamp}]`, this.margin, this.currentY)

          // Speaker if available
          if (segment.speaker) {
            this.doc.setTextColor(this.primaryColor)
            this.addText(` ${segment.speaker}:`, this.margin + 20, this.currentY)
          }

          // Text
          this.doc.setFont('helvetica', 'normal')
          this.doc.setTextColor(this.textColor)
          const textX = segment.speaker ? this.margin : this.margin + 20
          this.addWrappedText(segment.text, textX, this.currentY + 5, this.contentWidth - (textX - this.margin), 5)

          this.currentY += 12
        })
      } else if (typeof transcript === 'string') {
        // Plain text transcript
        this.addWrappedText(transcript, this.margin, this.currentY, this.contentWidth)
      }
    } catch (error) {
      console.error('Error parsing transcript:', error)
      this.addText('Transcript unavailable', this.margin, this.currentY)
    }
  }

  /**
   * Helper: Add section header
   */
  private addSectionHeader(title: string) {
    this.doc.setFillColor(this.lightGray)
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 12, 'F')

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(this.primaryColor)
    this.addText(title, this.margin + 5, this.currentY + 8)

    this.currentY += 12
  }

  /**
   * Helper: Add text
   */
  private addText(text: string, x: number, y: number, options: { align?: 'left' | 'center' | 'right' } = {}) {
    const align = options.align || 'left'

    if (align === 'center') {
      this.doc.text(text, 105, y, { align: 'center' })
    } else if (align === 'right') {
      this.doc.text(text, 210 - this.margin, y, { align: 'right' })
    } else {
      this.doc.text(text, x, y)
    }
  }

  /**
   * Helper: Add wrapped text
   */
  private addWrappedText(text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) {
    const lines = this.doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage()
        this.currentY = this.margin
        y = this.currentY
      }
      this.doc.text(line, x, y)
      y += lineHeight
      this.currentY = y
    })
  }

  /**
   * Helper: Add new page
   */
  private addNewPage() {
    this.doc.addPage()
    this.currentY = this.margin

    // Add page number
    const pageNum = this.doc.getCurrentPageInfo().pageNumber
    this.doc.setFontSize(9)
    this.doc.setTextColor('#9ca3af')
    this.addText(`Page ${pageNum}`, 210 - this.margin, 287, { align: 'right' })
  }

  /**
   * Helper: Format timestamp
   */
  private formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Save PDF to file
   */
  save(filename: string) {
    this.doc.save(filename)
  }
}
