/**
 * Consent Status Component
 * Displays consent status and allows revocation
 */

'use client'

import { useState } from 'react'

interface ConsentRecord {
  id: string
  consentType: string
  version: string
  grantedAt: string
  revokedAt: string | null
  ipAddress: string
  userAgent: string
}

interface ConsentStatusProps {
  profileId: string
  profileName: string
  consent: ConsentRecord | null
  onConsentChange: () => void
  onRequestConsent: () => void
}

export function ConsentStatus({
  profileId,
  profileName,
  consent,
  onConsentChange,
  onRequestConsent,
}: ConsentStatusProps) {
  const [isRevoking, setIsRevoking] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasActiveConsent = consent && !consent.revokedAt

  const handleRevoke = async () => {
    setIsRevoking(true)
    setError(null)

    try {
      const response = await fetch(`/api/voice/consent?profileId=${profileId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to revoke consent')
      }

      // Success
      onConsentChange()
      setShowRevokeConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent')
    } finally {
      setIsRevoking(false)
    }
  }

  if (!consent || consent.revokedAt) {
    // No consent or revoked
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Voice Training Not Enabled
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Voice training consent is required to create a synthetic voice model for {profileName}.
              This allows the app to retell their stories in their own voice.
            </p>
            <button
              onClick={onRequestConsent}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Grant Voice Consent
            </button>
            {consent?.revokedAt && (
              <p className="text-xs text-amber-600 mt-2">
                Previously revoked on {new Date(consent.revokedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Active consent
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-1">
            Voice Training Enabled
          </h3>
          <p className="text-sm text-green-700 mb-2">
            Voice training consent has been granted for {profileName}. Their voice recordings
            can be used to create a synthetic voice model.
          </p>

          <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-gray-600">Granted Date:</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(consent.grantedAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Consent Version:</dt>
                <dd className="font-medium text-gray-900">{consent.version}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Consent Type:</dt>
                <dd className="font-medium text-gray-900">
                  {consent.consentType.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium text-green-700">Active</dd>
              </div>
            </dl>
          </div>

          {!showRevokeConfirm ? (
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Revoke Consent
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium mb-2">
                Are you sure you want to revoke voice training consent?
              </p>
              <p className="text-xs text-red-700 mb-3">
                This will permanently delete {profileName}&apos;s voice model within 30 days.
                This action cannot be undone.
              </p>
              {error && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                >
                  {isRevoking ? 'Revoking...' : 'Yes, Revoke'}
                </button>
                <button
                  onClick={() => {
                    setShowRevokeConfirm(false)
                    setError(null)
                  }}
                  disabled={isRevoking}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
