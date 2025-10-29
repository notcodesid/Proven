'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface ChallengeTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ChallengeTabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange 
}: ChallengeTabNavigationProps) {
  return (
    <div className="flex" style={{ borderBottomColor: '#333333', borderBottomWidth: '1px' }}>
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === tab.id 
              ? 'border-b-2' 
              : ''
          }`}
          style={{
            color: activeTab === tab.id ? '#c4c2c9' : '#8a8891',
            borderBottomColor: activeTab === tab.id ? '#FF5757' : 'transparent'
          }}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
