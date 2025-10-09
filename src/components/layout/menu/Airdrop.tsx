import React from 'react';
import { useAccount } from 'wagmi';
import { useDualTokens } from '../../../hooks/contracts/useDualTokens';
import { useExecuteAirdrop } from '../../../hooks/contracts/useAirdrop';
import { Gift, Clock, Users, Zap } from 'lucide-react';

interface AirdropMenuProps {
  onBack: () => void;
}

const AirdropMenu: React.FC<AirdropMenuProps> = ({ onBack }) => {
  const { address, isConnected } = useAccount();
  const { airdrop } = useDualTokens();
  const { executeAirdrop, isPending: airdropPending } = useExecuteAirdrop();

  return (
    <div className="p-6">
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center text-white/70 hover:text-white mb-6 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-2"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Menu
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">Weekly Airdrops</h2>
          <p className="text-white/60 text-sm">Proportional NCX distribution</p>
        </div>
      </div>

      {/* Current Airdrop Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4 text-lg">Current Week Status</h3>
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Week:</span>
            <span className="text-white">{airdrop.currentWeek.toString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Year:</span>
            <span className="text-white">{airdrop.currentYear.toString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Weekly Reward:</span>
            <span className="text-white">{(Number(airdrop.weeklyReward) / 1e18).toLocaleString()} NCX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Status:</span>
            <span className={airdrop.weekExecuted ? 'text-green-400' : 'text-orange-400'}>
              {airdrop.weekExecuted ? 'Executed' : 'Not Executed'}
            </span>
          </div>
        </div>

        {/* Execute Airdrop Button */}
        {isConnected && address && (
          <button
            onClick={() => {
              console.log('Airdrop clicked', {
                address,
                airdropPending,
                weekExecuted: airdrop.weekExecuted,
                currentWeek: airdrop.currentWeek.toString(),
              });
              if (address) {
                console.log('Calling executeAirdrop with address:', address);
                executeAirdrop([address as `0x${string}`]);
              }
            }}
            disabled={airdropPending || airdrop.weekExecuted}
            className="w-full mt-4 bg-orange-500/20 border border-orange-500/40 text-orange-200 px-4 py-3 rounded-lg text-sm disabled:opacity-50 hover:bg-orange-500/30 transition-colors"
          >
            {airdropPending
              ? 'Executing...'
              : airdrop.weekExecuted
                ? 'This Week Already Executed'
                : 'Execute Weekly Airdrop'}
          </button>
        )}

        {!isConnected && (
          <div className="mt-4 text-center text-white/50 text-sm">Connect your wallet to execute airdrops</div>
        )}
      </div>

      {/* How Airdrops Work */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
          <Clock className="w-5 h-5 mr-3 text-orange-400" />
          How Airdrops Work
        </h3>
        <div className="space-y-4">
          {[
            {
              icon: <Users className="w-5 h-5 text-blue-400" />,
              title: 'Proportional Distribution',
              desc: 'Your NCT percentage determines your NCX share',
            },
            {
              icon: <Clock className="w-5 h-5 text-green-400" />,
              title: 'Weekly Schedule',
              desc: 'New airdrops available every week with decreasing amounts',
            },
            {
              icon: <Zap className="w-5 h-5 text-purple-400" />,
              title: 'Decentralized Execution',
              desc: 'Anyone can execute airdrops and earn 0.1% executor rewards',
            },
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-white font-medium text-sm">{item.title}</div>
                <div className="text-white/60 text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Airdrop Schedule */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-4 text-lg">Airdrop Schedule</h3>
        <div className="space-y-3">
          {[
            { period: 'Year 1', amount: '1M NCX per week' },
            { period: 'Year 2', amount: '750K NCX per week' },
            { period: 'Year 3', amount: '500K NCX per week' },
            { period: 'Year 4', amount: '250K NCX per week' },
            { period: 'Year 5+', amount: '100K NCX per week (minimum)' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0"
            >
              <span className="text-white/80 text-sm">{item.period}</span>
              <span className="text-white text-sm font-medium">{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AirdropMenu;
