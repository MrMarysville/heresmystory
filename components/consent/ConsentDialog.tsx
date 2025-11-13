/**
 * Consent Dialog Component
 * Multi-step dialog for obtaining voice training consent
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/Dialog'

interface ConsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileId: string
  profileName: string
  onConsentGranted: () => void
}

type ConsentStep = 'introduction' | 'terms' | 'review' | 'confirm'

const CONSENT_VERSION = '1.0.0'

const CONSENT_TEXT = `Voice Training Consent

By providing this consent, you agree to:

1. Purpose: Your voice recordings will be used to create a synthetic voice model that can speak in your voice.

2. Data Usage:
   - Your audio recordings will be processed and stored securely
   - The resulting voice model will be used exclusively for retelling your stories to family members
   - Your voice data will never be shared with third parties without explicit additional consent
   - Your voice model will not be used for commercial purposes

3. Storage & Security:
   - Audio samples are encrypted at rest and in transit
   - Voice models are stored securely in isolated cloud infrastructure
   - Access to your voice model is restricted to authorized family members only

4. Your Rights:
   - You can revoke this consent at any time
   - Upon revocation, your voice model will be permanently deleted within 30 days
   - You can request a copy of all your voice data at any time
   - You can review and approve any synthesized speech before it is shared

5. Quality & Accuracy:
   - We will use 15-40 minutes of your voice recordings to create the model
   - The quality of the synthetic voice depends on the quality and variety of your recordings
   - The model may not perfectly replicate your voice in all situations

6. Watermarking:
   - All synthesized speech will include an inaudible watermark
   - An optional audible disclosure can be enabled for playback

By clicking "I Agree," you acknowledge that you have read, understood, and agree to these terms.

Version: ${CONSENT_VERSION}
Last Updated: ${new Date().toISOString().split('T')[0]}`

export function ConsentDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
  onConsentGranted,
}: ConsentDialogProps) {
  const [currentStep, setCurrentStep] = useState<ConsentStep>('introduction')
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    const steps: ConsentStep[] = ['introduction', 'terms', 'review', 'confirm']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: ConsentStep[] = ['introduction', 'terms', 'review', 'confirm']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    if (!agreed) {
      setError('You must agree to the terms to continue')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/voice/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          agreed: true,
          ipAddress: '', // Server will capture this
          userAgent: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save consent')
      }

      // Success
      onConsentGranted()
      onOpenChange(false)

      // Reset state for next time
      setCurrentStep('introduction')
      setAgreed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consent')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'introduction':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">
                What is Voice Training?
              </h3>
              <p className="text-sm text-indigo-700">
                Voice training creates a digital model of {profileName}&apos;s voice. This allows
                the app to retell their stories in their own voice, preserving the unique
                sound and character of their speech for future generations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Preserve Their Voice</h4>
                  <p className="text-sm text-gray-600">
                    Future generations can hear stories in {profileName}&apos;s actual voice
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Secure & Private</h4>
                  <p className="text-sm text-gray-600">
                    Voice data is encrypted and only used for family storytelling
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Full Control</h4>
                  <p className="text-sm text-gray-600">
                    Revoke consent anytime and voice model will be deleted
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-1">
                📋 What&apos;s Required
              </h4>
              <p className="text-sm text-amber-700">
                We need 15-40 minutes of {profileName}&apos;s voice recordings to create
                a high-quality voice model. The app will guide you through the recording process.
              </p>
            </div>
          </div>
        )

      case 'terms':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please read the following terms carefully before proceeding.
            </p>
            <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {CONSENT_TEXT}
              </pre>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> You can scroll through the terms above. Take your time
                to read and understand all sections.
              </p>
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-4">
            <p className="text-gray-700">
              Before we proceed, let&apos;s review what you&apos;re agreeing to:
            </p>

            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✓ Voice Model Creation</h4>
                <p className="text-sm text-gray-600">
                  {profileName}&apos;s voice recordings will be used to create a synthetic voice
                  model for storytelling purposes only.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✓ Data Security</h4>
                <p className="text-sm text-gray-600">
                  All voice data will be encrypted, stored securely, and never shared with
                  third parties without explicit consent.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✓ Your Rights</h4>
                <p className="text-sm text-gray-600">
                  You can revoke consent at any time, request data deletion, or obtain
                  a copy of all voice data.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✓ Quality & Limitations</h4>
                <p className="text-sm text-gray-600">
                  15-40 minutes of recordings are needed. The synthetic voice may not
                  perfectly replicate {profileName}&apos;s voice in all situations.
                </p>
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Final Confirmation
              </h3>
              <p className="text-gray-600">
                You&apos;re about to grant consent for voice training for <strong>{profileName}</strong>.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 flex-1">
                  I have read, understood, and agree to the Voice Training Consent terms.
                  I understand that {profileName}&apos;s voice recordings will be used to create
                  a synthetic voice model, and I acknowledge all the terms, rights, and
                  limitations outlined in this agreement.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Consent Version:</strong> {CONSENT_VERSION}<br />
                <strong>Date:</strong> {new Date().toLocaleDateString()}<br />
                <strong>Profile:</strong> {profileName}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'introduction':
        return 'Voice Training Consent'
      case 'terms':
        return 'Terms & Conditions'
      case 'review':
        return 'Review Your Agreement'
      case 'confirm':
        return 'Confirmation'
      default:
        return 'Voice Consent'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={getStepTitle()}>
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {(['introduction', 'terms', 'review', 'confirm'] as ConsentStep[]).map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-indigo-600 text-white'
                    : index < ['introduction', 'terms', 'review', 'confirm'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < ['introduction', 'terms', 'review', 'confirm'].indexOf(currentStep) ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < ['introduction', 'terms', 'review', 'confirm'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <div>
            {currentStep !== 'introduction' && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <DialogClose asChild>
              <button
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </DialogClose>
            {currentStep !== 'confirm' ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!agreed || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'I Agree'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
