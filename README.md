# Here's My Story

A voice-first companion that captures, preserves, and retells personal stories with custom voice cloning. Designed for seniors and families to preserve precious memories for generations.

## 🎯 Mission

Build a platform that:
- Holds natural, memoryful conversations
- Captures and cleans audio automatically
- Trains consented custom voices from recordings
- Retells stories in familiar voices
- Generates beautiful keepsakes for families

## ✨ Features

### Core Capabilities

- **🎙️ Real-time Conversational AI**: Natural storytelling sessions powered by Google Gemini Live
- **🗣️ Voice Cloning**: Consent-first custom voice training using Google Custom Voice
- **🔊 Audio Processing**: Automatic cleanup pipeline (denoise, dereverb, normalize, diarization)
- **📝 Smart Transcription**: Speaker diarization and entity extraction
- **🖼️ Image Generation**: Optional AI-generated illustrations for stories
- **📚 Keepsakes**: Create PDF albums and narrated videos
- **🔒 Privacy-First**: Explicit consent flows, data encryption, full user control
- **♿ Accessible**: Large text, high contrast, slow mode for seniors

### User Journeys

1. **Quick Start**: One-tap recording with AI-guided storytelling
2. **Voice Training**: Build custom voice models from new or imported recordings
3. **Import & Digitize**: Process MP3s or cassette tapes with auto-cleanup
4. **Listen & Relive**: Hear stories retold in familiar voices
5. **Share**: Generate albums, videos, and private share links

## 🏗️ Technical Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript 5
- **Tailwind CSS** for styling
- **WebAudio API** for recording
- **Radix UI** for accessible components

### Backend
- **Next.js API Routes** (serverless functions)
- **Prisma** with PostgreSQL (Supabase recommended)
- **Google Cloud Services**:
  - Gemini Live API (conversational AI)
  - Custom Voice / Text-to-Speech
  - Speech-to-Text v2 (with diarization)
  - Cloud Storage (GCS)
- **Job Queue System** for background processing

### Audio Processing
- **ffmpeg** for format conversion and filtering
- **Google Speech-to-Text** for transcription and diarization
- **Audio cleanup pipeline**: denoise, dereverb, normalize to -16 LUFS

### Data & Memory
- **PostgreSQL** with pgvector for semantic search
- **Prisma ORM** for type-safe database access
- Comprehensive schema for users, profiles, sessions, consents, voice models

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Google Cloud Platform account with APIs enabled:
  - Generative AI API (Gemini)
  - Text-to-Speech API
  - Speech-to-Text API
  - Cloud Storage
