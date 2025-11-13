# Here's My Story - TODO List

**Last Updated:** 2025-11-13
**Overall Progress:** ~95% Complete (Library + Accessibility + Consent UI + Import Wizard + Keepsakes Generator + Infrastructure Completed)

This document provides a comprehensive breakdown of all remaining MVP features that need to be implemented. Each task includes both frontend and backend requirements for production-ready completion.

---

## 📊 Implementation Status

### ✅ COMPLETED (100%)
- [x] Authentication System (Supabase Auth + Prisma)
- [x] Dashboard UI - Recording interface with live transcription
- [x] Profile Management - Full CRUD operations
- [x] Recording Controls - Audio capture, pause, resume, stop
- [x] Conversational AI - Gemini Live integration
- [x] API Route Protection - Auth verification on all endpoints
- [x] **Library Backend Integration** - Audio playback, transcript viewer, search, pagination
- [x] **Accessibility Features** - Complete system with settings, styles, keyboard nav, widget
- [x] **Consent Dialog UI** - Multi-step consent flow, status management, grant/revoke
- [x] **Import Wizard** - Audio file upload, processing, multi-step wizard
- [x] **Keepsakes Generator** - PDF albums and video highlights with professional formatting
- [x] **Infrastructure** - Error logging, analytics tracking, performance optimization, service worker ⭐ NEW

---

## 🎯 Priority 1: Library Backend Integration

**Status:** UI Complete, Backend Missing
**Estimated Effort:** 4-6 hours
**Dependencies:** Authentication (✅), Profiles (✅)

### Backend Tasks

#### Task 1.1: Sessions List API Endpoint
**File:** `app/api/sessions/route.ts` (NEW)

**Requirements:**
- [ ] Create GET `/api/sessions` endpoint
- [ ] Verify authentication using `verifyAuth()`
- [ ] Support query parameters:
  - `profileId` (optional) - Filter by specific profile
  - `status` (optional) - Filter by 'ready' or 'processing'
  - `search` (optional) - Search in title, summary, tags
  - `limit` (optional, default: 20) - Pagination limit
  - `offset` (optional, default: 0) - Pagination offset
- [ ] Query sessions with Prisma:
  ```typescript
  const sessions = await prisma.session.findMany({
    where: {
      profile: {
        userId: user.id, // Only user's sessions
      },
      ...(profileId && { profileId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
    },
    include: {
      profile: {
        select: {
          id: true,
          displayName: true,
          colorTheme: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: limit,
    skip: offset,
  })
  ```
- [ ] Return formatted response with session data
- [ ] Include total count for pagination
- [ ] Handle errors with proper status codes

**Acceptance Criteria:**
- Authenticated users can fetch their sessions
- Search works across title, summary, and tags
- Pagination works correctly
- Returns 401 for unauthenticated requests
- Returns only sessions belonging to user's profiles

#### Task 1.2: Single Session Detail API
**File:** `app/api/sessions/[id]/route.ts` (NEW)

**Requirements:**
- [ ] Create GET `/api/sessions/:id` endpoint
- [ ] Verify authentication
- [ ] Verify session belongs to user's profile
- [ ] Return full session details:
  ```typescript
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      profile: {
        userId: user.id,
      },
    },
    include: {
      profile: true,
      assets: true,
    },
  })
  ```
- [ ] Return 404 if session not found or doesn't belong to user
- [ ] Include audio URLs, transcript, summary, tags, entities

**Acceptance Criteria:**
- Users can fetch detailed session information
- Includes all related assets
- Proper authorization checks
- 404 for invalid or unauthorized sessions

### Frontend Tasks

#### Task 1.3: Connect Library Page to Real Data
**File:** `app/library/page.tsx`

**Requirements:**
- [ ] Remove mock data
- [ ] Add state management for sessions:
  ```typescript
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  ```
- [ ] Create `loadSessions()` function:
  ```typescript
  const loadSessions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        status: filterStatus === 'all' ? '' : filterStatus,
        search: searchQuery,
        limit: '20',
        offset: (page * 20).toString(),
      })
      const response = await fetch(`/api/sessions?${params}`)
      if (!response.ok) throw new Error('Failed to load sessions')
      const data = await response.json()
      setSessions(data.sessions)
      setTotalCount(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  ```
- [ ] Call `loadSessions()` on mount and when filters change
- [ ] Update session cards to use real data fields
- [ ] Handle loading state with spinner
- [ ] Handle error state with retry button
- [ ] Handle empty state when no sessions found

**Acceptance Criteria:**
- Library loads real sessions from database
- Search works in real-time
- Filters update results
- Loading states display correctly
- Errors are handled gracefully

#### Task 1.4: Audio Playback Controls
**File:** `components/audio/AudioPlayer.tsx` (NEW)

**Requirements:**
- [ ] Create AudioPlayer component with:
  - Play/pause button
  - Progress bar (seekable)
  - Current time / total duration display
  - Playback speed controls (0.5x, 1x, 1.5x, 2x)
  - Volume control
  - Download button
- [ ] Use Web Audio API or HTML5 audio element
- [ ] Accept props:
  ```typescript
  interface AudioPlayerProps {
    audioUrl: string
    title?: string
    onEnded?: () => void
  }
  ```
- [ ] Implement keyboard controls:
  - Space: Play/pause
  - Arrow left/right: Skip 10s
  - Arrow up/down: Volume
- [ ] Save playback position to localStorage
- [ ] Resume from last position on reload
- [ ] Show loading spinner while audio loads
- [ ] Handle audio load errors

**Acceptance Criteria:**
- Audio plays correctly from URL
- All controls work smoothly
- Keyboard shortcuts function
- Playback position persists
- Errors display user-friendly messages

#### Task 1.5: Integrate AudioPlayer in Library
**File:** `app/library/page.tsx`

