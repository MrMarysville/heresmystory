/**
 * Keyboard Navigation Utilities
 * Helper functions for implementing accessible keyboard navigation
 */

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstElement?.focus()

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Handle escape key to close modals/menus
 */
export function useEscapeKey(callback: () => void) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }

  return () => {}
}

/**
 * Navigate through a list with arrow keys
 */
export function handleArrowNavigation(
  e: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onIndexChange: (newIndex: number) => void,
  options: {
    horizontal?: boolean
    wrap?: boolean
  } = {}
) {
  const { horizontal = false, wrap = true } = options

  const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown'
  const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp'

  if (e.key === nextKey) {
    e.preventDefault()
    const nextIndex = currentIndex + 1
    if (nextIndex < totalItems) {
      onIndexChange(nextIndex)
    } else if (wrap) {
      onIndexChange(0)
    }
  } else if (e.key === prevKey) {
    e.preventDefault()
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      onIndexChange(prevIndex)
    } else if (wrap) {
      onIndexChange(totalItems - 1)
    }
  } else if (e.key === 'Home') {
    e.preventDefault()
    onIndexChange(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    onIndexChange(totalItems - 1)
  }
}

/**
 * Create an accessible keyboard shortcut handler
 */
export function createKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  } = {}
): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    const { ctrl = false, shift = false, alt = false, meta = false } = options

    const ctrlMatch = ctrl ? e.ctrlKey : !e.ctrlKey
    const shiftMatch = shift ? e.shiftKey : !e.shiftKey
    const altMatch = alt ? e.altKey : !e.altKey
    const metaMatch = meta ? e.metaKey : !e.metaKey

    if (
      e.key.toLowerCase() === key.toLowerCase() &&
      ctrlMatch &&
      shiftMatch &&
      altMatch &&
      metaMatch
    ) {
      e.preventDefault()
      callback()
    }
  }
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements)
}

/**
 * Restore focus to the last focused element
 */
export class FocusManager {
  private lastFocusedElement: HTMLElement | null = null

  saveFocus() {
    this.lastFocusedElement = document.activeElement as HTMLElement
  }

  restoreFocus() {
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus()
      this.lastFocusedElement = null
    }
  }
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(prefers-contrast: more)').matches
  )
}
