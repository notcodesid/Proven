'use client';

import React from 'react';

// Define the Challenge type directly in this component to avoid import issues
interface Challenge {
  id: string;
  title: string;
  type: string;
  hostType: string;
  sponsor: string;
  creator?: string;
  duration: string;
  difficulty: string;
  userStake: number;
  totalPrizePool: number;
  participants: number;
  metrics: string;
  trackingMetrics?: string[];
  image: string;
}

interface ChallengeInfoCardProps {
  challenge: Challenge;
}

export default function ChallengeInfoCard({ challenge }: ChallengeInfoCardProps) {
  return (
    <div style={{ backgroundColor: '#18181a' }} className="rounded-lg p-4 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-3 text-white">Challenge Details</h2>
      <p className="text-gray-300 mb-4">
        Complete this {challenge.metrics.toLowerCase()} challenge to earn rewards and improve your health.
        Track your progress daily and compete with others to reach your goals.
      </p>

      <div style={{ backgroundColor: '#252329' }} className="p-3 rounded-md mb-4">
        <h3 className="text-lg font-bold mb-2 text-white">Rules</h3>
        <ul className="space-y-2 text-gray-300">
          {challenge.trackingMetrics && challenge.trackingMetrics.length > 0 ? (
            challenge.trackingMetrics.map((metric, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 font-bold mr-2">•</span>
                <span>{metric}</span>
              </li>
            ))
          ) : (
            <li className="flex items-start">
              <span className="text-red-500 font-bold mr-2">•</span>
              <span>Track your {challenge.metrics} daily</span>
            </li>
          )}
          <li className="flex items-start">
            <span className="text-red-500 font-bold mr-2">•</span>
            <span>Stake {challenge.userStake} PROVEN to join</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 font-bold mr-2">•</span>
            <span>Duration: {challenge.duration}</span>
          </li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#252329' }} className="p-3 rounded-md">
        <h3 className="text-lg font-bold mb-2 text-white">Rewards</h3>
        <p className="text-gray-300">
          Successfully complete this challenge to earn a share of the {challenge.totalPrizePool} PROVEN prize pool.
          Your stake is returned plus rewards upon completion.
        </p>
      </div>
    </div>
  );
}