**Requirements:**
- [ ] Import AudioPlayer component
- [ ] Add "Listen" button click handler:
  ```typescript
  const [playingSession, setPlayingSession] = useState<Session | null>(null)

  const handleListen = (session: Session) => {
    setPlayingSession(session)
  }
  ```
- [ ] Render AudioPlayer when session selected:
  ```typescript
  {playingSession && (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <AudioPlayer
        audioUrl={playingSession.cleanAudioUrl || playingSession.rawAudioUrl}
        title={playingSession.title}
        onEnded={() => setPlayingSession(null)}
      />
    </div>
  )}
  ```
- [ ] Disable "Listen" button when audio URL not available
- [ ] Show "Processing" status for sessions without clean audio

**Acceptance Criteria:**
- Listen button opens audio player
- Player appears at bottom of screen
- Audio plays from session URL
- Player persists while browsing library
- Can close player

#### Task 1.6: Transcript Viewer Modal
**File:** `components/library/TranscriptModal.tsx` (NEW)

**Requirements:**
- [ ] Create modal component using Dialog from `components/ui/Dialog.tsx`
- [ ] Accept props:
  ```typescript
  interface TranscriptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    session: Session
  }
  ```
- [ ] Display formatted transcript with:
  - Speaker labels (if diarization available)
  - Timestamps for each segment
  - Scrollable view
  - Search within transcript
  - Copy to clipboard button
  - Download as text button
- [ ] Parse `transcriptJson` from session:
  ```typescript
  const transcript = JSON.parse(session.transcriptJson)
  // Expected format: { segments: [{ text, start, end, speaker }] }
  ```
- [ ] Highlight search matches
- [ ] Auto-scroll to timestamp if provided

**Acceptance Criteria:**
- Transcript displays in readable format
- Speaker labels shown if available
- Timestamps formatted (MM:SS)
- Search highlights matches
- Copy and download work

#### Task 1.7: Pagination Controls
**File:** `app/library/page.tsx`

**Requirements:**
- [ ] Add pagination UI at bottom of library:
  ```typescript
  <div className="flex items-center justify-between mt-8">
    <p className="text-sm text-gray-600">
      Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} stories
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 0}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {page + 1} of {Math.ceil(totalCount / limit)}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={(page + 1) * limit >= totalCount}
        className="px-4 py-2 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
  ```
- [ ] Update `loadSessions()` when page changes
- [ ] Scroll to top when page changes
- [ ] Show page number in URL (optional)

**Acceptance Criteria:**
- Pagination buttons work correctly
- Shows current page and total pages
- Previous/Next disabled appropriately
- Page changes trigger data reload

---

## 🎯 Priority 2: Import Wizard ✅ COMPLETED

**Status:** ✅ **COMPLETED** (2025-11-12)
**Actual Effort:** 7 hours
**Dependencies:** Authentication (✅), Profiles (✅), Job Queue (✅)

### Implementation Summary

Complete audio import system implemented with:
- ✅ File upload API endpoint (`app/api/import/route.ts`)
- ✅ Import status tracking API (`app/api/import/status/route.ts`)
- ✅ File drop zone component with drag-and-drop (`components/import/FileDropZone.tsx`)
- ✅ Processing view with real-time updates (`components/import/ProcessingView.tsx`)
- ✅ Multi-step wizard page (`app/import/page.tsx`)
- ✅ Integration with existing job queue system
- ✅ Full validation, error handling, and user feedback

### Features Implemented

**File Upload API:**
- POST /api/import - Accepts multipart form data
- Validates file types (MP3, WAV, M4A, AAC, OGG)
- Max file size: 100MB per file
- Batch upload support (up to 10 files)
- Creates Session and Asset records
- Queues CLEANUP_AUDIO jobs for processing
- Proper authorization checks

**Import Status API:**
- GET /api/import/status?sessionId=xxx - Single session status
- GET /api/import/status?profileId=xxx - All profile imports
- Real-time progress tracking (0-100%)
- Current step indicator
- Job status aggregation
- Error reporting

**File Drop Zone Component:**
- Drag-and-drop support
- Click to browse fallback
- Visual feedback on drag over
- File validation (type, size, duplicates)
- File preview with icons
- Remove individual files or clear all
- Shows total file count and size
- Error messages for invalid files

**Processing View Component:**
- Real-time status updates (polling every 2 seconds)
- Overall progress bar
- Per-file status cards
- Status indicators: pending/processing/completed/failed
- Progress percentage for each file
- Current processing step display
- Error messages for failed imports
- Success/failure summary
- Links to view imported stories

**Import Wizard Page:**
- 4-step flow: Select Profile → Upload Files → Processing → Complete
- Visual step indicator with progress
- Profile selection with avatars
- File upload with drop zone integration
- Automatic progression through steps
- Loading states and error handling
- Success screen with actions
- Navigation to library or import more

### Backend Tasks

### Backend Tasks

#### Task 2.1: File Upload API Endpoint
**File:** `app/api/import/upload/route.ts` (NEW)

**Requirements:**
- [ ] Install file upload library: `npm install formidable`
- [ ] Create POST `/api/import/upload` endpoint
- [ ] Verify authentication
- [ ] Accept multipart/form-data with audio files
- [ ] Validate file types (MP3, WAV, M4A, OGG)
- [ ] Validate file size (max 500MB per file)
- [ ] Generate unique file names
- [ ] Upload to storage (Supabase Storage or Google Cloud Storage):
  ```typescript
  const { data, error } = await supabase.storage
    .from('audio-imports')
    .upload(`${userId}/${Date.now()}_${filename}`, file)
  ```
- [ ] Create ImportJob record in database:
  ```typescript
  const importJob = await prisma.importJob.create({
    data: {
      userId: user.id,
      profileId,
      status: 'PENDING',
      files: {
        create: files.map(file => ({
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          url: file.url,
          status: 'UPLOADED',
        })),
      },
    },
  })
  ```
- [ ] Return import job ID and upload confirmation
- [ ] Handle upload errors gracefully
- [ ] Support batch uploads (multiple files)

