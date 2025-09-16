import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowLeft, Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { mockUser } from '../../data/mock';
import { useRouter } from 'next/router';
import { Toast } from './components/Toast';
const TokenSwap = () => {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState(mockUser);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState<'NCX' | 'USDT'>('NCX');
  const [toToken, setToToken] = useState<'NCX' | 'USDT'>('USDT');
  const [exchangeRate, setExchangeRate] = useState(0.8); // 1 NCX = 0.8 USDT
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapHistory, setSwapHistory] = useState([
    {
      id: 1,
      from: 'NCX',
      to: 'USDT',
      fromAmount: 1000,
      toAmount: 800,
      rate: 0.8,
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed',
    },
    {
      id: 2,
      from: 'USDT',
      to: 'NCX',
      fromAmount: 500,
      toAmount: 625,
      rate: 1.25,
      timestamp: '2024-01-12T14:20:00Z',
      status: 'completed',
    },
    {
      id: 3,
      from: 'NCX',
      to: 'USDT',
      fromAmount: 2500,
      toAmount: 2000,
      rate: 0.8,
      timestamp: '2024-01-10T09:15:00Z',
      status: 'completed',
    },
  ]);

  const onSwap = (fromAmount: number, toAmount: number, fromToken: string, toToken: string) => {
    setUser(prev => ({
      ...prev,
      nocenixBalance: fromToken === 'NCX'
        ? prev.nocenixBalance - fromAmount
        : prev.nocenixBalance + toAmount,
      usdtBalance: fromToken === 'USDT'
        ? prev.usdtBalance - fromAmount
        : prev.usdtBalance + toAmount,
    }));
  };

  // Simulate real-time exchange rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      setExchangeRate(prev => Math.max(0.75, Math.min(0.85, prev + variation)));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate conversion when amount or rate changes
  useEffect(() => {
    if (fromAmount && !isNaN(Number(fromAmount))) {
      const amount = Number(fromAmount);
      if (fromToken === 'NCX' && toToken === 'USDT') {
        setToAmount((amount * exchangeRate).toFixed(2));
      } else if (fromToken === 'USDT' && toToken === 'NCX') {
        setToAmount((amount / exchangeRate).toFixed(0));
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, exchangeRate, fromToken, toToken]);

  const handleSwapTokens = () => {
    const newFromToken = toToken;
    const newToToken = fromToken;
    setFromToken(newFromToken);
    setToToken(newToToken);
    setFromAmount(toAmount);
    setToAmount('');
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;

    const fromAmountNum = Number(fromAmount);
    const toAmountNum = Number(toAmount);

    // Check if user has enough balance
    if (fromToken === 'NCX' && fromAmountNum > user.nocenixBalance) {
      alert('Insufficient NCX balance');
      return;
    }
    if (fromToken === 'USDT' && fromAmountNum > user.usdtBalance) {
      alert('Insufficient USDT balance');
      return;
    }

    setIsSwapping(true);

    // Simulate swap process
    setTimeout(() => {
      onSwap(fromAmountNum, toAmountNum, fromToken, toToken);

      // Add to swap history
      const newSwap = {
        id: swapHistory.length + 1,
        from: fromToken,
        to: toToken,
        fromAmount: fromAmountNum,
        toAmount: toAmountNum,
        rate: fromToken === 'NCX' ? exchangeRate : 1 / exchangeRate,
        timestamp: new Date().toISOString(),
        status: 'completed' as const,
      };
      setSwapHistory(prev => [newSwap, ...prev]);

      setFromAmount('');
      setToAmount('');
      setIsSwapping(false);

      // Show success toast
      setToastMessage(`Successfully swapped ${fromAmountNum.toLocaleString()} ${fromToken} for ${toAmountNum.toLocaleString()} ${toToken}!`);
      setShowToast(true);

    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMaxAmount = () => {
    return fromToken === 'NCX' ? user.nocenixBalance : user.usdtBalance;
  };

  const setMaxAmount = () => {
    const maxAmount = getMaxAmount();
    setFromAmount(maxAmount.toString());
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 main-page-wrapper">
      {/* Back Button */}
      <button
        onClick={() => router.push('/home')}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </button>

      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
        <p className="text-gray-400">Exchange your Nocenix tokens for USDT and vice versa</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Swap Interface */}
        <div className="lg:col-span-2 order-1 lg:order-none">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <TrendingUp className="w-4 h-4" />
                <span>1 NCX = {exchangeRate.toFixed(4)} USDT</span>
              </div>
            </div>

            {/* From Token */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                  <label className="text-sm font-medium text-gray-300">From</label>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Wallet className="w-4 h-4" />
                    <span>Balance: {getMaxAmount().toLocaleString()} {fromToken}</span>
                    <button
                      onClick={setMaxAmount}
                      className="text-nocenaBlue hover:text-nocenaPink transition-colors duration-200 font-medium"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none w-full sm:w-auto"
                  />
                  <div
                    className="flex items-center justify-center space-x-2 bg-gray-700 rounded-lg px-3 py-2 w-full sm:w-auto">
                    <img
                      src={`${fromToken === 'NCX' ? '/images/nocena-token.png' : '/images/usdt.png'}`}
                      alt="Token Image"
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-white font-medium">{fromToken}</span>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapTokens}
                  className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <ArrowUpDown className="w-5 h-5" />
                </button>
              </div>

              {/* To Token */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                  <label className="text-sm font-medium text-gray-300">To</label>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Wallet className="w-4 h-4" />
                    <span>Balance: {(toToken === 'NCX' ? user.nocenixBalance : user.usdtBalance).toLocaleString()} {toToken}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input
                    type="number"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none w-full sm:w-auto"
                  />
                  <div
                    className="flex items-center justify-center space-x-2 bg-gray-700 rounded-lg px-3 py-2 w-full sm:w-auto">
                    <img
                      src={`${toToken === 'NCX' ? '/images/nocena-token.png' : '/images/usdt.png'}`}
                      alt="Token Image"
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-white font-medium">{toToken}</span>
                  </div>
                </div>
              </div>

              {/* Swap Details */}
              {fromAmount && toAmount && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-sm">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span
                      className="text-white">1 {fromToken} = {fromToken === 'NCX' ? exchangeRate.toFixed(4) : (1 / exchangeRate).toFixed(4)} {toToken}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-sm">
                    <span className="text-gray-400">Network Fee</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-medium">Free</span>
                      <span className="text-gray-500 line-through text-xs">0.001 Kaia</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-sm">
                    <span className="text-gray-400">You'll receive</span>
                    <span className="text-nocenaPink font-medium">{toAmount} {toToken}</span>
                  </div>
                </div>
              )}

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={!fromAmount || !toAmount || isSwapping || Number(fromAmount) > getMaxAmount()}
                className="w-full bg-nocena-purple hover:bg-nocena-purple-fade disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSwapping ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Swapping...</span>
                  </>
                ) : (
                  <span>Swap Tokens</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 order-2 lg:order-none">
          {/* Current Balances */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Your Balances</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="/images/nocena-token.png"
                    alt="NOCENIX"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-white font-medium">Nocenix</p>
                    <p className="text-gray-400 text-sm">NCX</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm sm:text-base">{user.nocenixBalance.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">≈ ${(user.nocenixBalance * exchangeRate).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="/images/usdt.png"
                    alt="USDT"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-white font-medium">Tether</p>
                    <p className="text-gray-400 text-sm">USDT</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm sm:text-base">{user.usdtBalance.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">≈ {(user.usdtBalance / exchangeRate).toFixed(0)} NCX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Info */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Market Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">NCX Price</span>
                <span className="text-white">${exchangeRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">24h Change</span>
                <span className="text-green-400">+2.34%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white">$1.2M</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Liquidity</span>
                <span className="text-white">$8.7M</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />

      {/* Swap History */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Recent Swaps</h3>
        <div className="space-y-4">
          {swapHistory.map((swap) => (
            <div key={swap.id}
                 className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  {swap.from === 'NCX' ? (
                    <img
                      src="/images/nocena-token.png"
                      alt="NOCENIX"
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <img
                      src="/images/usdt.png"
                      alt="USDT"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  {swap.to === 'NCX' ? (
                    <img
                      src="/images/nocena-token.png"
                      alt="NOCENIX"
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <img
                      src="/images/usdt.png"
                      alt="USDT"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">
                    {swap.fromAmount.toLocaleString()} {swap.from} → {swap.toAmount.toLocaleString()} {swap.to}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(swap.timestamp)}</span>
                    </div>
                    <span>Rate: {swap.rate.toFixed(4)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-500 text-sm font-medium capitalize">{swap.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenSwap;