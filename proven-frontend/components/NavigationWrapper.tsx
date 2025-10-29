'use client';

import { usePathname } from 'next/navigation';
import ClientNav from './ClientNav';

const NavigationWrapper = () => {
  const pathname = usePathname();
  
  // Don't show navigation on the home page
  if (pathname === '/') {
    return null;
  }
  
  return <ClientNav />;
};

export default NavigationWrapper;
