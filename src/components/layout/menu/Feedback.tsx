import React from 'react';

interface FeedbackMenuProps {
  onBack: () => void;
}

const FeedbackMenu: React.FC<FeedbackMenuProps> = ({ onBack }) => {
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

      <h2 className="text-white text-2xl font-bold mb-2">Feedback</h2>
      <p className="text-white/60 text-sm mb-6">Help us improve Nocena</p>

      <div className="space-y-6">
        {/* Main feedback info */}
        <div>
          <p className="text-white/70 text-base leading-relaxed mb-4">
            For the time being reach our in the private beta group on{' '}
            <span className="text-nocenaBlue font-medium">Telegram</span> under the{' '}
            <span className="text-nocenaBlue font-medium">Bug reports and feedback</span> topic –
          </p>

          <div
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://t.me/c/2712317423/126', '_blank');
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://t.me/c/2712317423/126', '_blank');
            }}
            className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-4 cursor-pointer hover:bg-purple-500/30 transition-colors select-none"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="mr-3">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-.962 6.502-.542 1.06-1.097 1.117-1.816.75-.293-.149-.677-.363-1.077-.598-.358-.208-.954-.44-1.155-.596-.177-.138-.362-.301-.244-.615.09-.23.827-.96 1.529-1.681.388-.396.47-.688.215-.702-.154-.008-.22.176-.373.297-.409.32-1.302.952-1.821 1.22-.562.292-.78.07-1.295-.11-.538-.188-1.058-.398-1.058-.398s-.375-.336.263-.695c.865-.488 1.673-.912 1.673-.912l-.003-.004zm.716 5.827c.209.138.49.304.49.304l-.003-.004z" />
              </svg>
              <div>
                <p className="text-white font-medium">Telegram Feedback Topic</p>
                <p className="text-white/60 text-sm">Bug reports and feedback</p>
              </div>
            </div>
          </div>

          <p className="text-white/70 text-base leading-relaxed mb-4">
            If you're having trouble accessing the group, feel free to reach out via{' '}
            <span className="text-nocenaBlue font-medium">X (formerly Twitter)</span> or message{' '}
            <span className="text-nocenaBlue font-medium">@alternative_gg</span> directly on{' '}
            <span className="text-nocenaBlue font-medium">Telegram</span>.
          </p>
        </div>

        {/* What to report */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">What to report:</h3>
          <ul className="text-white/70 text-base leading-relaxed space-y-2 ml-4">
            <li className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              <span>Bugs and technical issues</span>
            </li>
            <li className="flex items-start">
              <span className="text-nocenaBlue mr-2">•</span>
              <span>Feature suggestions</span>
            </li>
            <li className="flex items-start">
              <span className="text-nocenaPurple mr-2">•</span>
              <span>User experience feedback</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <span>Performance problems</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeedbackMenu;
