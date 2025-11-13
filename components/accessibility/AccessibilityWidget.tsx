/**
 * Accessibility Widget - Floating Quick Access Controls
 * Provides quick access to key accessibility settings from anywhere in the app
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccessibility } from '@/contexts/AccessibilityContext'
import Link from 'next/link'

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSettings } = useAccessibility()

  const toggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] })
  }

  // Keyboard shortcut to open/close widget (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        {isOpen && <span className="sr-only">Close accessibility menu</span>}
        {!isOpen && <span className="sr-only">Open accessibility menu</span>}
      </button>

      {/* Overlay Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-6 w-80 max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-label="Quick accessibility settings"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Text Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateSettings({ textSize: 'normal' })}
                  className={`p-2 text-xs rounded border transition-colors ${
                    settings.textSize === 'normal'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  aria-pressed={settings.textSize === 'normal'}
                >
                  Normal
                </button>
                <button
                  onClick={() => updateSettings({ textSize: 'large' })}
                  className={`p-2 text-sm rounded border transition-colors ${
                    settings.textSize === 'large'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  aria-pressed={settings.textSize === 'large'}
                >
                  Large
                </button>
                <button
                  onClick={() => updateSettings({ textSize: 'x-large' })}
                  className={`p-2 text-base rounded border transition-colors ${
                    settings.textSize === 'x-large'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  aria-pressed={settings.textSize === 'x-large'}
                >
                  X-Large
                </button>
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <label htmlFor="quick-high-contrast" className="text-sm text-gray-700">
                  High Contrast
                </label>
                <button
                  id="quick-high-contrast"
                  onClick={() => toggleSetting('highContrast')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.highContrast ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <label htmlFor="quick-reduced-motion" className="text-sm text-gray-700">
                  Reduced Motion
                </label>
                <button
                  id="quick-reduced-motion"
                  onClick={() => toggleSetting('reducedMotion')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.reducedMotion}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Slow Mode */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="quick-slow-mode"
                  className={`text-sm ${
                    settings.reducedMotion ? 'text-gray-400' : 'text-gray-700'
                  }`}
                >
                  Slow Mode
                </label>
                <button
                  id="quick-slow-mode"
                  onClick={() => toggleSetting('slowMode')}
                  disabled={settings.reducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.slowMode ? 'bg-indigo-600' : 'bg-gray-300'
                  } ${settings.reducedMotion ? 'opacity-50 cursor-not-allowed' : ''}`}
                  role="switch"
                  aria-checked={settings.slowMode}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.slowMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <label htmlFor="quick-keyboard-nav" className="text-sm text-gray-700">
                  Keyboard Navigation
                </label>
                <button
                  id="quick-keyboard-nav"
                  onClick={() => toggleSetting('keyboardNav')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.keyboardNav ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.keyboardNav}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.keyboardNav ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <label htmlFor="quick-focus-indicators" className="text-sm text-gray-700">
                  Focus Indicators
                </label>
                <button
                  id="quick-focus-indicators"
                  onClick={() => toggleSetting('focusIndicators')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.focusIndicators ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.focusIndicators}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Screen Reader */}
              <div className="flex items-center justify-between">
                <label htmlFor="quick-screen-reader" className="text-sm text-gray-700">
                  Screen Reader Mode
                </label>
                <button
                  id="quick-screen-reader"
                  onClick={() => toggleSetting('screenReader')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.screenReader ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={settings.screenReader}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Full Settings Link */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/settings/accessibility"
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-2 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors"
              >
                All Settings
              </Link>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Tip:</strong> Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">/</kbd> to open this menu
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
