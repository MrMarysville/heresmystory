/**
 * Import Wizard Page
 * Multi-step wizard for importing existing audio recordings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/client-utils'
import { FileDropZone } from '@/components/import/FileDropZone'
import { ProcessingView } from '@/components/import/ProcessingView'

type Step = 'select-profile' | 'upload' | 'processing' | 'complete'

interface Profile {
  id: string
  displayName: string
  relation: string | null
  colorTheme: string
}

interface ImportSession {
  id: string
  filename: string
  jobId: string
  status: string
}

export default function ImportPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('select-profile')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [importSessions, setImportSessions] = useState<ImportSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication and load profiles
  useEffect(() => {
    async function loadData() {
      const { user, error } = await getCurrentUser()
      if (error || !user) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch('/api/profiles')
        if (response.ok) {
          const data = await response.json()
          setProfiles(data)
        }
      } catch (error) {
        console.error('Error loading profiles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfile(profileId)
    setCurrentStep('upload')
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (!selectedProfile || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('profileId', selectedProfile)

      for (const file of selectedFiles) {
        formData.append('files', file)
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to upload files')
      }

      // Store import sessions for tracking
      setImportSessions(data.data.files)
      setCurrentStep('processing')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const handleProcessingComplete = () => {
    setCurrentStep('complete')
  }

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('select-profile')
      setSelectedFiles([])
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-profile':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Profile</h2>
              <p className="text-gray-600">
                Choose which family member these recordings belong to
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profiles Yet</h3>
                <p className="text-gray-600 mb-6">Create a profile first before importing recordings</p>
                <Link
                  href="/profiles"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Profile
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile.id)}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-indigo-600 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: profile.colorTheme }}
                      >
                        {profile.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{profile.displayName}</h3>
                        {profile.relation && <p className="text-sm text-gray-600">{profile.relation}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 'upload':
        const selectedProfileData = profiles.find((p) => p.id === selectedProfile)
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: selectedProfileData?.colorTheme }}
                >
                  {selectedProfileData?.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Audio Files</h2>
                  <p className="text-gray-600">for {selectedProfileData?.displayName}</p>
                </div>
              </div>
            </div>

            <FileDropZone onFilesSelected={handleFilesSelected} />

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={isUploading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : (
                  `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`
                )}
              </button>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Imports</h2>
              <p className="text-gray-600">
                Please wait while we process your audio files
              </p>
            </div>

            <ProcessingView
              sessions={importSessions}
              profileId={selectedProfile!}
              onComplete={handleProcessingComplete}
            />
          </div>
        )

      case 'complete':
        const selectedProfileDataComplete = profiles.find((p) => p.id === selectedProfile)
        const successCount = importSessions.length
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Import Complete!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Successfully imported {successCount} {successCount === 1 ? 'recording' : 'recordings'} for{' '}
                {selectedProfileDataComplete?.displayName}
              </p>

              <div className="flex gap-4 justify-center">
                <Link
                  href={`/library?profile=${selectedProfile}`}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg"
                >
                  View Imported Stories
                </Link>
                <button
                  onClick={() => {
                    setCurrentStep('select-profile')
                    setSelectedProfile(null)
                    setSelectedFiles([])
                    setImportSessions([])
                  }}
                  className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
                >
                  Import More
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const steps: Step[] = ['select-profile', 'upload', 'processing', 'complete']
  const currentStepIndex = steps.indexOf(currentStep)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Import Audio Files</h1>
          <p className="text-lg text-gray-600">
            Upload existing recordings to preserve them in your family's story collection
          </p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            {['Select Profile', 'Upload Files', 'Processing', 'Complete'].map((label, index) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs text-gray-600 text-center">{label}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">{renderStepContent()}</div>
      </div>
    </div>
  )
}
