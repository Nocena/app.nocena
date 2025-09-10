import React from 'react';
import { MessageSquare, Bug, Lightbulb, AlertTriangle, ExternalLink } from 'lucide-react';

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

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-nocenaPurple rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">Feedback</h2>
          <p className="text-white/60 text-sm">Help us improve Nocena</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main feedback info */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <MessageSquare className="w-5 h-5 mr-3 text-nocenaBlue" />
            Share Your Thoughts
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            For the time being reach out in the private beta group on{' '}
            <span className="text-nocenaBlue font-semibold">Telegram</span> under the{' '}
            <span className="text-nocenaBlue font-semibold">Bug reports and feedback</span> topic.
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
            className="bg-nocenaPurple/20 border border-nocenaPurple/30 rounded-lg p-4 mb-4 cursor-pointer hover:bg-nocenaPurple/30 transition-colors select-none"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-nocenaPurple/30 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-.962 6.502-.542 1.06-1.097 1.117-1.816.75-.293-.149-.677-.363-1.077-.598-.358-.208-.954-.44-1.155-.596-.177-.138-.362-.301-.244-.615.09-.23.827-.96 1.529-1.681.388-.396.47-.688.215-.702-.154-.008-.22.176-.373.297-.409.32-1.302.952-1.821 1.22-.562.292-.78.07-1.295-.11-.538-.188-1.058-.398-1.058-.398s-.375-.336.263-.695c.865-.488 1.673-.912 1.673-.912l-.003-.004z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium">Telegram Feedback Topic</div>
                  <div className="text-white/60 text-sm">Bug reports and feedback</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-white/50" />
            </div>
          </div>

          <p className="text-white/70 text-sm leading-relaxed">
            If you're having trouble accessing the group, feel free to reach out via{' '}
            <span className="text-nocenaBlue font-semibold">X (formerly Twitter)</span> or message{' '}
            <span className="text-nocenaBlue font-semibold">@alternative_gg</span> directly on{' '}
            <span className="text-nocenaBlue font-semibold">Telegram</span>.
          </p>
        </div>

        {/* What to report */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-lg">What to report:</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Bug className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Bugs and technical issues</div>
                <div className="text-white/60 text-xs">Crashes, errors, unexpected behavior</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-nocenaBlue" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Feature suggestions</div>
                <div className="text-white/60 text-xs">Ideas for new features or improvements</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-nocenaPurple/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-nocenaPurple" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">User experience feedback</div>
                <div className="text-white/60 text-xs">Things that are confusing or hard to use</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Performance problems</div>
                <div className="text-white/60 text-xs">Slow loading, lag, or crashes</div>
              </div>
            </div>
          </div>
        </div>

        {/* How to give good feedback */}
        <div className="bg-gradient-to-r from-nocenaPink/10 to-nocenaBlue/10 rounded-2xl p-6 border border-nocenaPink/20">
          <h3 className="text-white font-semibold mb-4 text-lg">How to give helpful feedback</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Be specific:</strong> Describe exactly what happened and when
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Include screenshots:</strong> Visual examples help us understand issues
                faster
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Steps to reproduce:</strong> Tell us how to recreate the problem
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-white/70 text-sm">
                <strong className="text-white">Device info:</strong> Mention your device type and browser if relevant
              </p>
            </div>
          </div>
        </div>

        {/* Alternative contact */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-lg">Alternative Contact</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-8 h-8 bg-nocenaPink/20 rounded-lg flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-nocenaPink"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium text-sm">X (formerly Twitter)</div>
                <div className="text-white/50 text-xs">@nocena_app</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
              <div className="w-8 h-8 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-.962 6.502-.542 1.06-1.097 1.117-1.816.75-.293-.149-.677-.363-1.077-.598-.358-.208-.954-.44-1.155-.596-.177-.138-.362-.301-.244-.615.09-.23.827-.96 1.529-1.681.388-.396.47-.688.215-.702-.154-.008-.22.176-.373.297-.409.32-1.302.952-1.821 1.22-.562.292-.78.07-1.295-.11-.538-.188-1.058-.398-1.058-.398s-.375-.336.263-.695c.865-.488 1.673-.912 1.673-.912l-.003-.004z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Direct Telegram</div>
                <div className="text-white/50 text-xs">@alternative_gg</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackMenu;
