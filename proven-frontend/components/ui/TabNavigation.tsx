'use client';

import React, { useState, useEffect } from 'react';
import { TabBar } from './TabBar';

// Icons for the tabs
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
  </svg>
);

const ChallengesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.937 6.937 0 006.708 6.708.75.75 0 00.859-.584c.212-1.012.395-2.036.543-3.071h.858a48.424 48.424 0 01-1.011 5.322c-.175.746.046 1.537.611 2.1.45.45 1.18.676 1.912.57 6.136-.863 11.437-4.403 15.12-9.695a.75.75 0 00-.154-.935c-.816-.65-1.705-1.233-2.651-1.741a.75.75 0 00-.927.173l-.316.42a19.794 19.794 0 01-7.2 5.958 1.5 1.5 0 01-1.134.12A48.514 48.514 0 018.53 2.619 1.5 1.5 0 019.664 2.5h2.172a1.5 1.5 0 011.499 1.5 1.5 1.5 0 01-1.5 1.5H9.662a48.454 48.454 0 01-4.496-.863z" clipRule="evenodd" />
    <path d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H7.5z" />
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
  </svg>
);

interface TabNavigationProps {
  pathname?: string;
  onNavigate?: (path: string) => void;
}

export function TabNavigation({ pathname, onNavigate }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState('home');

  // Update active tab based on current path
  useEffect(() => {
    if (!pathname) return;
    
    if (pathname === '/' || pathname.includes('/dashboard')) {
      setActiveTab('home');
    } else if (pathname.includes('/challenges')) {
      setActiveTab('challenges');
    } else if (pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (pathname.includes('/wallet')) {
      setActiveTab('wallet');
    }
  }, [pathname]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (onNavigate) {
      switch (key) {
        case 'home':
          onNavigate('/dashboard');
          break;
        case 'challenges':
          onNavigate('/challenges');
          break;
        case 'profile':
          onNavigate('/profile');
          break;
        case 'wallet':
          onNavigate('/wallet');
          break;
      }
    }
  };

  // Define tabs
  const tabs = [
    { key: 'home', label: 'Home', icon: <HomeIcon /> },
    { key: 'challenges', label: 'Challenges', icon: <ChallengesIcon /> },
    { key: 'profile', label: 'Profile', icon: <ProfileIcon /> },
    { key: 'wallet', label: 'Wallet', icon: <WalletIcon /> },
  ];

  return <TabBar items={tabs} activeTab={activeTab} onChange={handleTabChange} />;
} 