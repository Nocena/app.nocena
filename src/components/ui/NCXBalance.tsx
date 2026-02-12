import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import Image from 'next/image';
import { getNCXBalance } from '../../lib/kaia/tokenService';

interface NCXBalanceProps {
  className?: string;
  showLabel?: boolean;
}

const NCXBalance: React.FC<NCXBalanceProps> = ({ className = '', showLabel = true }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setBalance('0');
        setError(null);
        return;
      }

      if (chainId !== 8217) {
        setError('Wrong network');
        setBalance('0');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching NCX balance for:', address);
        const balanceStr = await getNCXBalance(address);
        setBalance(parseFloat(balanceStr).toFixed(2));
        console.log('NCX balance:', balanceStr);
      } catch (err: any) {
        console.error('Error fetching NCX balance:', err);
        setError('Failed to load');
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address, isConnected, chainId]);

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image src="/nocenix.ico" alt="NCX" width={20} height={20} />
        <span className="text-gray-400 text-sm">Connect wallet</span>
      </div>
    );
  }

  if (chainId !== 8217) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image src="/nocenix.ico" alt="NCX" width={20} height={20} />
        <span className="text-red-400 text-sm">Switch to Kaia</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/nocenix.ico" alt="NCX" width={20} height={20} />
      <div className="flex items-center gap-1">
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        ) : error ? (
          <span className="text-red-400 text-sm">{error}</span>
        ) : (
          <span className="font-semibold text-white">{balance}</span>
        )}
        {showLabel && <span className="text-gray-300 text-sm">NCX</span>}
      </div>
    </div>
  );
};

export default NCXBalance;
