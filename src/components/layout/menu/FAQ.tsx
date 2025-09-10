import React from 'react';
import { HelpCircle, AlertTriangle, Shield, Bug, Camera } from 'lucide-react';

interface FAQMenuProps {
  onBack: () => void;
}

const FAQMenu: React.FC<FAQMenuProps> = ({ onBack }) => {
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
        <div className="w-12 h-12 bg-nocenaPink rounded-xl flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">FAQ</h2>
          <p className="text-white/60 text-sm">Beta info and common questions</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* What is this beta version */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <AlertTriangle className="w-5 h-5 mr-3 text-nocenaBlue" />
            What is this beta version?
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            You're using the private beta of Nocena! This version is for testing features and gathering feedback. Some
            features may be incomplete or have bugs - your testing helps us improve the app.
          </p>
        </div>

        {/* What should I expect */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-lg">What should I expect as a beta tester?</h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">As a beta tester, you might experience:</p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaPink rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Occasional bugs or crashes</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Features that change or get updated frequently</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaPurple rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Some missing features that will be added later</span>
            </div>
          </div>
        </div>

        {/* Beta progress */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Shield className="w-5 h-5 mr-3 text-nocenaPurple" />
            Will my beta progress carry over to the full version?
          </h3>
          <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
            <p className="text-orange-200 text-sm leading-relaxed">
              We can't guarantee that your progress will carry over, so please don't count on it.
            </p>
          </div>
        </div>

        {/* Token and rewards */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-lg">Token and rewards</h3>
          <div className="space-y-4">
            <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
              <p className="text-red-200 text-sm leading-relaxed">
                Nocena tokens in private beta are <span className="text-red-300 font-semibold">TESTNET ONLY</span>.
              </p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              These tokens have NO monetary value and exist solely for testing the reward mechanics.
            </p>
          </div>
        </div>

        {/* Helpful feedback */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Bug className="w-5 h-5 mr-3 text-nocenaBlue" />
            What feedback is most helpful?
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">We especially want to know about:</p>
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Bugs or crashes</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaPink rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Features that are confusing or hard to use</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Performance issues</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-nocenaPurple rounded-full flex-shrink-0"></div>
              <span className="text-white/70 text-sm">Missing features you'd expect</span>
            </div>
          </div>
          <div className="bg-nocenaBlue/20 rounded-lg p-4 border border-nocenaBlue/30">
            <p className="text-nocenaBlue text-sm leading-relaxed">
              If you're reporting an issue, please include <span className="font-semibold">steps to reproduce</span>,{' '}
              <span className="font-semibold">screenshots</span>, or any other helpful material, if possible.
            </p>
          </div>
        </div>

        {/* Camera issues */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Camera className="w-5 h-5 mr-3 text-nocenaPink" />
            The camera isn't working - what do I do?
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            <span className="text-nocenaBlue font-semibold">Check permissions</span> - Make sure you allowed camera
            access. For detialed debugging of camera, microphone and notifications issues you can.
          </p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-200 font-semibold mb-2">On Android devices</h4>
            <p className="text-yellow-200 text-sm leading-relaxed">
              Ensure that camera access is granted to Google Chrome or your default browser. Since Nocena is a PWA, it
              runs through your browser in the background - even when installed as an app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQMenu;
