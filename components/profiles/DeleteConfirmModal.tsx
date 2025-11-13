/**
 * Delete Confirmation Modal
 * Confirm profile deletion with safety checks
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

interface DeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileName: string
  sessionCount: number
  onConfirm: () => Promise<void>
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  profileName,
  sessionCount,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Delete Profile?">
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Warning Message */}
          <div className="text-center">
            <p className="text-gray-900 font-medium mb-2">
              Are you sure you want to delete{' '}
              <span className="font-bold">{profileName}</span>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </div>

          {/* Session Warning */}
          {sessionCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Warning: This profile has {sessionCount} recorded{' '}
                    {sessionCount === 1 ? 'session' : 'sessions'}
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Deleting this profile will also delete all associated recordings,
                    transcripts, and voice models.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
