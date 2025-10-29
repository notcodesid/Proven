"use client"
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { UploadProgress } from '../../../utils/storage';

interface ImageUploadProps {
  onUpload: (file: File, onProgress: (progress: UploadProgress) => void) => Promise<{ success: boolean; url?: string; error?: string }>;
  currentImageUrl?: string;
  placeholder?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  currentImageUrl,
  placeholder = "Click to upload image",
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImageUrl prop changes
  useEffect(() => {
    if (currentImageUrl && currentImageUrl !== previewUrl) {
      setPreviewUrl(currentImageUrl);
      setError(''); // Clear any previous errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Clean up previous blob URL if it exists and is a blob
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Only ${acceptedTypes.join(', ')} are allowed.`);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Show preview immediately
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    // Upload file
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await onUpload(file, (progress) => {
        setUploadProgress(progress.progress);
      });

      if (result.success) {
        // If URL provided, use it for preview (public URLs or signed URLs)
        if (result.url) {
          setPreviewUrl(result.url);
          URL.revokeObjectURL(fileUrl);
        }
        // Note: parent component will use result.path for backend submission if provided
      } else {
        setError(result.error || 'Upload failed');
        setPreviewUrl(currentImageUrl || '');
        URL.revokeObjectURL(fileUrl);
      }
    } catch (error) {
      setError('Upload failed');
      setPreviewUrl(currentImageUrl || '');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${disabled || uploading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized={previewUrl.includes('supabase.co')} // Skip Next.js optimization for Supabase images during debugging
                onError={(e) => {
                  // Wait a moment and try to reload once (in case of timing issue)
                  setTimeout(() => {
                    const img = new window.Image();
                    img.onload = () => {
                      // Image is now available, update preview
                      setPreviewUrl(previewUrl); // Force re-render
                      setError('');
                    };
                    img.onerror = (retryError) => {
                      setPreviewUrl('');
                      setError('Preview unavailable. Please re-upload the image.');
                    };
                    img.src = previewUrl;
                  }, 3000); // Wait 3 seconds before retry
                }}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-sm">
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Click to change image'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedTypes.join(', ')} up to {maxSize}MB
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}; 