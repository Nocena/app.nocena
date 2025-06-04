import React from 'react';

const XButton: React.FC = () => {
  return (
    <div className="text-center space-y-3">
      <p className="text-gray-500 text-xs">Don't have an invite code?</p>

      <button
        onClick={() => window.open('https://x.com/nocena_app', '_blank', 'noopener,noreferrer')}
        className="inline-flex items-center space-x-3 bg-black hover:bg-gray-900 border border-white/20 hover:border-white/30 rounded-xl px-6 py-3 transition-all duration-200 group"
      >
        {/* X (Twitter) Icon */}
        <svg
          className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>

        {/* Text */}
        <div className="text-left">
          <div className="text-white font-medium text-sm">Join the Challenge</div>
          <div className="text-gray-400 text-xs">Follow us on X</div>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default XButton;
