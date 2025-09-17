import React, { useState, useEffect, useRef } from 'react';
import AnimatedBlob from './components/AnimatedBlob';

interface ConversationStep {
  text: string;
  type: 'greeting' | 'introduction' | 'explanation' | 'transition';
  showPathsAfter?: boolean;
}

interface PathOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  gradient: string;
  bgGradient: string;
}

const NaturalAIExperience: React.FC = () => {
  // Core state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // Control refs
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const conversationSteps: ConversationStep[] = [
    {
      text: "Hello, challenger.",
      type: 'greeting'
    },
    {
      text: "I am your new companion helping you reach any goals that we set out for you to achieve.",
      type: 'introduction'
    },
    {
      text: "I will give you a daily challenge at random times throughout the day - just like everyone else on this app.",
      type: 'explanation'
    },
    {
      text: "Only once you complete your challenge will you be 'locked in' to browse your friends' completions, check leaderboards, and discover influencer challenges.",
      type: 'explanation'
    },
    {
      text: "Now, let's choose your path...",
      type: 'transition',
      showPathsAfter: true
    }
  ];

  const pathOptions: PathOption[] = [
    {
      id: 'winter-arc',
      title: 'Winter Arc',
      subtitle: '2K25',
      description: 'Take better control of your life and lock in! Discipline-focused challenges to transform your habits and mindset.',
      badge: '🔥 LOCK IN',
      gradient: 'from-red-500 via-orange-500 to-yellow-500',
      bgGradient: 'from-red-500/10 via-orange-500/10 to-yellow-500/10'
    },
    {
      id: 'daily-side-quest',
      title: 'Daily Side',
      subtitle: 'Quest', 
      description: 'Have fun and socialize! Simple daily challenges to stay connected with friends and create main character moments.',
      badge: '✨ FUN MODE',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bgGradient: 'from-purple-500/10 via-pink-500/10 to-rose-500/10'
    },
    {
      id: 'custom-journey',
      title: 'Custom',
      subtitle: 'Journey',
      description: 'Pick up new skills or pursue specific goals. I\'ll create personalized daily challenges just for you.',
      badge: '🎯 TAILORED',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-500/10 via-cyan-500/10 to-teal-500/10'
    }
  ];

  // Clean up function
  const cleanup = () => {
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
      typewriterRef.current = null;
    }
  };

  // Typewriter effect
  const startTypewriter = (text: string, onComplete?: () => void) => {
    cleanup();
    
    if (!isActiveRef.current) return;
    
    setDisplayText('');
    setIsTyping(true);
    
    const words = text.split(' ');
    let wordIndex = 0;
    
    const typeNextWord = () => {
      if (!isActiveRef.current || wordIndex >= words.length) {
        setIsTyping(false);
        if (onComplete && isActiveRef.current) {
          setTimeout(onComplete, 1000);
        }
        return;
      }
      
      const currentText = words.slice(0, wordIndex + 1).join(' ');
      setDisplayText(currentText);
      wordIndex++;
      
      const delay = 120 + Math.random() * 80;
      typewriterRef.current = setTimeout(typeNextWord, delay);
    };
    
    // Start after brief delay
    typewriterRef.current = setTimeout(typeNextWord, 500);
  };

  // Progress to next step
  const progressToNext = () => {
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < conversationSteps.length) {
      setCurrentStepIndex(nextIndex);
    }
  };

  // Start conversation
  useEffect(() => {
    isActiveRef.current = true;
    
    // Initial delay before starting
    const initialTimeout = setTimeout(() => {
      if (isActiveRef.current && conversationSteps[0]) {
        startTypewriter(conversationSteps[0].text, progressToNext);
      }
    }, 1500);
    
    return () => {
      clearTimeout(initialTimeout);
      cleanup();
      isActiveRef.current = false;
    };
  }, []);

  // Handle step progression
  useEffect(() => {
    if (currentStepIndex === 0 || isTyping || showPaths) return;
    
    const currentStep = conversationSteps[currentStepIndex];
    if (!currentStep) return;
    
    const progressTimeout = setTimeout(() => {
      startTypewriter(currentStep.text, () => {
        if (currentStep.showPathsAfter) {
          setTimeout(() => setShowPaths(true), 1500);
        } else {
          progressToNext();
        }
      });
    }, 1200);
    
    return () => clearTimeout(progressTimeout);
  }, [currentStepIndex, isTyping, showPaths]);

  // Reset experience
  const handleRestart = () => {
    cleanup();
    setCurrentStepIndex(0);
    setDisplayText('');
    setIsTyping(false);
    setShowPaths(false);
    setSelectedPath(null);
    
    // Restart after brief delay
    setTimeout(() => {
      if (conversationSteps[0]) {
        startTypewriter(conversationSteps[0].text, progressToNext);
      }
    }, 500);
  };

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
  };

  const getBlobMode = (): 'speaking' | 'listening' => {
    return isTyping ? 'speaking' : 'listening';
  };

  const getTextStyling = (type: string) => {
    const styles = {
      greeting: 'text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent',
      introduction: 'text-xl font-medium text-white/95',
      explanation: 'text-lg font-normal text-white/90 leading-relaxed',
      transition: 'text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'
    };
    return styles[type as keyof typeof styles] || 'text-lg text-white leading-relaxed';
  };

  const currentStep = conversationSteps[currentStepIndex];

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-purple-400/20 rounded-full animate-pulse delay-2000" />
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className="absolute -top-16 right-0 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 group"
          title="Restart experience"
        >
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Animated blob */}
        <div className="mb-16 flex justify-center items-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <AnimatedBlob 
            mode={getBlobMode()}
            size={180}
          />
        </div>

        {/* Content */}
        {showPaths ? (
          // Path selection screen
          <div className="space-y-8 animate-fade-in-up">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Choose your
              </h1>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                challenge path
              </h2>
            </div>
            
            {pathOptions.map((path, index) => (
              <div
                key={path.id}
                className="animate-slide-in-up opacity-0"
                style={{ 
                  animationDelay: `${index * 200}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <button
                  onClick={() => handlePathSelect(path.id)}
                  className={`w-full p-8 rounded-3xl border transition-all duration-500 text-left relative overflow-hidden group hover:scale-[1.02] ${
                    selectedPath === path.id
                      ? `border-transparent bg-gradient-to-br ${path.bgGradient} backdrop-blur-xl shadow-2xl shadow-blue-500/20`
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 backdrop-blur-xl'
                  }`}
                >
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${path.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`text-xs px-3 py-2 rounded-full bg-gradient-to-r ${path.gradient} text-white font-semibold shadow-lg`}>
                      {path.badge}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{path.title}</h3>
                      <h4 className={`text-3xl font-black bg-gradient-to-r ${path.gradient} bg-clip-text text-transparent`}>
                        {path.subtitle}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed pr-20">
                      {path.description}
                    </p>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedPath === path.id && (
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            ))}
            
            {selectedPath && (
              <div className="space-y-4 animate-fade-in">
                <button 
                  onClick={handleRestart}
                  className="w-full py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white/80 rounded-2xl font-medium text-base transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-white flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Another Path
                </button>
                <button className="w-full py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl font-bold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105">
                  🚀 Lock in & Start Challenge
                </button>
              </div>
            )}
          </div>
        ) : (
          // Conversation display
          <div className="space-y-12">            
            {displayText && (
              <div className="transition-all duration-700 opacity-100 transform translate-y-0 animate-fade-in-up">
                <p className={`${getTextStyling(currentStep?.type || 'explanation')} min-h-[4rem] flex items-center justify-center text-center leading-relaxed`}>
                  {displayText}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-6 bg-gradient-to-t from-blue-400 to-purple-400 ml-2 animate-pulse" />
                  )}
                </p>
              </div>
            )}
            
            {!displayText && !isTyping && (
              <div className="text-white/50 text-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white/70 rounded-full animate-spin mx-auto" />
                <p className="mt-4">Initializing...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out forwards;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NaturalAIExperience;