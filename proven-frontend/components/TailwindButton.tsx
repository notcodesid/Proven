'use client';

import React from 'react';

interface ButtonProps {
  primary?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export default function TailwindButton({ 
  primary = true, 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  const baseStyles = 'rounded font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg'
  };
  
  const variantStyles = primary
    ? 'bg-primary text-white hover:bg-primary/90'
    : 'bg-secondary text-foreground hover:bg-secondary/80';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
} 