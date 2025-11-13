/**
 * Accessibility Context Provider
 * Manages global accessibility settings and provides hooks for components
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AccessibilitySettings {
  textSize: 'normal' | 'large' | 'x-large'
  highContrast: boolean
  slowMode: boolean
  reducedMotion: boolean
  keyboardNav: boolean
  screenReader: boolean
  focusIndicators: boolean
  buttonLabels: boolean
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textSize: 'normal',
  highContrast: false,
  slowMode: false,
  reducedMotion: false,
  keyboardNav: true,
  screenReader: false,
  focusIndicators: true,
  buttonLabels: true,
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (updates: Partial<AccessibilitySettings>) => Promise<void>
  resetSettings: () => Promise<void>
  isLoading: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Apply settings to document
  useEffect(() => {
    applySettingsToDocument(settings)
  }, [settings])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/accessibility')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Not authenticated or error - use localStorage as fallback
        const saved = localStorage.getItem('accessibility-settings')
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
        }
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error)
      // Use localStorage fallback
      const saved = localStorage.getItem('accessibility-settings')
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
        } catch (e) {
          console.error('Error parsing saved settings:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)

    // Save to localStorage immediately
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings))

    // Try to save to backend (if authenticated)
    try {
      await fetch('/api/settings/accessibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
    } catch (error) {
      console.error('Error saving accessibility settings:', error)
      // Settings already saved to localStorage, so user won't lose them
    }
  }

  const resetSettings = async () => {
    await updateSettings(DEFAULT_SETTINGS)
  }

  const applySettingsToDocument = (settings: AccessibilitySettings) => {
    const root = document.documentElement

    // Text size
    root.classList.remove('text-normal', 'text-large', 'text-x-large')
    root.classList.add(`text-${settings.textSize}`)

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Slow mode (animations)
    if (settings.slowMode) {
      root.classList.add('slow-mode')
    } else {
      root.classList.remove('slow-mode')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Keyboard navigation
    if (settings.keyboardNav) {
      root.classList.add('keyboard-nav')
    } else {
      root.classList.remove('keyboard-nav')
    }

    // Screen reader optimizations
    if (settings.screenReader) {
      root.classList.add('screen-reader')
    } else {
      root.classList.remove('screen-reader')
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('focus-indicators')
    } else {
      root.classList.remove('focus-indicators')
    }

    // Button labels (show text labels on icon buttons)
    if (settings.buttonLabels) {
      root.classList.add('button-labels')
    } else {
      root.classList.remove('button-labels')
    }
  }

  return (
    <AccessibilityContext.Provider
      value={{ settings, updateSettings, resetSettings, isLoading }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}
