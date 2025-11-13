/**
 * Loading Skeleton Components
 * Placeholder UI while content loads
 */

'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

/**
 * Profile Card Skeleton
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-transparent">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />

        {/* Content */}
        <div className="flex-1">
          {/* Name */}
          <Skeleton className="h-6 w-32 mb-2" />

          {/* Stats */}
          <Skeleton className="h-4 w-48 mb-3" />

          {/* Buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Session Card Skeleton
 */
export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex-1">
          {/* Title */}
          <Skeleton className="h-6 w-3/4 mb-2" />

          {/* Meta */}
          <Skeleton className="h-4 w-1/2 mb-3" />

          {/* Summary */}
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-3" />

          {/* Tags */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        {/* Right side - buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * List Skeleton
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}

/**
 * Table Skeleton
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
  )
}

/**
 * Card Grid Skeleton
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton className="h-12 w-12 mb-4 rounded-full" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  )
}

/**
 * Full Page Skeleton
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-6xl">
        <PageHeaderSkeleton />
        <div className="space-y-6">
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
        </div>
      </div>
    </div>
  )
}
