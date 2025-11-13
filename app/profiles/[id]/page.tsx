/**
 * Profile Detail Page
 * View and manage individual profile including voice consent
 */

'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/client-utils'
import { ConsentDialog } from '@/components/consent/ConsentDialog'
import { ConsentStatus } from '@/components/consent/ConsentStatus'

interface Profile {
  id: string
  displayName: string
  relation: string | null
  avatarUrl?: string | null
  colorTheme: string
  voiceModels?: Array<{ status: string }>
  _count?: { sessions: number }
  createdAt: string
  updatedAt: string
}

interface ConsentRecord {
  id: string
  consentType: string
  version: string
  grantedAt: string
  revokedAt: string | null
  ipAddress: string
  userAgent: string
}

export default function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consent, setConsent] = useState<ConsentRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConsent, setIsLoadingConsent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [consentDialogOpen, setConsentDialogOpen] = useState(false)

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const { user, error } = await getCurrentUser()
      if (error || !user) {
        router.push('/login')
        return
      }
    }
    checkAuth()
  }, [router])

  // Load profile
  useEffect(() => {
    loadProfile()
    loadConsent()
  }, [resolvedParams.id])

  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profiles/${resolvedParams.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found')
        }
        throw new Error('Failed to load profile')
      }

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const loadConsent = async () => {
    setIsLoadingConsent(true)

    try {
      const response = await fetch(`/api/voice/consent?profileId=${resolvedParams.id}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.hasConsent && data.data.consent) {
          // Fetch full consent details
          const consentResponse = await fetch(`/api/profiles/${resolvedParams.id}/consent`)
          if (consentResponse.ok) {
            const consentData = await consentResponse.json()
            setConsent(consentData)
          }
        } else {
          setConsent(null)
        }
      }
    } catch (err) {
      console.error('Error loading consent:', err)
      // Don't set error state, just log it
    } finally {
      setIsLoadingConsent(false)
    }
  }

  const handleConsentGranted = () => {
    loadConsent()
  }

  const handleConsentChange = () => {
    loadConsent()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error || 'Profile not found'}</p>
          <Link
            href="/profiles"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Profiles
          </Link>
        </div>
      </div>
    )
  }

  const hasVoiceModel = profile.voiceModels?.some((vm) => vm.status === 'READY')
  const sessionsCount = profile._count?.sessions || 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profiles"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profiles
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0"
              style={{ backgroundColor: profile.colorTheme }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.displayName}</h1>
              {profile.relation && (
                <p className="text-lg text-gray-600 mb-4">{profile.relation}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">
                    {sessionsCount} {sessionsCount === 1 ? 'Story' : 'Stories'}
                  </span>
                </div>
                {hasVoiceModel && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Voice Trained</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard?profile=${profile.id}`}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Record New Story
            </Link>
            <Link
              href={`/library?profile=${profile.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View Stories
            </Link>
          </div>
        </div>

        {/* Voice Training Consent Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Voice Training</h2>
          <p className="text-gray-600 mb-6">
            Voice training allows the app to create a synthetic voice model that can retell
            {' '}{profile.displayName}&apos;s stories in their own voice for future generations.
          </p>

          {isLoadingConsent ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600 text-sm">Loading consent status...</p>
            </div>
          ) : (
            <ConsentStatus
              profileId={profile.id}
              profileName={profile.displayName}
              consent={consent}
              onConsentChange={handleConsentChange}
              onRequestConsent={() => setConsentDialogOpen(true)}
            />
          )}
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Display Name</dt>
              <dd className="text-lg text-gray-900">{profile.displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Relation</dt>
              <dd className="text-lg text-gray-900">{profile.relation || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Color Theme</dt>
              <dd className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: profile.colorTheme }}
                />
                <span className="text-gray-900">{profile.colorTheme}</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
              <dd className="text-lg text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Consent Dialog */}
      <ConsentDialog
        open={consentDialogOpen}
        onOpenChange={setConsentDialogOpen}
        profileId={profile.id}
        profileName={profile.displayName}
        onConsentGranted={handleConsentGranted}
      />
    </div>
  )
}