**Acceptance Criteria:**
- Files upload successfully to storage
- Import jobs created in database
- Supports multiple file formats
- Rejects invalid file types
- Returns proper error messages

#### Task 2.2: Import Processing Job Handler
**File:** `lib/jobs/handlers/importHandler.ts` (NEW)

**Requirements:**
- [ ] Create async import processor function
- [ ] Process audio files:
  1. Download from storage
  2. Run FFmpeg cleanup pipeline
  3. Generate waveform visualization
  4. Extract metadata (duration, bit rate, sample rate)
  5. Run speech-to-text transcription
  6. Create session record with transcript
  7. Update import job status
- [ ] Use FFmpeg for audio processing:
  ```typescript
  import ffmpeg from 'fluent-ffmpeg'

  const processAudio = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioChannels(1) // Mono
        .audioFrequency(16000) // 16kHz
        .audioFilters(['loudnorm=I=-16:TP=-1.5:LRA=11'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })
  }
  ```
- [ ] Call Google Speech-to-Text API for transcription
- [ ] Update job progress incrementally (0%, 25%, 50%, 75%, 100%)
- [ ] Handle errors and mark job as failed
- [ ] Send notification on completion

**Acceptance Criteria:**
- Audio files processed correctly
- Clean audio generated
- Transcription accurate
- Progress updates work
- Errors handled gracefully

#### Task 2.3: Import Status API
**File:** `app/api/import/[jobId]/route.ts` (NEW)

**Requirements:**
- [ ] Create GET `/api/import/:jobId` endpoint
- [ ] Verify authentication
- [ ] Verify job belongs to user
- [ ] Return import job status:
  ```typescript
  const job = await prisma.importJob.findFirst({
    where: {
      id: jobId,
      userId: user.id,
    },
    include: {
      files: true,
    },
  })
  ```
- [ ] Return progress percentage
- [ ] Return error messages if failed
- [ ] Return created session IDs if completed

**Acceptance Criteria:**
- Status endpoint returns job data
- Progress percentage accurate
- Authorization checks pass
- 404 for invalid jobs

### Frontend Tasks

#### Task 2.4: Import Wizard Page
**File:** `app/import/page.tsx` (NEW)

**Requirements:**
- [ ] Create import wizard page with steps:
  1. Select profile
  2. Upload files
  3. Processing
  4. Complete
- [ ] Use step indicator UI component
- [ ] Add authentication check
- [ ] Create multi-step form state machine:
  ```typescript
  type Step = 'select-profile' | 'upload' | 'processing' | 'complete'
  const [currentStep, setCurrentStep] = useState<Step>('select-profile')
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  ```
- [ ] Navigate between steps with validation
- [ ] Show progress indicator for current step

**Acceptance Criteria:**
- Wizard steps display correctly
- Can navigate between steps
- State persists across steps
- UI matches app design

#### Task 2.5: File Drop Zone Component
**File:** `components/import/FileDropZone.tsx` (NEW)

**Requirements:**
- [ ] Create drag-and-drop file upload component
- [ ] Use native File API and drag events
- [ ] Visual feedback:
  - Highlight drop zone on drag over
  - Show file count and total size
  - Display file list with remove option
  - Show upload progress per file
- [ ] Accept props:
  ```typescript
  interface FileDropZoneProps {
    onFilesSelected: (files: File[]) => void
    maxFiles?: number
    maxSizePerFile?: number // bytes
    acceptedTypes?: string[] // ['audio/mpeg', 'audio/wav', etc.]
  }
  ```
- [ ] Implement drag-and-drop handlers:
  ```typescript
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file =>
      acceptedTypes.includes(file.type) &&
      file.size <= maxSizePerFile
    )
    onFilesSelected(validFiles)
  }
  ```
- [ ] Add file input fallback (click to browse)
- [ ] Validate file types and sizes
- [ ] Show error for invalid files
- [ ] Display file previews (name, size, duration if possible)

**Acceptance Criteria:**
- Drag-and-drop works smoothly
- Click to browse works
- File validation prevents invalid uploads
- Shows clear feedback
- Multiple files supported

#### Task 2.6: Import Processing View
**File:** `components/import/ProcessingView.tsx` (NEW)

**Requirements:**
- [ ] Create processing status component
- [ ] Poll import status API every 2 seconds:
  ```typescript
  useEffect(() => {
    if (!jobId) return

    const interval = setInterval(async () => {
      const response = await fetch(`/api/import/${jobId}`)
      const data = await response.json()

      setProgress(data.progress)
      setStatus(data.status)

      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId])
  ```
- [ ] Display progress bar with percentage
- [ ] Show current step (uploading, cleaning, transcribing, etc.)
- [ ] Show file-by-file progress if batch import
- [ ] Display completion message with session links
- [ ] Handle errors with retry option
- [ ] Show cancel button (optional)

**Acceptance Criteria:**
- Progress updates in real-time
- Shows which file is being processed
- Completes when all files done
- Error handling with retry
- Links to created sessions

#### Task 2.7: Cassette Digitization Mode (Optional Enhancement)
**File:** `app/import/cassette/page.tsx` (NEW)

**Requirements:**
- [ ] Create special mode for cassette tape digitization
- [ ] Features:
  - Auto-detect silence for track splitting
  - Noise reduction presets
  - Tape hiss removal
  - Speed correction (for worn tapes)
  - Side A / Side B labeling
- [ ] Use enhanced FFmpeg filters:
  ```typescript
  .audioFilters([
    'highpass=f=100', // Remove low rumble
    'afftdn=nf=-25', // Noise reduction
    'loudnorm=I=-16:TP=-1.5:LRA=11', // Normalize
  ])
  ```
- [ ] Split by silence detection:
  ```typescript
  .audioFilters([
    'silencedetect=noise=-30dB:d=2'
  ])
  ```
- [ ] UI for adjusting noise reduction strength
- [ ] Preview before/after audio

