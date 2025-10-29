'use client';

import React, { useState } from 'react';
import { TabColors } from './theme/Colors';

/**
 * TabBar component for navigation at the bottom of the app
 */

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface TabBarProps {
  items: TabItem[];
  activeTab?: string;
  onChange?: (key: string) => void;
}

export function TabBar({ items, activeTab, onChange }: TabBarProps) {
  const [active, setActive] = useState(activeTab || items[0]?.key);

  const handleTabChange = (key: string) => {
    setActive(key);
    if (onChange) {
      onChange(key);
    }
  };

  return (
    <div 
      className="flex items-center justify-around fixed bottom-0 left-0 right-0 h-16 px-2 border-t border-gray-800 z-50"
      style={{ backgroundColor: TabColors.tabBarBackground }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          className="flex flex-col items-center justify-center w-full h-full pt-1"
          onClick={() => handleTabChange(item.key)}
        >
          <div className="relative flex flex-col items-center">
            {/* Icon - show active or inactive based on state */}
            <div 
              className="mb-1 w-5 h-5" 
              style={{ 
                color: active === item.key 
                  ? TabColors.tabIconActive 
                  : TabColors.tabIconInactive 
              }}
            >
              {active === item.key && item.activeIcon ? item.activeIcon : item.icon}
            </div>
            
            {/* Label */}
            <span 
              className="text-xs font-medium"
              style={{ 
                color: active === item.key 
                  ? TabColors.tabIconActive 
                  : TabColors.tabIconInactive 
              }}
            >
              {item.label}
            </span>
            
            {/* Active indicator */}
            {active === item.key && (
              <div 
                className="absolute -bottom-2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: TabColors.indicator }}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  );
} 