import React from 'react';

const WaitlistButton: React.FC = () => {
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-500">Don't have an invite code?</p>

      <button
        onClick={() => window.open('https://form.zootools.co/go/ZMsgAJQASDxMvGx7URKC', '_blank', 'noopener,noreferrer')}
        className="group border border-gray-700/50 hover:border-gray-600/70 rounded-lg px-4 py-3 transition-all duration-300 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-center">
            <div className="text-white/80 text-xs font-medium group-hover:text-white transition-colors mb-1">
              Join Waitlist
            </div>
            <div className="text-gray-500 text-xs">Get early access</div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default WaitlistButton;