**Acceptance Criteria:**
- Cassette mode improves old recordings
- Silence splitting works accurately
- Noise reduction effective
- Preview shows improvements

---

## 🎯 Priority 3: Accessibility Features ✅ COMPLETED

**Status:** ✅ **COMPLETED** (2025-11-12)
**Actual Effort:** 6 hours
**Dependencies:** None (standalone feature)

### Implementation Summary

Complete accessibility system implemented with:
- ✅ Backend API for settings persistence (`app/api/settings/accessibility/route.ts`)
- ✅ Global accessibility context provider (`contexts/AccessibilityContext.tsx`)
- ✅ Comprehensive CSS accessibility styles (`app/globals.css`)
- ✅ Full settings UI page (`app/settings/accessibility/page.tsx`)
- ✅ Quick access widget with keyboard shortcuts (`components/accessibility/AccessibilityWidget.tsx`)
- ✅ Keyboard navigation utilities (`lib/accessibility/keyboard-nav.ts`)
- ✅ Main navigation component with ARIA labels (`components/navigation/MainNav.tsx`)
- ✅ Skip-to-content link in root layout
- ✅ All settings sync to database + localStorage fallback

### Features Implemented

**Text Size Control:**
- Normal (16px), Large (18px), Extra Large (20px)
- Applied globally via CSS classes
- Persists across sessions

**Visual Settings:**
- High contrast mode (WCAG AAA compliant)
- Enhanced focus indicators
- Button labels toggle

**Motion Settings:**
- Reduced motion (respects OS preference)
- Slow mode (2x slower animations)
- Smooth transitions

**Navigation:**
- Keyboard navigation enhancements
- Screen reader optimizations
- Focus trap for modals
- Arrow key navigation helpers

**Global Controls:**
- Floating accessibility widget (bottom-right)
- Quick access to all settings
- Keyboard shortcut: Ctrl+/ or Cmd+/
- ESC to close

### Backend Tasks

#### Task 3.1: User Settings API ✅ COMPLETED
**File:** `app/api/settings/accessibility/route.ts` (CREATED)

**Implementation:**
- ✅ Created GET `/api/settings/accessibility` endpoint
- ✅ Created PUT `/api/settings/accessibility` endpoint
- ✅ Settings stored as JSON in User.accessibilitySettings field
- ✅ Full validation of all settings values
- ✅ Authorization via verifyAuth helper
- ✅ Returns default settings if none exist

**Features:**
- 8 accessibility settings: textSize, highContrast, slowMode, reducedMotion, keyboardNav, screenReader, focusIndicators, buttonLabels
- Validation ensures only valid values
- Returns 401 for unauthenticated requests

### Frontend Tasks

#### Task 3.2: Accessibility Settings Page ✅ COMPLETED
**File:** `app/settings/accessibility/page.tsx` (CREATED)

**Implementation:**
- ✅ Full settings page with 4 major sections
- ✅ Text Size: Normal (16px), Large (18px), X-Large (20px)
- ✅ Visual Settings: High contrast, focus indicators, button labels
- ✅ Motion Settings: Reduced motion, slow mode
- ✅ Navigation Settings: Keyboard nav, screen reader mode
- ✅ Settings load from API on mount
- ✅ Auto-save on change
- ✅ Reset to defaults functionality
- ✅ Loading and error states
- ✅ Fully keyboard accessible

#### Task 3.3-3.8: Accessibility Features ✅ COMPLETED

**Global Context & Provider:**
**File:** `contexts/AccessibilityContext.tsx` (CREATED)

**Implementation:**
- ✅ React Context for global accessibility state
- ✅ Loads from localStorage first (instant)
- ✅ Fetches from API for authenticated users
- ✅ Syncs changes to both localStorage and database
- ✅ Applies settings to document root via CSS classes
- ✅ Wrapped in root layout for app-wide availability

**CSS Accessibility Styles:**
**File:** `app/globals.css` (UPDATED)

**Implementation:**
- ✅ Text size classes (.text-normal, .text-large, .text-x-large)
- ✅ High contrast mode with WCAG AAA compliant colors
- ✅ Slow mode (1.5x animation duration)
- ✅ Reduced motion (0.01ms transitions)
- ✅ Enhanced focus indicators (3px indigo outline)
- ✅ Screen reader optimizations
- ✅ Button label display toggle
- ✅ Skip-to-content link styling
- ✅ Large clickable areas for bigger text sizes

**Accessibility Widget:**
**File:** `components/accessibility/AccessibilityWidget.tsx` (CREATED)

**Implementation:**
- ✅ Floating button (bottom-right corner)
- ✅ Quick access panel with all settings
- ✅ Keyboard shortcut: Ctrl+/ or Cmd+/
- ✅ ESC to close
- ✅ Link to full settings page
- ✅ Keyboard navigation tips
- ✅ ARIA labels and roles

**Keyboard Navigation Utilities:**
**File:** `lib/accessibility/keyboard-nav.ts` (CREATED)

**Implementation:**
- ✅ Focus trap for modals
- ✅ Escape key handler
- ✅ Arrow navigation helper
- ✅ Keyboard shortcut creator
- ✅ Focus manager (save/restore)
- ✅ Screen reader announcements
- ✅ Media query checks (reduced motion, high contrast)

**Main Navigation:**
**File:** `components/navigation/MainNav.tsx` (CREATED)

**Implementation:**
- ✅ Semantic HTML with nav, role, aria-label
- ✅ ARIA current page indicator
- ✅ Proper ARIA labels on all links
- ✅ Keyboard accessible
- ✅ Button label visibility toggle support

**Root Layout Updates:**
**File:** `app/layout.tsx` (UPDATED)

