import { useState, useEffect } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';

interface Props {
  onNext: () => void;
  onAdvancedSetup?: () => void; // Optional callback for crypto-savvy users
}

const RegisterRewardsExplanationStep = ({ onNext, onAdvancedSetup }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col justify-between h-full relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-16 right-6 w-20 h-20 bg-nocenaPink rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute bottom-24 left-4 w-16 h-16 bg-nocenaBlue rounded-full opacity-10 animate-pulse delay-1000"></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
        {/* Hero Section */}
        <div
          className={`transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          {/* Animated Logo */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-nocenaBlue via-nocenaPurple to-nocenaPink rounded-full animate-spin-slow opacity-30"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-nocenaBlue to-nocenaPink rounded-full flex items-center justify-center shadow-2xl border border-white border-opacity-20">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-lg"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Simple Explanation */}
        <div
          className={`w-full max-w-sm transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        >
          <div className="bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-nocenaBlue to-nocenaPink rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-base mb-2">We'll handle everything</h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  Your secure reward account will be created automatically. No complicated setup required!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className={`space-y-4 transition-all duration-1000 delay-600 mt-6 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
      >
        {/* Main CTA Button */}
        <PrimaryButton
          text="CREATE MY ACCOUNT"
          onClick={onNext}
          className="w-full py-4 text-base font-semibold bg-gradient-to-r from-nocenaBlue via-nocenaPurple to-nocenaPink hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
        />

        {/* Advanced Options Toggle - Hidden by default */}
        <div className="text-center">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-500 text-xs font-light hover:text-gray-400 transition-colors duration-200"
          >
            Advanced setup options
          </button>
        </div>

        {/* Advanced Options - Only show if toggled */}
        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-gray-700 border-opacity-50">
            <button
              onClick={onAdvancedSetup}
              className="w-full py-3 px-4 bg-white bg-opacity-5 hover:bg-opacity-10 border border-white border-opacity-10 rounded-xl text-white text-sm font-medium transition-all duration-200"
            >
              Connect existing wallet
            </button>
            <p className="text-gray-500 text-xs text-center font-light">For crypto-experienced users only</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterRewardsExplanationStep;
