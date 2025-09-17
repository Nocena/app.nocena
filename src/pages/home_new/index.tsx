import React, { useState, useEffect } from 'react';
import AnimatedBlob from './components/AnimatedBlob';

const NaturalAIExperience: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  const conversationFlow = [
    {
      text: "Hello, challenger.",
      delay: 2000,
      showInput: false
    },
    {
      text: "I'm your AI companion, designed to help you unlock your potential through daily challenges.",
      delay: 3500,
      showInput: false
    },
    {
      text: "Tell me, what brings you here today? What do you want to achieve?",
      delay: 3000,
      showInput: true,
      placeholder: "I want to..."
    },
    {
      text: "I understand. Let me show you how I can help you grow.",
      delay: 2500,
      showInput: false
    }
  ];

  const pathOptions = [
    {
      id: 'winter-arc',
      title: 'Winter Arc 2025',
      description: 'Build discipline and transform your habits with structured daily challenges'
    },
    {
      id: 'social-quest',
      title: 'Daily Side Quest', 
      description: 'Fun challenges to connect with friends and create memorable moments'
    },
    {
      id: 'personal-growth',
      title: 'Personal Growth Journey',
      description: 'Customized challenges based on your goals and aspirations'
    }
  ];

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('nocena_onboarding_complete');
    if (hasSeenOnboarding) {
      setIsFirstVisit(false);
      setCurrentStep(conversationFlow.length);
      return;
    }

    if (currentStep < conversationFlow.length) {
      const timer = setTimeout(() => {
        if (conversationFlow[currentStep].showInput) {
          setShowInput(true);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, conversationFlow[currentStep].delay);

      return () => clearTimeout(timer);
    } else if (currentStep === conversationFlow.length) {
      // Show path selection after conversation
      setAnimationPhase(1);
    }
  }, [currentStep]);

  useEffect(() => {
    // Animate the blob continuously
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 0.1) % (Math.PI * 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleInputSubmit = () => {
    if (userInput.trim()) {
      setShowInput(false);
      setCurrentStep(prev => prev + 1);
      setUserInput('');
    }
  };

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
    localStorage.setItem('nocena_onboarding_complete', 'true');
    localStorage.setItem('nocena_selected_path', pathId);
  };

  const getBlobPath = () => {
    const time = animationPhase;
    const morphIntensity = 15;
    
    return `
      M ${50 + morphIntensity * Math.sin(time)} ${20 + morphIntensity * Math.cos(time * 0.8)}
      Q ${80 + morphIntensity * Math.cos(time * 1.2)} ${50 + morphIntensity * Math.sin(time * 0.9)},
        ${50 + morphIntensity * Math.sin(time * 1.1)} ${80 + morphIntensity * Math.cos(time * 0.7)}
      Q ${20 + morphIntensity * Math.cos(time * 0.9)} ${50 + morphIntensity * Math.sin(time * 1.3)},
        ${50 + morphIntensity * Math.sin(time)} ${20 + morphIntensity * Math.cos(time * 0.8)}
      Z
    `;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
      
      <div className="relative z-10 w-full max-w-sm mx-auto text-center">
        {/* Animated AI Blob */}
        <div className="mb-12">
          <AnimatedBlob 
            mode={showInput ? 'waiting' : 'speaking'}
            size={160}
            onRestart={() => {
              setCurrentStep(0);
              setIsFirstVisit(true);
              setUserInput('');
              setShowInput(false);
              setSelectedPath(null);
              setAnimationPhase(0);
              localStorage.removeItem('nocena_onboarding_complete');
              localStorage.removeItem('nocena_selected_path');
            }}
            showRestartButton={currentStep >= conversationFlow.length || !isFirstVisit}
          />
        </div>

        {/* Conversation Display */}
        {!isFirstVisit || currentStep >= conversationFlow.length ? (
          // Show path selection immediately for returning users
          <div className="space-y-6">
            <h1 className="text-2xl font-medium text-gray-800 mb-8">
              Choose your journey
            </h1>
            {pathOptions.map((path, index) => (
              <button
                key={path.id}
                onClick={() => handlePathSelect(path.id)}
                className={`w-full p-6 rounded-2xl border transition-all duration-300 text-left ${
                  selectedPath === path.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{path.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{path.description}</p>
              </button>
            ))}
            
            {selectedPath && (
              <button className="w-full mt-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-lg">
                Start my journey
              </button>
            )}
          </div>
        ) : (
          // First-time conversation flow
          <div className="space-y-8">
            {conversationFlow.slice(0, currentStep + 1).map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 ${
                  index === currentStep ? 'opacity-100 transform translate-y-0' : 'opacity-70'
                }`}
              >
                <p className="text-lg text-gray-700 leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}

            {/* Input Field */}
            {showInput && (
              <div className="mt-8 animate-fade-in">
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
                    placeholder={conversationFlow[currentStep]?.placeholder}
                    className="w-full p-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleInputSubmit}
                    disabled={!userInput.trim()}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors duration-200"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Path Selection (after conversation) */}
            {currentStep >= conversationFlow.length && (
              <div className="mt-12 space-y-4 animate-fade-in">
                <h2 className="text-xl font-medium text-gray-800 mb-6">
                  Choose your path forward
                </h2>
                {pathOptions.map((path, index) => (
                  <button
                    key={path.id}
                    onClick={() => handlePathSelect(path.id)}
                    className={`w-full p-5 rounded-2xl border transition-all duration-300 text-left ${
                      selectedPath === path.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{path.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{path.description}</p>
                  </button>
                ))}
                
                {selectedPath && (
                  <button className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium transition-all duration-300 hover:shadow-lg">
                    Begin my journey
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NaturalAIExperience;