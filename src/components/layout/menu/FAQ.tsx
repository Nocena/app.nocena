import React from 'react';

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

      <h2 className="text-white text-2xl font-bold mb-2">FAQ</h2>
      <p className="text-white/60 text-sm mb-6">Beta info and common questions</p>

      <div className="space-y-6">
        {/* What is this beta version */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">What is this beta version?</h3>
          <p className="text-white/70 text-base leading-relaxed">
            You're using the private beta of Nocena! This version is for testing features and gathering feedback. Some
            features may be incomplete or have bugs - your testing helps us improve the app.
          </p>
        </div>

        {/* What should I expect */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">What should I expect as a beta tester?</h3>
          <p className="text-white/70 text-base leading-relaxed mb-3">As a beta tester, you might experience:</p>
          <ul className="text-white/70 text-base leading-relaxed space-y-1 ml-4">
            <li>• Occasional bugs or crashes</li>
            <li>• Features that change or get updated frequently</li>
            <li>• Some missing features that will be added later</li>
          </ul>
        </div>

        {/* Beta progress */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">
            Will my beta progress carry over to the full version?
          </h3>
          <p className="text-white/70 text-base leading-relaxed">
            We can't guarantee that your progress will carry over, so please don't count on it.
          </p>
        </div>

        {/* Token and rewards */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">Token and rewards</h3>
          <p className="text-white/70 text-base leading-relaxed">
            Nocena tokens in private beta are <span className="text-red-300 font-medium">TESTNET ONLY</span>.
          </p>
          <p className="text-white/70 text-base leading-relaxed mt-2">
            These tokens have NO monetary value and exist solely for testing the reward mechanics.
          </p>
        </div>

        {/* Helpful feedback */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">What feedback is most helpful?</h3>
          <p className="text-white/70 text-base leading-relaxed mb-3">We especially want to know about:</p>
          <ul className="text-white/70 text-base leading-relaxed space-y-1 ml-4">
            <li>• Bugs or crashes</li>
            <li>• Features that are confusing or hard to use</li>
            <li>• Performance issues</li>
            <li>• Missing features you'd expect</li>
          </ul>
          <p className="text-white/70 text-base leading-relaxed mt-3">
            If you're reporting an issue, please include{' '}
            <span className="text-nocenaBlue font-medium">steps to reproduce</span>,
            <span className="text-nocenaBlue font-medium"> screenshots</span>, or any other helpful material, if
            possible.
          </p>
        </div>

        {/* Camera issues */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">The camera isn't working - what do I do?</h3>
          <p className="text-white/70 text-base leading-relaxed mb-3">
            <span className="text-nocenaBlue font-medium">Check permissions</span> - Make sure you allowed camera access
          </p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-base leading-relaxed">
              <span className="font-medium">On Android devices</span>, ensure that camera access is granted to Google
              Chrome or your default browser. Since Nocena is a PWA, it runs through your browser in the background -
              even when installed as an app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQMenu;