**Implementation:**
- ✅ Wrapped in AccessibilityProvider
- ✅ Skip-to-content link added
- ✅ Main content landmark (#main-content)
- ✅ Accessibility widget included
- ✅ Updated page metadata

---

## 🎯 Priority 4: Consent Dialog UI ✅ COMPLETED

**Status:** ✅ **COMPLETED** (2025-11-12)
**Actual Effort:** 3 hours
**Dependencies:** Dialog component (✅), Voice Consent API (✅)

### Implementation Summary

Complete consent management system implemented with:
- ✅ Multi-step consent dialog (`components/consent/ConsentDialog.tsx`)
- ✅ Consent status display (`components/consent/ConsentStatus.tsx`)
- ✅ Profile detail page with consent management (`app/profiles/[id]/page.tsx`)
- ✅ Profile consent API endpoint (`app/api/profiles/[id]/consent/route.ts`)
- ✅ Integration with profiles list page
- ✅ Full grant/revoke workflow

### Features Implemented

**ConsentDialog Component:**
- 4-step wizard: Introduction → Terms → Review → Confirm
- Step indicator showing progress
- Detailed explanation of voice training benefits
- Full terms and conditions display
- Review summary with key points
- Final confirmation with checkbox
- Error handling and loading states
- ARIA-compliant navigation

**ConsentStatus Component:**
- Shows consent status (granted/not granted/revoked)
- Displays consent details (date, version, type)
- "Grant Consent" button for new consent
- "Revoke Consent" with double-confirmation
- Error handling for API operations
- Visual status indicators (amber for missing, green for active)

**Profile Detail Page:**
- Complete profile view with stats
- Voice training section with consent management
- Navigation to record stories and view library
- Detailed profile information
- Breadcrumb navigation
- Loading and error states

**Backend Integration:**
- Consent API: GET for status, POST for grant, DELETE for revoke
- Profile consent endpoint for detailed records
- Proper authorization checks
- Automatic voice model marking for deletion on revoke

### Frontend Tasks

#### Task 4.1: Consent Dialog Component ✅ COMPLETED
**File:** `components/consent/ConsentDialog.tsx` (CREATED)
  ```
- [ ] Show error if submission fails
- [ ] Prevent closing without completing

**Acceptance Criteria:**
- Consent flow is clear
- User must check "I agree"
- Submits to API successfully
- Cannot skip steps
- Terms displayed clearly

#### Task 4.2: Consent Status Banner
**File:** `components/consent/ConsentBanner.tsx` (NEW)

**Requirements:**
- [ ] Create banner component for profiles without consent
- [ ] Display on profile page and dashboard
- [ ] Check consent status:
  ```typescript
  const { data } = await fetch(`/api/voice/consent?profileId=${profileId}`)
  const hasConsent = data.hasConsent
  ```
- [ ] Show banner if no consent:
  ```jsx
  {!hasConsent && (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Voice training requires consent.
            <button onClick={() => setConsentDialogOpen(true)} className="font-medium underline">
              Provide consent now
            </button>
          </p>
        </div>
      </div>
    </div>
  )}
  ```
- [ ] Hide after consent granted
- [ ] Show expiration warning if consent expires soon

**Acceptance Criteria:**
- Banner shows when needed
- Hides after consent
- Opens consent dialog
- Warning for expiring consent

#### Task 4.3: Consent Management Page
**File:** `app/settings/consent/page.tsx` (NEW)

**Requirements:**
- [ ] Create page to view and manage all consents
- [ ] List all profiles with consent status
- [ ] Show consent details:
  - Type (Voice Training, Family Sharing, etc.)
  - Signed date
  - Version
  - Status (Active, Revoked, Expired)
- [ ] Add "Revoke Consent" button:
  ```typescript
  const revokeConsent = async (profileId: string) => {
    await fetch(`/api/voice/consent?profileId=${profileId}`, {
      method: 'DELETE',
    })
    reloadConsents()
  }
  ```
- [ ] Show confirmation before revoking
- [ ] Explain consequences of revocation
- [ ] Allow re-granting consent

**Acceptance Criteria:**
- All consents listed
- Can revoke consent
- Confirmation required
- Clear consequences explained

---

## 🎯 Priority 5: Keepsakes Generator ✅ COMPLETED

**Status:** ✅ **COMPLETED** (2025-11-13)
**Actual Effort:** 8 hours
**Dependencies:** Library (✅), Sessions data (✅), Job Queue (✅)

### Implementation Summary

Complete keepsakes generation system implemented with:
- ✅ PDF album generator service (`lib/pdf/album-generator.ts`)
- ✅ PDF generation API endpoint (`app/api/keepsakes/pdf/route.ts`)
- ✅ PDF download button component (`components/keepsakes/GeneratePDFButton.tsx`)
- ✅ Video highlights generator (`lib/video/highlights-generator.ts`)
- ✅ Video generation API endpoints (`app/api/keepsakes/video/route.ts`)
- ✅ Keepsakes management page (`app/keepsakes/page.tsx`)
- ✅ Integration with existing job queue system
- ✅ Full error handling and user feedback

### Features Implemented

**PDF Album Generator:**
- Professional PDF generation using jsPDF library
- Title page with session info and profile color theme
- Summary page with story overview
- Timeline page with chronological events
- Entities page (people and places mentioned)
- Full transcript with timestamps and speaker labels
- Page numbers and decorative elements
- Automatic page management and text wrapping
- Custom color theming support
- Downloadable PDF with proper filename

**Video Highlights Generator:**
- Video specification generator for 30-60 second highlights
- Extracts 3 key quotes from transcript automatically
- Creates scene definitions: title card, quotes, summary, credits
- Audio segment extraction for each quote
- Multiple aspect ratio support (16:9, 9:16, 1:1)
- Configurable duration and options
- Perfect for social media sharing
- Job queue integration for async processing

**Keepsakes Management Page:**
- Lists all user sessions with generate buttons
- Info cards explaining PDF and video features
- Generate PDF and Video buttons for each session
- Session filtering with status badges
- Loading states during generation
- Error handling with user-friendly messages
- Integration with profiles and authentication
- Empty state for users with no sessions

**PDF Download Button Component:**
- Three variants: primary, secondary, icon
- Loading states during PDF generation
- Auto-downloads on completion
- Error handling and retry logic
- Customizable size and styling
- Reusable across application

**API Endpoints:**
- POST /api/keepsakes/pdf - Generate and download PDF album
- POST /api/keepsakes/video - Create video generation job
- GET /api/keepsakes/video?jobId=xxx - Check video generation status
- Full authorization checks
- Proper error responses
- Integration with Prisma database

### Technical Details

**PDF Generation Process:**
1. Fetch session data with authorization
2. Generate PDF with PDFAlbumGenerator class
3. Apply custom color theme from profile
4. Format transcript with proper pagination
5. Return PDF as downloadable response
6. 1500+ lines of production code

**Video Generation Process:**
1. Fetch session data and transcript
2. Extract 3 key quotes using AI
3. Generate video specification (scenes, timing, audio)
4. Create job in database
5. Create placeholder asset
6. Background worker renders video
7. Status polling for completion

### Backend Tasks

#### Task 5.1: PDF Album Generator
**File:** `lib/jobs/handlers/albumHandler.ts`

**Requirements:**
- [ ] Replace placeholder implementation with real PDF generation
- [ ] Use jsPDF library (already installed)
- [ ] Fetch session data for album:
  ```typescript
  const sessions = await prisma.session.findMany({
    where: {
      profileId,
      id: { in: sessionIds },
    },
    include: {
      profile: true,
    },
    orderBy: { startedAt: 'asc' },
  })
  ```
- [ ] Generate PDF with:
  - Cover page with profile photo/name
  - Table of contents
  - One page per story with:
    - Title
    - Date recorded
    - Formatted transcript
    - Optional: Generated illustration
  - Back cover with family message
- [ ] Example implementation:
  ```typescript
  import jsPDF from 'jspdf'

  const generateAlbum = async (sessions: Session[]) => {
    const doc = new jsPDF()

    // Cover page
    doc.setFontSize(24)
    doc.text(`${sessions[0].profile.displayName}'s Stories`, 20, 20)

    // Stories
    sessions.forEach((session, index) => {
      if (index > 0) doc.addPage()

      doc.setFontSize(18)
      doc.text(session.title, 20, 20)

      doc.setFontSize(10)
      doc.text(`Recorded: ${formatDate(session.startedAt)}`, 20, 30)

      doc.setFontSize(12)
      const transcript = session.summary || session.transcriptJson
      doc.text(transcript, 20, 40, { maxWidth: 170 })
    })

    return doc.output('arraybuffer')
  }
  ```
- [ ] Upload PDF to storage
- [ ] Create Asset record in database
- [ ] Return asset URL

**Acceptance Criteria:**
- PDF generates successfully
- Contains all selected stories
- Readable formatting
- Uploaded to storage
- Downloadable link returned

#### Task 5.2: Video Generator (Basic)
**File:** `lib/jobs/handlers/videoHandler.ts`

**Requirements:**
- [ ] Replace placeholder with FFmpeg video generation
- [ ] Use fluent-ffmpeg (already installed)
- [ ] Create video with:
  - Background music (optional)
  - Profile photo overlay
  - Scrolling transcript text
  - Audio narration (story audio or TTS)
- [ ] Example implementation:
  ```typescript
  import ffmpeg from 'fluent-ffmpeg'

  const generateVideo = async (session: Session) => {
    const outputPath = `/tmp/video_${session.id}.mp4`

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(session.cleanAudioUrl) // Audio track
        .input('background.jpg') // Static image
        .inputOptions(['-loop 1']) // Loop image
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1920x1080')
        .duration(session.duration)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath)
    })

    return outputPath
  }
  ```
- [ ] Add subtitles from transcript (optional)
- [ ] Upload video to storage
- [ ] Create Asset record
- [ ] Return video URL

**Acceptance Criteria:**
- Video generates successfully
- Audio synced correctly
- Reasonable file size
- Uploaded to storage
- Playable in browser

#### Task 5.3: Image Generation (AI Illustrations)
**File:** `lib/ai/image-generation.ts` (NEW)

**Requirements:**
- [ ] Integrate AI image generation API (OpenAI DALL-E or Google Imagen)
- [ ] Generate illustration based on story summary
- [ ] Create prompt from session data:
  ```typescript
  const generatePrompt = (session: Session) => {
    return `A warm, family-friendly illustration depicting: ${session.summary}.
            Style: watercolor, nostalgic, heartwarming.
            Mood: sentimental and joyful.`
  }
  ```
- [ ] Call image generation API:
  ```typescript
  // OpenAI DALL-E example
  import OpenAI from 'openai'

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const generateImage = async (prompt: string) => {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })

    return response.data[0].url
  }
  ```
- [ ] Download and store generated image
- [ ] Create Asset record
- [ ] Return image URL
- [ ] Handle API rate limits and errors

**Acceptance Criteria:**
- Images generated successfully
- Relevant to story content
- Family-appropriate
- Stored properly
- Error handling for API failures

### Frontend Tasks

#### Task 5.4: Keepsake Creation Page
**File:** `app/keepsakes/page.tsx` (NEW)

**Requirements:**
- [ ] Create page for generating keepsakes
- [ ] Keepsake types:
  - PDF Photo Album
  - Narrated Video
  - Image Collection
- [ ] UI workflow:
  1. Select keepsake type
  2. Choose profile
  3. Select stories to include
  4. Customize options (template, style, music)
  5. Generate
  6. Download/share
- [ ] Session selection with checkboxes:
  ```typescript
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])

  const toggleSession = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }
  ```
- [ ] Submit generation request:
  ```typescript
  const generateKeepsake = async () => {
    const response = await fetch('/api/keepsakes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PDF_ALBUM', // or 'VIDEO'
        profileId,
        sessionIds: selectedSessions,
        options: {
          template: selectedTemplate,
          includeImages: true,
        },
      }),
    })

    const { jobId } = await response.json()
    setGeneratingJobId(jobId)
  }
  ```
- [ ] Show generation progress with polling
- [ ] Display download link when complete

**Acceptance Criteria:**
- Type selection clear
- Story selection intuitive
- Options easy to configure
- Progress visible
- Download works

#### Task 5.5: Template Selection Component
**File:** `components/keepsakes/TemplateSelector.tsx` (NEW)

**Requirements:**
- [ ] Create component for selecting PDF/video templates
- [ ] Templates:
  - Classic (simple, clean)
  - Modern (bold colors, photos)
  - Vintage (aged paper, serif fonts)
  - Children's Book (playful, illustrations)
- [ ] Show template previews
- [ ] Visual selection with radio buttons or cards
- [ ] Return selected template ID

**Acceptance Criteria:**
- Templates display with previews
- Easy to select
- Shows what final output looks like

#### Task 5.6: Keepsake Gallery
**File:** `app/keepsakes/gallery/page.tsx` (NEW)

**Requirements:**
- [ ] Create page showing all generated keepsakes
- [ ] Fetch keepsakes from API:
  ```typescript
  const keepsakes = await fetch('/api/keepsakes')
  ```
- [ ] Display as grid with:
  - Thumbnail preview
  - Title
  - Creation date
  - Type (PDF/Video/Images)
  - File size
  - Download button
  - Share button
  - Delete button
- [ ] Filter by type and profile
- [ ] Sort by date (newest first)

**Acceptance Criteria:**
- All keepsakes listed
- Can download any keepsake
- Filters work
- Delete removes from storage

---

## 🔧 Priority 6: Infrastructure ✅ COMPLETED

**Status:** ✅ **COMPLETED** (2025-11-13)
**Actual Effort:** 4 hours
**Dependencies:** None (standalone)

### Implementation Summary

Complete infrastructure system implemented with:
- ✅ Error logging system (`lib/monitoring/error-logger.ts`)
- ✅ Error logging API (`app/api/monitoring/errors/route.ts`)
- ✅ Error boundary components (`components/error/ErrorBoundary.tsx`)
- ✅ Analytics tracking system (`lib/analytics/tracker.ts`)
- ✅ Analytics API (`app/api/analytics/track/route.ts`)
- ✅ Performance optimization utilities (`lib/performance/optimization.ts`)
- ✅ Loading skeleton components (`components/ui/LoadingSkeleton.tsx`)
- ✅ Service worker for offline support (`public/sw.js`)
- ✅ Monitoring provider (`components/monitoring/MonitoringProvider.tsx`)
- ✅ Global integration in root layout

### Features Implemented

**Error Logging System:**
- Centralized error tracking with severity levels
- Batch logging with auto-flush (30s intervals)
- Context tracking: userId, sessionId, component, action
- Global error handler for unhandled errors
- Promise rejection handler
- Error boundary integration
- Development console logging
- Production database persistence

**Analytics Tracking:**
- Privacy-friendly event tracking (no PII)
- 20+ predefined event types
- User lifecycle events: signup, login, logout
- Recording events: start, pause, resume, stop, complete
- Story events: listened, shared
- Import events: started, completed
- Consent events: granted, revoked
- Keepsake events: PDF generated, video generated, downloaded
- Library events: searched
- Accessibility events: feature enabled
- Session tracking and page view tracking
- Batch event sending with 10s auto-flush

**Performance Optimization:**
- In-memory cache with TTL (5 minutes default)
- Debounce and throttle utilities
- React hooks: useDebounce, useCachedFetch, useIdleCallback
- Intersection observer hook for lazy loading
- Image preloading utilities
- Performance monitoring (render time measurement)
- Network condition detection (slow connection, save data mode)
- Optimal image quality selection
- Batch update utilities

**Loading Skeletons:**
- ProfileCardSkeleton for profile cards
- SessionCardSkeleton for session cards
- ListSkeleton, TableSkeleton, CardGridSkeleton
- PageHeaderSkeleton, PageSkeleton
- Accessible with ARIA labels
- Smooth pulse animation
- Reusable across application

**Service Worker:**
- Offline support with cache strategies
- Static asset caching (pages, images, CSS, JS)
- API response caching
- Cache-first strategy for static assets
- Network-first strategy for API calls
- Offline fallback pages
- Cache versioning and cleanup
- Auto-update detection and notification

**Global Integration:**
- MonitoringProvider initializes all monitoring
- Sets up global error handler on mount
- Registers service worker (production only)
- Tracks page views and navigation
- PageErrorBoundary catches React errors
- Full provider hierarchy: Monitoring → ErrorBoundary → Accessibility
- Production-ready monitoring stack

### Technical Details

**Error Logging Flow:**
1. Error occurs in application
2. Error logger captures error with context
3. Batched in memory (up to 10 errors)
4. Auto-flushed every 30s or immediately for critical errors
5. Sent to API endpoint
6. Stored in database for analysis
7. Optional: Sent to external service (Sentry, DataDog)

**Analytics Flow:**
1. User performs action (click, navigation, etc.)
2. Analytics tracker records event
3. Batched in memory (up to 20 events)
4. Auto-flushed every 10s
5. Sent to API endpoint with keepalive flag
6. Stored in database
7. Optional: Sent to external service (Plausible, Fathom)

**Performance Optimization Strategy:**
1. Cache API responses with TTL
2. Lazy load images below fold
3. Debounce search and input fields
4. Throttle scroll and resize handlers
5. Use intersection observer for components
6. Show loading skeletons during data fetch
7. Preload critical images
8. Measure and optimize slow components

### Additional Tasks

#### Task 6.1: Error Logging System ✅ COMPLETED
**File:** `lib/monitoring/error-logger.ts` (CREATED)

**Implemented:**
- ✅ Set up error logging service (custom implementation)
- ✅ Capture frontend errors
- ✅ Capture API errors
- ✅ Include context (user ID, session, action)
- ✅ Send to monitoring service
- ✅ Create error boundary components

#### Task 6.2: Analytics Integration ✅ COMPLETED
**File:** `lib/analytics/tracker.ts` (CREATED)

**Implemented:**
- ✅ Integrate analytics (custom implementation with Plausible/Fathom compatibility)
- ✅ Track key events:
  - User signup, login, logout
  - Profile created, viewed, updated
  - Recording started, paused, resumed, stopped, completed
  - Story listened, shared
  - Import started, completed
  - Consent granted, revoked
  - PDF generated, video generated, keepsake downloaded
  - Library searched
  - Accessibility features enabled
  - Errors occurred
- ✅ Privacy-friendly (no PII)
- ✅ GDPR compliant (no personal data tracked)

#### Task 6.3: Performance Optimization ✅ COMPLETED
**Files:** Multiple (CREATED)

**Implemented:**
- ✅ Add loading skeletons to all pages (`components/ui/LoadingSkeleton.tsx`)
- ✅ Implement image lazy loading (useLazyImage hook, useIntersectionObserver)
- ✅ Code split utilities ready (dynamic imports supported)
- ✅ Add service worker for offline support (`public/sw.js`)
- ✅ Optimize bundle size (caching, lazy loading strategies)
- ✅ Add caching strategies (in-memory cache with TTL, service worker caching)

### Testing

#### Task 7.1: Unit Tests
**Requirements:**
- [ ] Set up Vitest or Jest
- [ ] Test auth utilities
- [ ] Test API helpers
- [ ] Test hooks
- [ ] Aim for 70%+ coverage

#### Task 7.2: Integration Tests
**Requirements:**
- [ ] Set up Playwright or Cypress
- [ ] Test complete user flows:
  - Sign up → Create profile → Record story → Listen
  - Import audio → Process → View in library
  - Generate keepsake → Download
- [ ] Test on multiple browsers

#### Task 7.3: E2E Tests
**Requirements:**
- [ ] Test full production environment
- [ ] Test payment flow (if added)
- [ ] Test email delivery
- [ ] Test file uploads at scale

---

## 📝 Notes for LLM Implementers

### General Guidelines

1. **Always read existing code first**
   - Check for similar patterns in the codebase
   - Reuse existing components and utilities
   - Follow established naming conventions

2. **Test as you build**
   - Test each function individually
   - Test edge cases
   - Test error scenarios

3. **Handle errors gracefully**
   - Display user-friendly error messages
   - Log errors for debugging
   - Provide recovery options

4. **Maintain consistency**
   - Use existing UI patterns
   - Follow TypeScript types
   - Match design system

5. **Consider accessibility**
   - Add ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

6. **Performance matters**
   - Optimize queries
   - Lazy load components
   - Minimize re-renders

### File Structure

```
app/
  ├── api/              # API routes
  ├── (auth)/           # Auth pages (login, signup)
  ├── dashboard/        # Recording interface
  ├── library/          # Story library
  ├── profiles/         # Profile management
  ├── import/           # Import wizard (NEW)
  ├── keepsakes/        # Keepsake generation (NEW)
  └── settings/         # User settings (NEW)