- ffmpeg installed on your system

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd heresmystory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - Database connection (DATABASE_URL)
   - Google Cloud credentials and API keys
   - Storage bucket name
   - Optional: Stripe keys for payments

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # Optional: Seed with test data
   npm run db:seed
   ```

5. **Configure Google Cloud**
   - Create a service account with required permissions
   - Download credentials JSON
   - Set GOOGLE_APPLICATION_CREDENTIALS path in .env
   - Enable required APIs in Google Cloud Console

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Configuration

See `.env.example` for all available configuration options.

### Required Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Google Cloud
GOOGLE_AI_API_KEY="your-gemini-api-key"
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Optional Variables

- Voice provider settings (ElevenLabs alternative)
- Stripe payment keys
- Content safety settings
- Job queue configuration
- Audio processing parameters

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and authentication
- **profiles**: Individual storyteller profiles (grandma, dad, etc.)
- **sessions**: Recording sessions with transcripts and metadata
- **consents**: Consent records for voice training, recording, sharing
- **voice_models**: Trained voice models with quality metrics
- **assets**: Audio files, images, PDFs, videos
- **jobs**: Background processing queue
- **shares**: Private share links with expiration
- **memories**: Vector embeddings for semantic search

## 🎨 Architecture

### Directory Structure

```
heresmystory/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── sessions/      # Session management
│   │   ├── voice/         # Voice training & consent
│   │   ├── imports/       # File uploads
│   │   └── keepsakes/     # Album & video generation
│   ├── dashboard/         # Main dashboard
│   ├── library/           # Story library
│   ├── profiles/          # Profile management
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── conversational/   # Chat interface
│   ├── audio/            # Recording controls
│   ├── consent/          # Consent flows
│   └── avatar/           # Profile avatars
├── lib/                  # Core libraries
│   ├── ai/              # Gemini Live integration
│   ├── audio/           # Recording & cleanup
│   ├── providers/       # Voice provider interface
│   ├── database/        # Prisma client
│   ├── jobs/            # Background job queue
│   └── utils/           # Utilities
├── types/               # TypeScript types
├── prisma/              # Database schema
└── public/              # Static assets
```

### Key Design Patterns

- **Provider Interface**: Swappable voice providers (Google, ElevenLabs, etc.)
- **Job Queue**: Asynchronous processing with retry logic
- **Consent-First**: All voice operations require explicit consent
- **Stateless Audio Processing**: Idempotent cleanup pipeline
- **Type Safety**: Comprehensive TypeScript types throughout

## 🚀 API Routes

### Sessions

- `POST /api/sessions/start` - Start recording session
- `POST /api/sessions/finish` - End session and queue processing
- `POST /api/sessions/[id]/upload` - Upload audio chunks

### Voice Training

- `POST /api/voice/train` - Start voice model training
- `GET /api/voice/[id]` - Get training status
- `POST /api/voice/speak` - Generate speech with trained voice

### Consent

- `POST /api/voice/consent` - Record consent
- `GET /api/voice/consent?profileId=X` - Check consent status
- `DELETE /api/voice/consent?profileId=X` - Revoke consent

### Imports

- `POST /api/imports` - Upload audio files
- `GET /api/imports/[id]` - Check import status

## 🎯 User Flows

### Recording a Story

1. User taps "Start Recording"
2. System creates session and initializes Gemini Live
3. AI greets user and begins conversation
4. Audio recorded in chunks, uploaded continuously
5. User ends session when done
6. Background jobs process audio:
   - Cleanup (denoise, normalize)
   - Transcribe with diarization
   - Extract entities and generate summary

### Training a Voice

1. User provides consent (explicit flow)
2. System validates audio samples (15-40 min required)
3. Training job queued
4. Provider trains voice model
5. Quality metrics displayed
6. User approves final model
7. Voice ready for story retelling

## 🔒 Privacy & Consent

### Consent Types

- **Audio Recording**: Permission to record conversations
- **Voice Training**: Permission to create voice model
- **Family Sharing**: Permission to share with family members
- **Third-Party Providers**: If using external voice services

### User Rights

- View all consent records
- Revoke consent at any time
- Export all personal data
- Delete voice models (with 30-day notice)
- Review generated speech before sharing

### Security Measures

- Encryption at rest and in transit
- Regional data residency options
- No public indexing of content
- No third-party training on user data (without opt-in)
- Watermarking of synthesized speech

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Database Management

```bash
# Create migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Job Queue

```bash
# Start job processor
npm run jobs:process

# View queue stats
npm run jobs:stats
```

## 📝 Contributing

1. Follow TypeScript strict mode
2. Use Prettier for formatting
3. Write tests for new features
4. Update types when modifying schemas
5. Document API changes

## 🐛 Known Limitations

- Voice training requires 15+ minutes of audio
- Prisma engine binary download may fail in restricted environments (use PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1)
- ffmpeg must be installed separately
- Google Cloud APIs require billing account

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- Next.js & React
- Google Gemini & Cloud AI
- Prisma & PostgreSQL
- Radix UI & Tailwind CSS

---

**For Seniors, By Design**: Simple, safe, warm, and respectful. Every feature prioritizes ease of use and privacy.

## 🌿 Git Branch Structure

This project uses a standard `main` branch workflow:

**Development:** Work on the `main` branch locally  
**Remote:** Automatically synced to the feature branch for Claude Code compatibility

```bash
# Standard workflow - just use main!
git checkout main
git add .
git commit -m "Your changes"
git push  # Auto-handled
```

All your code is on `main` - work here as you normally would with any GitHub project.

