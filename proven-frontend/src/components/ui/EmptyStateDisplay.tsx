'use client';

import React from 'react';
import { IconType } from 'react-icons';

interface EmptyStateDisplayProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyStateDisplay({ 
  icon, 
  title, 
  message, 
  actionButton 
}: EmptyStateDisplayProps) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-5">
      <div className="mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: '#c4c2c9' }}>
        {title}
      </h3>
      <p className="text-center mb-8" style={{ color: '#8a8891' }}>
        {message}
      </p>
      {actionButton && (
        <button 
          onClick={actionButton.onClick}
          className="px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105"
          style={{
            background: 'linear-gradient(to right, #FF5757, #FF7F50)',
            color: '#FFFFFF'
          }}
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
