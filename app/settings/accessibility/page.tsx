/**
 * Accessibility Settings Page
 * Comprehensive settings for text size, contrast, motion, and more
 */

'use client'

import { useAccessibility } from '@/contexts/AccessibilityContext'
import { useState } from 'react'

export default function AccessibilitySettingsPage() {
  const { settings, updateSettings, resetSettings, isLoading } = useAccessibility()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleTextSizeChange = (size: 'normal' | 'large' | 'x-large') => {
    updateSettings({ textSize: size })
  }

  const toggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] })
  }

  const handleReset = async () => {
    await resetSettings()
    setShowResetConfirm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading accessibility settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Accessibility Settings
          </h1>
          <p className="text-gray-600">
            Customize the app to meet your accessibility needs. All settings are saved automatically.
          </p>
        </div>

        {/* Text Size */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Text Size</h2>
          <p className="text-gray-600 mb-4">
            Choose a comfortable text size for reading.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleTextSizeChange('normal')}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.textSize === 'normal'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={settings.textSize === 'normal'}
            >
              <div className="text-base font-medium mb-1">Normal</div>
              <div className="text-sm text-gray-500">16px</div>
            </button>
            <button
              onClick={() => handleTextSizeChange('large')}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.textSize === 'large'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={settings.textSize === 'large'}
            >
              <div className="text-lg font-medium mb-1">Large</div>
              <div className="text-sm text-gray-500">18px</div>
            </button>
            <button
              onClick={() => handleTextSizeChange('x-large')}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.textSize === 'x-large'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={settings.textSize === 'x-large'}
            >
              <div className="text-xl font-medium mb-1">Extra Large</div>
              <div className="text-sm text-gray-500">20px</div>
            </button>
          </div>
        </div>

        {/* Visual Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Visual Settings</h2>

          <div className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">High Contrast Mode</h3>
                <p className="text-sm text-gray-600">
                  Increases contrast between text and background for better visibility.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('highContrast')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Focus Indicators */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Enhanced Focus Indicators</h3>
                <p className="text-sm text-gray-600">
                  Shows clear visual indicators when navigating with keyboard.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('focusIndicators')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.focusIndicators ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.focusIndicators}
                aria-label="Toggle focus indicators"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Button Labels */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Show Button Labels</h3>
                <p className="text-sm text-gray-600">
                  Displays text labels next to icon-only buttons for clarity.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('buttonLabels')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.buttonLabels ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.buttonLabels}
                aria-label="Toggle button labels"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.buttonLabels ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Motion Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Motion Settings</h2>

          <div className="space-y-4">
            {/* Reduced Motion */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Reduced Motion</h3>
                <p className="text-sm text-gray-600">
                  Minimizes animations and transitions. Recommended for users sensitive to motion.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('reducedMotion')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reducedMotion ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.reducedMotion}
                aria-label="Toggle reduced motion"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Slow Mode */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Slow Mode</h3>
                <p className="text-sm text-gray-600">
                  Slows down animations for easier comprehension. Cannot be used with Reduced Motion.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('slowMode')}
                disabled={settings.reducedMotion}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.slowMode ? 'bg-indigo-600' : 'bg-gray-300'
                } ${settings.reducedMotion ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={settings.slowMode}
                aria-label="Toggle slow mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.slowMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Navigation Settings</h2>

          <div className="space-y-4">
            {/* Keyboard Navigation */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Keyboard Navigation</h3>
                <p className="text-sm text-gray-600">
                  Enables enhanced keyboard shortcuts and navigation.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('keyboardNav')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.keyboardNav ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.keyboardNav}
                aria-label="Toggle keyboard navigation"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.keyboardNav ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Screen Reader */}
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Screen Reader Optimizations</h3>
                <p className="text-sm text-gray-600">
                  Optimizes the interface for screen reader users.
                </p>
              </div>
              <button
                onClick={() => toggleSetting('screenReader')}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.screenReader ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.screenReader}
                aria-label="Toggle screen reader optimizations"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reset Settings</h2>
          <p className="text-gray-600 mb-4">
            Restore all accessibility settings to their default values.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset to Defaults
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-700 font-medium">
                Are you sure? This cannot be undone.
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
