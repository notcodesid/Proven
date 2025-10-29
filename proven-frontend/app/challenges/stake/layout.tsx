'use client';

import { ReactNode } from "react";

interface StakeLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: StakeLayoutProps) {
  return (
    // Wallet providers are already mounted at `app/challenges/layout.tsx`.
    // Avoid nesting providers to prevent duplicate modal list rendering.
    <>{children}</>
  );
}