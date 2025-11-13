/**
 * Dialog Component
 * Accessible modal dialog using Radix UI
 */

'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export function DialogTrigger({ children, ...props }: { children: ReactNode; asChild?: boolean }) {
  return <DialogPrimitive.Trigger {...props}>{children}</DialogPrimitive.Trigger>
}

export function DialogContent({ children, title }: { children: ReactNode; title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
      <DialogPrimitive.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto z-50 focus:outline-none">
        <DialogPrimitive.Title className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogClose({ children, ...props }: { children: ReactNode }) {
  return <DialogPrimitive.Close {...props}>{children}</DialogPrimitive.Close>
}
