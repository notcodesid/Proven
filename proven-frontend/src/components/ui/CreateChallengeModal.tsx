"use client"
import React, { useState } from 'react';
import { createChallenge, CreateChallengeData } from '../../services/challengeService';
import { ImageUpload } from './ImageUpload';
import { uploadChallengeImage } from '../../../utils/storage';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Step 1: Basic Challenge Information
  title: string;
  description: string;
  category: string;
  duration: string;
  image: string;
  
  // Step 2: Participation & Rewards
  prizePool: number;
  status: string;
  participantLimit: number;
  
  // Step 3: Rules & Scheduling
  startDate: string;
  rules: string[];
}

const CATEGORIES = [
  'Fitness', 'Health', 'Learning', 'Productivity', 'Social', 'Creative', 'Financial', 'Tech'
];

const DURATIONS = [
  '1 day', '7 days', '14 days', '21 days', '30 days', 'Custom'
];

const STATUS_OPTIONS = [
  'Open', 'Private', 'Invite Only'
];

const PARTICIPANT_LIMITS = [
  10, 25, 50
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [customDays, setCustomDays] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    duration: '',
    image: '',
    prizePool: 10, // Default 10 USDC prize pool
    status: '',
    participantLimit: 100,
    startDate: '',
    rules: []
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File, onProgress: (progress: any) => void) => {
    return await uploadChallengeImage(file, onProgress);
  };

  // Calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, duration: string, customDaysValue?: string): string => {
    if (!startDate || !duration) return '';

    const start = new Date(startDate);
    let durationNumber: number;

    // Handle custom duration
    if (duration === 'Custom') {
      if (!customDaysValue) return '';
      durationNumber = parseInt(customDaysValue);
    } else {
      // Extract number from preset durations like "14 days"
      const durationParts = duration.split(' ');
      durationNumber = parseInt(durationParts[0] || '0');
    }

    if (isNaN(durationNumber) || durationNumber <= 0) return '';

    const end = new Date(start);
    end.setDate(end.getDate() + durationNumber);

    const isoString = end.toISOString().split('T');
    return isoString[0] || ''; // Format as YYYY-MM-DD
  };

  // Get the calculated end date
  const calculatedEndDate = calculateEndDate(formData.startDate, formData.duration, customDays);

  const addRule = () => {
    if (newRule.trim()) {
      updateFormData('rules', [...formData.rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    updateFormData('rules', formData.rules.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setStatusMessage('');

    try {
      // Step 1: Validate all inputs
      setStatusMessage('Validating inputs...');

      // Validate and parse duration
      let durationDays: number;
      let durationString: string;

      if (formData.duration === 'Custom') {
        // Use custom days input
        if (!customDays || customDays.trim() === '') {
          setError('Please enter the number of days for custom duration');
          return;
        }
        durationDays = parseInt(customDays, 10);
        if (isNaN(durationDays) || durationDays <= 0) {
          setError(`Invalid custom duration: ${customDays}. Must be a positive number.`);
          return;
        }
        if (durationDays > 365) {
          setError('Custom duration cannot exceed 365 days');
          return;
        }
        durationString = `${durationDays} ${durationDays === 1 ? 'day' : 'days'}`;
      } else {
        // Parse preset duration
        const durationMatch = formData.duration.trim().match(/^(\d+)\s*days?$/i);
        if (!durationMatch) {
          setError(`Invalid duration format: "${formData.duration}". Expected format: "7 days", "14 days", etc.`);
          return;
        }
        durationDays = parseInt(durationMatch[1], 10);
        if (isNaN(durationDays) || durationDays <= 0) {
          setError(`Invalid duration: ${durationDays}. Must be a positive number.`);
          return;
        }
        durationString = formData.duration;
      }

      // Validate and parse prize pool
      const prizePoolNum = Number(formData.prizePool);
      if (isNaN(prizePoolNum) || prizePoolNum <= 0) {
        setError(`Invalid prize pool: ${formData.prizePool}. Must be a positive number.`);
        return;
      }

      // Validate start date
      if (!formData.startDate || formData.startDate.trim() === '') {
        setError('Start date is required');
        return;
      }

      const startDate = new Date(formData.startDate);
      if (isNaN(startDate.getTime())) {
        setError(`Invalid start date: ${formData.startDate}`);
        return;
      }

      const now = new Date();
      if (startDate <= now) {
        setError('Start date must be in the future');
        return;
      }

      // Calculate stake amount (10% of prize pool)
      const stakeAmountUsdc = prizePoolNum / 10;
      if (stakeAmountUsdc <= 0) {
        setError('Stake amount must be greater than 0');
        return;
      }

      // Step 2: Submit to backend
      setStatusMessage('Creating challenge...');

      const challengeData: CreateChallengeData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: durationString, // Use the validated duration string
        prizePool: formData.prizePool,
        status: formData.status,
        participantLimit: formData.participantLimit,
        startDate: formData.startDate,
        endDate: calculatedEndDate,
        rules: formData.rules,
        // Required backend fields with defaults
        image: formData.image,
        metrics: 'Daily completion',
        difficulty: 'MODERATE',
        verificationType: 'Photo Upload',
        userStake: stakeAmountUsdc,
        totalPrizePool: formData.prizePool,
        hostType: 'CORPORATE',
        sponsor: '',
      };

      const result = await createChallenge(challengeData);

      if (result.success) {
        setStatusMessage('Challenge created successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset form
          setFormData({
            title: '',
            description: '',
            category: '',
            duration: '',
            image: '',
            prizePool: 10,
            status: '',
            participantLimit: 100,
            startDate: '',
            rules: []
          });
          setCustomDays(''); // Reset custom days
          setCurrentStep(1);
          setStatusMessage('');
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      // The error message from challengeService is already user-friendly
      const userMessage = err?.message || 'An unexpected error occurred. Please try again.';

      setError(userMessage);
      setStatusMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // For step 1, check if duration is set. If Custom, also check customDays
        const isDurationValid = formData.duration
          ? (formData.duration === 'Custom' ? customDays.trim() !== '' : true)
          : false;
        return formData.title && formData.description && formData.category && isDurationValid;
      case 2:
        return formData.prizePool > 0 && formData.status && formData.participantLimit > 0;
      case 3:
        return formData.startDate && calculatedEndDate && formData.rules.length > 0;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#121214] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-[#18181B] rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Create Admin Challenge</h2>
            <p className="text-xs text-[#FF5757] mt-1">Platform-wide public challenge</p>
          </div>
          <div className="w-6" />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Challenge Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Basic Challenge Information</h3>
              
              {/* Challenge Image Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Challenge Image</label>
                <ImageUpload
                  onUpload={async (file, onProgress) => {
                    const result = await handleImageUpload(file, onProgress);
                    if (result.success && result.url) {
                      updateFormData('image', result.url);
                    }
                    return result;
                  }}
                  currentImageUrl={formData.image}
                  placeholder="Upload challenge thumbnail"
                  maxSize={10}
                  className="max-w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter the challenge title"
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Write the description..."
                  rows={4}
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white focus:outline-none focus:border-[#FF5757]"
                >
                  <option value="">Select</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateFormData('duration', value);
                    if (value !== 'Custom') {
                      setCustomDays(''); // Clear custom days when selecting preset
                    }
                  }}
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white focus:outline-none focus:border-[#FF5757]"
                >
                  <option value="">Select</option>
                  {DURATIONS.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>

                {/* Custom Days Input - Show when "Custom" is selected */}
                {formData.duration === 'Custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="Enter number of days"
                      min="1"
                      max="365"
                      className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5757]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter custom duration (1-365 days)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Participation & Rewards */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Participation & Rewards</h3>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Prize Pool (USDC)</label>
                <input
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => updateFormData('prizePool', Number(e.target.value))}
                  placeholder="e.g. 100 USDC"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5757]"
                />
                <p className="text-xs text-gray-500 mt-1">Total prize pool in USDC. Minimum stake per user will be 10% of this amount.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white focus:outline-none focus:border-[#FF5757]"
                >
                  <option value="">Select</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Participant Limit</label>
                <select
                  value={formData.participantLimit}
                  onChange={(e) => updateFormData('participantLimit', Number(e.target.value))}
                  className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white focus:outline-none focus:border-[#FF5757]"
                >
                  <option value="">Select</option>
                  {PARTICIPANT_LIMITS.map(limit => (
                    <option key={limit} value={limit}>{limit} participants</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Rules & Scheduling */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Rules & Scheduling</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Starting Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white focus:outline-none focus:border-[#FF5757]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Ending Date</label>
                  <div className="w-full px-4 py-3 bg-[#27272A] border border-[#27272A] rounded-lg text-gray-400 flex items-center">
                    {calculatedEndDate || 'Select start date and duration'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Automatically calculated from start date + duration</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Rules</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRule()}
                      placeholder="Enter Rules here"
                      className="flex-1 px-4 py-3 bg-transparent border border-[#27272A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5757]"
                    />
                    <button
                      onClick={addRule}
                      className="px-4 py-3 bg-[#FF5757] text-white rounded-lg hover:bg-[#FF5757] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between bg-transparent px-4 py-2 rounded-lg">
                      <span className="text-white text-sm">{rule}</span>
                      <button
                        onClick={() => removeRule(index)}
                        className="text-[#FF5757] hover:text-[#FF5757]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
              <p className="text-blue-400 text-sm">{statusMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-[#FF5757]/20 border border-[#FF5757] rounded-lg">
              <p className="text-[#FF5757] text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6">

          <button
            onClick={currentStep === 3 ? handleSubmit : nextStep}
            disabled={!isStepValid() || isSubmitting}
            className="w-full py-4 bg-[#FF5757] text-white rounded-lg font-medium hover:bg-[#FF5757] disabled:bg-[#27272A] disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? statusMessage || 'Creating...' : currentStep === 3 ? 'Create Challenge' : 'Next'}
          </button>

          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="w-full mt-3 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 