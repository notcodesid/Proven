"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';


interface ChallengeForm {
  title: string;
  type: string;
  hostType: 'ORG' | 'INDIVIDUAL';
  sponsor: string;
  duration: string;
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  userStake: number;
  totalPrizePool: number;
  participants: number;
  metrics: string;
  trackingMetrics: string[];
  image: string;
  description: string;
  rules: string[];
  startDate: string;
  endDate: string;
  creatorName: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ChallengeForm>({
    title: '',
    type: 'Fitness',
    hostType: 'ORG',
    sponsor: '',
    duration: '21 days',
    difficulty: 'MODERATE',
    userStake: 0.01,
    totalPrizePool: 5,
    participants: 20,
    metrics: '',
    trackingMetrics: [],
    image: '',
    description: '',
    rules: [],
    startDate: '',
    endDate: '',
    creatorName: ''
  });

  // Only check for authentication
  if (!loading && !isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'rules') {
      // Split rules by newline and filter out empty lines
      setFormData(prev => ({
        ...prev,
        rules: value.split('\n').filter(rule => rule.trim() !== '')
      }));
    } else if (name === 'trackingMetrics') {
      // Split metrics by comma and trim
      setFormData(prev => ({
        ...prev,
        trackingMetrics: value.split(',').map(metric => metric.trim()).filter(Boolean)
      }));
    } else if (name === 'userStake' || name === 'totalPrizePool' || name === 'participants') {
      // Convert to number
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#010001' }}>
        <p style={{ color: '#c4c2c9' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#010001' }}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#c4c2c9' }}>Create Challenge</h1>
        <p style={{ color: '#8a8891' }}>Set up a new challenge for users</p>
      </div>

      {error && (
        <div className="mx-6 p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20">
          <p style={{ color: '#ff6b6b' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Enter challenge title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              >
                <option value="Fitness">Fitness</option>
                <option value="Education">Education</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Host Type</label>
              <select
                name="hostType"
                value={formData.hostType}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              >
                <option value="ORG">Organization</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Sponsor/Creator Name</label>
            <input
              type="text"
              name="sponsor"
              value={formData.sponsor}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Enter sponsor or creator name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
                placeholder="e.g., 21 days"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              >
                <option value="EASY">Easy</option>
                <option value="MODERATE">Moderate</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>User Stake (USDC)</label>
              <input
                type="number"
                name="userStake"
                value={formData.userStake}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
                placeholder="0.1"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Prize Pool (USDC)</label>
              <input
                type="number"
                name="totalPrizePool"
                value={formData.totalPrizePool}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
                placeholder="5.00"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Max Participants</label>
              <input
                type="number"
                name="participants"
                value={formData.participants}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
                placeholder="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Metrics</label>
            <input
              type="text"
              name="metrics"
              value={formData.metrics}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="e.g., Steps"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Tracking Metrics (comma-separated)</label>
            <input
              type="text"
              name="trackingMetrics"
              value={formData.trackingMetrics.join(', ')}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="e.g., steps, distance"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Image URL</label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Enter image URL"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Describe the challenge"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Rules (one per line)</label>
            <textarea
              name="rules"
              value={formData.rules.join('\n')}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Enter challenge rules, one per line"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" style={{ color: '#8a8891' }}>Creator Name</label>
            <input
              type="text"
              name="creatorName"
              value={formData.creatorName}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-[#252329] text-[#c4c2c9] border border-[#333]"
              placeholder="Enter creator name"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg font-semibold transition-colors"
          style={{
            backgroundColor: isSubmitting ? '#666' : '#FF5757',
            color: '#FFFFFF'
          }}
        >
          {isSubmitting ? 'Creating Challenge...' : 'Create Challenge'}
        </button>
      </form>
    </div>
  );
} 