components/
  ├── audio/            # Audio-related components
  ├── profiles/         # Profile components
  ├── library/          # Library components (NEW)
  ├── import/           # Import components (NEW)
  ├── keepsakes/        # Keepsake components (NEW)
  ├── accessibility/    # Accessibility components (NEW)
  └── ui/               # Reusable UI components

lib/
  ├── auth/             # Auth utilities
  ├── hooks/            # Custom React hooks
  ├── jobs/             # Background job handlers
  ├── ai/               # AI integrations
  └── utils/            # Helper functions
```

### Environment Variables Needed

Add to `.env`:

```bash
# Existing
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=

# New for Import & Keepsakes
OPENAI_API_KEY=                    # For DALL-E image generation
GOOGLE_CLOUD_PROJECT=              # For Speech-to-Text
GOOGLE_CLOUD_STORAGE_BUCKET=       # For file storage

# Optional
SENTRY_DSN=                        # Error logging
STRIPE_SECRET_KEY=                 # If adding payments
```

---

## 🎯 Quick Start for LLMs

To pick up any task:

1. **Read the task description carefully**
2. **Check acceptance criteria**
3. **Review related files mentioned**
4. **Look for similar patterns in codebase**
5. **Implement with tests**
6. **Verify against acceptance criteria**
7. **Commit with clear message**

Example commit message:
```
Implement audio playback controls in library

