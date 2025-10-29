import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { formatAmount, formatTokenAmount } from "@/utils/formatters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { USDC_MINT } from "../config/blockchain";
import type { TokenType } from "@/utils/tokenUtils";

interface ShowBalanceProps {
  tokenType?: TokenType; // Defaults to SOL
}

export function ShowSolBalance({ tokenType = 'SOL' }: ShowBalanceProps = {}) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        const getBalance = async () => {
            if (publicKey) {
                try {
                    if (tokenType === 'SOL') {
                        // Get native SOL balance
                        const lamports = await connection.getBalance(publicKey);
                        setBalance(lamports / LAMPORTS_PER_SOL);
                    } else {
                        // Get USDC token balance
                        const userTokenAccount = await getAssociatedTokenAddress(
                            USDC_MINT,
                            publicKey
                        );
                        const accountInfo = await connection.getAccountInfo(userTokenAccount);

                        if (accountInfo) {
                            const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
                            setBalance(parseFloat(tokenBalance.value.amount) / 1_000_000); // USDC has 6 decimals
                        } else {
                            setBalance(0); // No token account = 0 balance
                        }
                    }
                } catch (err) {
                    setBalance(0);
                }
            } else {
                setBalance(null);
            }
        };

        getBalance();

        // Set up an interval to refresh the balance
        const intervalId = setInterval(getBalance, 30000); // every 30 seconds

        return () => clearInterval(intervalId);
    }, [connection, publicKey, tokenType]);

    return (
        <>
            {balance !== null ? formatTokenAmount(balance, tokenType) : "Loading..."}
        </>
    );
}