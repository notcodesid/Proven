'use client';

import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: ProfileLayoutProps) {
  return (
    // Providers are already applied at higher-level layouts where needed
    <>{children}</>
  );
}


