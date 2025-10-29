"use client"
import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { uploadProofImage } from '../../../utils/storage';
import { useAuth } from '../../../hooks/useAuth';

interface ProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  date: string;
  onSubmitSuccess: () => void;
  onSubmit: (imageUrl: string, description?: string, imagePath?: string) => Promise<{ success: boolean; message: string }>;
}

const ProofUploadModal: React.FC<ProofUploadModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  date,
  onSubmitSuccess,
  onSubmit
}) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Parse 'YYYY-MM-DD' in local time to avoid UTC shifting
  const parseLocalDate = (dateStr: string): Date => {
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
    if (m) {
      const y = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);
      return new Date(y, month - 1, day);
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleImageUpload = async (file: File, onProgress: any) => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }
    
    return await uploadProofImage(file, user.id, challengeId, onProgress);
  };

  const handleSubmit = async () => {
    if (!imageUrl) {
      setError('Please upload a proof image');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await onSubmit(imageUrl, description.trim() || undefined, imagePath);
      
      if (result.success) {
        onSubmitSuccess();
        onClose();
        // Reset form
        setImageUrl('');
        setDescription('');
        setImagePath(undefined);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setImageUrl('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Upload Proof</h2>
            <p className="text-sm text-gray-400 mt-1">{challengeTitle}</p>
            <p className="text-sm text-blue-400">{formatDate(date)}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Proof Image *
            </label>
            <ImageUpload
              onUpload={async (file, onProgress) => {
                const result = await handleImageUpload(file, onProgress);
                if (result.success && result.url) {
                  setImageUrl(result.url);
                  if (result.path) {
                    setImagePath(result.path);
                  }
                }
                return result;
              }}
              currentImageUrl={imageUrl}
              placeholder="Upload your daily proof"
              maxSize={10}
              className="max-w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-[#252329] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5757] focus:border-transparent"
              placeholder="Add any notes about your progress today..."
              disabled={isSubmitting}
            />
          </div>

          {/* Guidelines */}
          <div className="bg-[#252329] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-2">📋 Submission Guidelines</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Upload a clear image showing your daily progress</li>
              <li>• Make sure the image is relevant to today&apos;s challenge</li>
              <li>• Add a description to provide context if needed</li>
              <li>• Your submission will be reviewed by an admin</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!imageUrl || isSubmitting}
            className="flex-1 py-2 px-4 bg-[#FF5757] text-white rounded-lg font-medium hover:bg-[#FF5757]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Proof'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofUploadModal; 