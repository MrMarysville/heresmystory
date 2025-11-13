/**
 * Profile Form Modal
 * Create or edit a profile
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'

interface Profile {
  id?: string
  displayName: string
  relation: string
  colorTheme: string
}

interface ProfileFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: Profile | null
  onSave: (profile: Omit<Profile, 'id'> & { id?: string }) => Promise<void>
}

const COLOR_OPTIONS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Teal', value: '#14b8a6' },
]

export function ProfileFormModal({ open, onOpenChange, profile, onSave }: ProfileFormModalProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [relation, setRelation] = useState(profile?.relation || '')
  const [colorTheme, setColorTheme] = useState(profile?.colorTheme || '#6366f1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!profile?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSave({
        ...(profile?.id && { id: profile.id }),
        displayName,
        relation,
        colorTheme,
      })

      // Reset form
      setDisplayName('')
      setRelation('')
      setColorTheme('#6366f1')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setDisplayName(profile?.displayName || '')
      setRelation(profile?.relation || '')
      setColorTheme(profile?.colorTheme || '#6366f1')
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent title={isEditing ? 'Edit Profile' : 'Create Profile'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Grandma Rose, Dad, Aunt Mary"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-gray-500">
              The name that will appear throughout the app
            </p>
          </div>

          {/* Relation */}
          <div>
            <label htmlFor="relation" className="block text-sm font-medium text-gray-700 mb-2">
              Relationship
            </label>
            <input
              id="relation"
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="e.g., Grandmother, Father, Aunt"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional: Their relation to you
            </p>
          </div>

          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avatar Color
            </label>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setColorTheme(color.value)}
                  className={`relative w-full aspect-square rounded-lg transition-all ${
                    colorTheme === color.value
                      ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  disabled={isSubmitting}
                  title={color.name}
                >
                  {colorTheme === color.value && (
                    <svg
                      className="absolute inset-0 m-auto w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: colorTheme }}
              >
                {displayName.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {displayName || 'Name Preview'}
                </p>
                {relation && (
                  <p className="text-sm text-gray-600">{relation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
