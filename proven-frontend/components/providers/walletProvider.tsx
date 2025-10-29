import React, { ReactNode } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";

type Props = {
  children: ReactNode;
};

const WalletContextWrapper: React.FC<Props> = ({ children }) => {
  return (
    <WalletProvider wallets={[]} autoConnect>
      {children}
    </WalletProvider>
  );
};

export default WalletContextWrapper;
