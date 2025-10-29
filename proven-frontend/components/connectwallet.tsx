'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface ConnectWalletProps {
  fullWidth?: boolean;
  darkMode?: boolean;
  customClassName?: string;
  withProviders?: boolean;
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({
  fullWidth = false,
  darkMode = true,
  customClassName = '',
  withProviders = false
}) => {
  const baseClassName = `wallet-adapter-button-trigger ${customClassName}`;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClass}`}>
      <WalletMultiButton
        className={`${baseClassName} ${widthClass} ${darkMode ? 'wallet-adapter-button-dark' : ''}`}
      />
    </div>
  );
};

export default ConnectWallet;