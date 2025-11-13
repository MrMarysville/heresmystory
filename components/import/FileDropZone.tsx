/**
 * File Drop Zone Component
 * Drag-and-drop file upload with validation and previews
 */

'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number // bytes
  acceptedTypes?: string[]
  multiple?: boolean
}

interface FileWithPreview extends File {
  preview?: string
  error?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
]

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function FileDropZone({
  onFilesSelected,
  maxFiles = 10,
  maxSizePerFile = 100 * 1024 * 1024, // 100MB
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  multiple = true,
}: FileDropZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `${file.name}: Unsupported file type. Please upload audio files only.`
    }

    if (file.size > maxSizePerFile) {
      return `${file.name}: File size exceeds ${formatFileSize(maxSizePerFile)} limit.`
    }

    return null
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    setError(null)
    const fileArray = Array.from(newFiles)

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. Please remove some files first.`)
      return
    }

    // Validate each file
    const validatedFiles: FileWithPreview[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        // Check for duplicates
        const isDuplicate = files.some((f) => f.name === file.name && f.size === file.size)
        if (isDuplicate) {
          errors.push(`${file.name} is already added.`)
        } else {
          validatedFiles.push(file as FileWithPreview)
        }
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '))
    }

    if (validatedFiles.length > 0) {
      const updatedFiles = [...files, ...validatedFiles]
      setFiles(updatedFiles)
      onFilesSelected(updatedFiles)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    handleFiles(droppedFiles)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
    setError(null)
  }

  const handleClearAll = () => {
    setFiles([])
    onFilesSelected([])
    setError(null)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-indigo-600' : 'bg-gray-200'
          }`}>
            <svg
              className={`w-10 h-10 ${isDragOver ? 'text-white' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {isDragOver ? 'Drop files here' : 'Drag and drop audio files'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              or <span className="text-indigo-600 font-medium">browse</span> from your computer
            </p>
            <p className="text-xs text-gray-500">
              Supports MP3, WAV, M4A, AAC • Max {formatFileSize(maxSizePerFile)} per file • Up to {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </h3>
              <p className="text-sm text-gray-600">Total size: {formatFileSize(totalSize)}</p>
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                {/* File Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
