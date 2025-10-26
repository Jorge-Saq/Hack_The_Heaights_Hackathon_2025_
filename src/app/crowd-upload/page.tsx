'use client'

import { useState, useCallback } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { useRouter } from 'next/navigation'
import { uploadEventPhoto } from '../../lib/upload'

export default function CrowdUploadPage() {
  const { user } = useAuthenticator()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [dragActive, setDragActive] = useState(false)
  const [eventId, setEventId] = useState('')

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      const imageFiles = newFiles.filter(file =>
        file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
      )
      setFiles(prev => [...prev, ...imageFiles])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const imageFiles = newFiles.filter(file =>
        file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
      )
      setFiles(prev => [...prev, ...imageFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0 || !user) {
      alert('Please select at least one photo and ensure you are logged in.')
      return
    }

    if (!eventId.trim()) {
      alert('Please enter an event name or ID.')
      return
    }

    setUploading(true)
    setUploadProgress({})
    const uploadPromises: Promise<void>[] = []

    try {
      const userEmail = (user as any).attributes?.email || user.username

      for (const file of files) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        const uploadPromise = uploadEventPhoto(file, eventId, userEmail, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        })
          .then(() => {
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          })
          .catch(error => {
            console.error(`Error uploading ${file.name}:`, error)
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 }))
            throw new Error(`Failed to upload ${file.name}`)
          })

        uploadPromises.push(uploadPromise)
      }

      await Promise.all(uploadPromises)

      const failedUploads = Object.values(uploadProgress).some(p => p === -1)
      if (failedUploads) {
        alert('One or more uploads failed. Please check the console and try again.')
      } else {
        alert('🎉 Crowd photos uploaded successfully! Users will be notified if they are detected.')
        setFiles([])
        setEventId('')
        setUploadProgress({})
      }
    } catch (error) {
      console.error('Overall upload process error:', error)
      alert('An unexpected error occurred during upload. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Upload Crowd Photos
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Upload event or group photos. We'll automatically detect and notify people who appear in them!
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Event ID Input */}
            <div className="mb-6">
              <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name or ID *
              </label>
              <input
                type="text"
                id="eventId"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="e.g., Birthday Party 2025, Conference Day 1, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                This helps organize photos from the same event
              </p>
            </div>

            {/* Dropzone */}
            <div
              className={`upload-dropzone border-2 border-dashed rounded-lg py-8 px-6 text-center transition-colors duration-200 cursor-pointer hover:border-blue-600 hover:bg-blue-50 ${
                dragActive ? 'border-blue-700 bg-blue-100' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('crowd-file-upload')?.click()}
            >
              <div className="space-y-2 pointer-events-none">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  width="64"
                  height="64"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <span className="mt-2 block text-sm font-semibold text-gray-700">
                    Drop crowd photos here or click to upload
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, JPEG only. Multiple photos allowed.
                  </span>
                  <input
                    id="crowd-file-upload"
                    name="crowd-file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileInput}
                  />
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Selected Files ({files.length})
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={uploading}
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Photo Preview */}
                      <div className="aspect-square relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />

                        {/* Progress Bar */}
                        {uploadProgress[file.name] !== undefined && uploadProgress[file.name] >= 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
                            <div
                              className={`h-1 transition-all duration-300 ${
                                uploadProgress[file.name] === 100 ? 'bg-green-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                        )}

                        {/* Error Indicator */}
                        {uploadProgress[file.name] === -1 && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">Error</span>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-2 text-center">
                        <p className="text-xs text-gray-600 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={uploadFiles}
                disabled={files.length === 0 || !eventId.trim() || uploading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading ({Object.values(uploadProgress).filter(p => p === 100).length}/
                    {files.length})...
                  </span>
                ) : (
                  `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
