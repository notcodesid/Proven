'use client';

import { usePathname } from 'next/navigation';
import ClientNav from './ClientNav';

/**
 * Wrapper for ClientNav that conditionally renders the navigation
 * Hides the navigation on the home page (/)
 */
export default function ClientNavWrapper() {
  const pathname = usePathname();
  
  // Don't show navigation on the home page
  if (pathname === '/') {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[450px] mx-auto z-10">
      <ClientNav />
    </div>
  );
}