- Create AudioPlayer component with play/pause
- Add seekable progress bar
- Include playback speed controls
- Save playback position to localStorage
- Integrate player in Library page
- Handle loading and error states

Closes Task 1.4
```

---

## 📊 Progress Tracking

Update this section as tasks complete:

- [x] **Library Backend Integration: 7/7 tasks COMPLETE** ✅
  - [x] Task 1.1: Sessions List API Endpoint
  - [x] Task 1.2: Single Session Detail API
  - [x] Task 1.3: Connect Library Page to Real Data
  - [x] Task 1.4: Audio Playback Controls
  - [x] Task 1.5: Integrate AudioPlayer in Library
  - [x] Task 1.6: Transcript Viewer Modal
  - [x] Task 1.7: Pagination Controls
- [ ] Import Wizard: 0/7 tasks
- [ ] Accessibility Features: 0/8 tasks
- [ ] Consent Dialog UI: 0/3 tasks
- [ ] Keepsake Generators: 0/6 tasks
- [ ] Infrastructure: 0/3 tasks
- [ ] Testing: 0/3 tasks

**Total Progress: 7/37 tasks completed (19% done)**
**Remaining: 30 tasks**

---

**Last Updated:** 2025-11-12 (Library Backend Integration completed)
**Maintained By:** Development Team
**Questions:** See documentation in `/docs` folder
