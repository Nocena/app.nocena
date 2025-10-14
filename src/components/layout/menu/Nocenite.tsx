import React from 'react';
import { ChevronLeft, Coins, Trophy, Zap } from 'lucide-react';

interface NoceniteMenuProps {
  onBack: () => void;
}

const NoceniteMenu: React.FC<NoceniteMenuProps> = ({ onBack }) => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Nocenite (NCT)</h2>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* What is Nocenite */}
        <div className="bg-gradient-to-br from-nocenaPink/20 to-nocenaBlue/20 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center mb-4">
            <Coins className="w-6 h-6 text-nocenaPink mr-3" />
            <h3 className="text-lg font-semibold text-white">What is Nocenite?</h3>
          </div>
          <p className="text-white/80 leading-relaxed">
            Nocenite (NCT) is the reward token of the Nocena ecosystem. You earn NCT by completing daily, weekly, and
            monthly challenges in the app.
          </p>
        </div>

        {/* How to Earn */}
        <div className="bg-gradient-to-br from-nocenaBlue/20 to-nocenaPink/20 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-nocenaBlue mr-3" />
            <h3 className="text-lg font-semibold text-white">How to Earn NCT</h3>
          </div>
          <div className="space-y-3 text-white/80">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mr-3"></div>
              <span>
                <strong>Daily Challenges:</strong> 100 NCT per completion
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full mr-3"></div>
              <span>
                <strong>Weekly Challenges:</strong> 500 NCT per completion
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mr-3"></div>
              <span>
                <strong>Monthly Challenges:</strong> 2,500 NCT per completion
              </span>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="bg-gradient-to-br from-nocenaPink/20 to-nocenaBlue/20 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-nocenaPink mr-3" />
            <h3 className="text-lg font-semibold text-white">Purpose in Nocena</h3>
          </div>
          <p className="text-white/80 leading-relaxed">
            NCT tokens represent your engagement and achievements within the Nocena community. They're stored on the
            blockchain and serve as proof of your participation in challenges and social activities.
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Getting Started</h3>
          <p className="text-white/80 leading-relaxed">
            Connect your wallet from the Wallet section to start earning and managing your NCT tokens. Complete your
            first challenge to earn your initial NCT rewards!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoceniteMenu;
