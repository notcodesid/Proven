'use client';

import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, ChallengesIcon, ProfileIcon } from '../src/components/ui/customicons';

export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const tabs = [
    {
      label: 'Home',
      path: '/dashboard',
      icon: HomeIcon,
    },
    {
      label: 'Challenges',
      path: '/challenges',
      icon: ChallengesIcon,
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: ProfileIcon,
    },
  ];

  return (
    <div className="h-[80px] bg-[#18181B]">
      <div className="flex justify-around items-center h-full max-w-[390px] mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <div className={`w-6 h-6 ${isActive ? 'text-[#FFFFFF]' : 'text-[#6B7280]'}`}>
                <Icon isActive={isActive} />
              </div>
              <span 
                className={`text-xs mt-1 ${isActive ? 'text-[#FFFFFF]' : 'text-[#6B7280]'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
} 