import React, { useState, useEffect, useRef } from 'react';
import AnimatedBlob from './AnimatedBlob';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface PathOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  color: 'nocenaPurple' | 'nocenaPink' | 'nocenaBlue';
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface VoiceAIChatProps {
  onPathSelect?: (pathId: string) => void;
}

// Custom hook for typing animation
const useTypingEffect = (text: string, speed: number = 50, startDelay: number = 0) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let index = 0;

      const typeInterval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          setIsComplete(true);
          clearInterval(typeInterval);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isTyping, isComplete };
};

const VoiceAIChat: React.FC<VoiceAIChatProps> = ({ onPathSelect }) => {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullText, setFullText] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blobMode, setBlobMode] = useState<'speaking' | 'listening' | 'inactive'>('inactive');

  // Custom journey state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [generatedChallenges, setGeneratedChallenges] = useState<any[]>([]);
  const [showChallengePreview, setShowChallengePreview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Add client-side only state
  const [isClient, setIsClient] = useState(false);

  // Typing effect hook
  const { displayedText, isTyping, isComplete } = useTypingEffect(fullText, 50, 2000);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Set client-side flag after mount
  useEffect(() => {
    setIsClient(true);
    
    // Register service worker only on client
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Service worker registration can happen here if needed
    }
  }, []);

  const pathOptions: PathOption[] = [
    {
      id: 'winter-arc',
      title: 'Winter Arc 2K25',
      subtitle: '',
      description:
        'Take better control of your life and lock in! Discipline-focused challenges to transform your habits and mindset.',
      badge: 'LOCK IN',
      color: 'nocenaPurple',
    },
    {
      id: 'daily-side-quest',
      title: 'Daily Side Quest',
      subtitle: '',
      description:
        'Have fun and socialize! Simple daily challenges to stay connected with friends and create main character moments.',
      badge: 'FUN MODE',
      color: 'nocenaPink',
    },
    {
      id: 'custom-journey',
      title: 'Custom Journey',
      subtitle: '',
      description:
        "Pick up new skills or pursue specific goals. I'll create personalized daily challenges just for you.",
      badge: 'TAILORED',
      color: 'nocenaBlue',
    },
  ];

  const saveCustomChallenges = async (
    challenges: any[],
    pathData: { type: string; goal?: string },
  ): Promise<boolean> => {
    try {
      setIsProcessing(true);

      // Get userId from localStorage (set by JourneyOnboarding wrapper)
      const userId = isClient && typeof window !== 'undefined' 
        ? window.localStorage.getItem('currentUserId') 
        : null;

      if (!userId) {
        throw new Error('User ID is required to save challenges');
      }

      const response = await fetch('/api/chat/save-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenges: challenges,
          pathType: pathData.type,
          goal: pathData.goal || null,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save challenges');
      }

      console.log(`Successfully saved ${result.savedCount} challenges for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to save challenges:', error);
      setError('Failed to save your journey. Please try again.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerateChallenges = async () => {
    if (!userInput.trim()) return;

    setIsRegenerating(true);

    // Generate new challenges with the same goal
    const newChallenges = await generateChallenges(userInput.trim());

    if (newChallenges) {
      setGeneratedChallenges(newChallenges);

      // Speak a brief confirmation
      const confirmText = 'Here are your new personalized challenges!';
      setFullText(confirmText);
      if (isClient) {
        await speakText(confirmText);
      }
    }

    setIsRegenerating(false);
  };

  const generateChallenges = async (goal: string): Promise<any[] | null> => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/chat/generate-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: goal,
          count: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.challenges || null;
    } catch (error) {
      console.error('Challenge generation error:', error);
      setError('Failed to generate challenges. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPreDefinedChallenges = async (pathType: string): Promise<any[] | null> => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/chat/get-predefined', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathType: pathType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.challenges || null;
    } catch (error) {
      console.error('Failed to load predefined challenges:', error);
      setError('Failed to load challenges. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToOpenAI = async (messagesToSend: Message[]): Promise<string | null> => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || null;
    } catch (error) {
      console.error('OpenAI API error:', error);
      setError('Failed to get AI response. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (isClient && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (isClient && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      isActiveRef.current = false;
    };
  }, [isClient]);

  // Initialize conversation only on client
  useEffect(() => {
    if (isClient && !conversationStarted) {
      initializeConversation();
    }
  }, [isClient, conversationStarted]);

  const initializeConversation = async () => {
    // Display text with typing animation (2 second delay, 50ms per character)
    const displayText =
      "Hello challenger. I am Nova. I'll be giving you daily challenges to help you grow, have fun, stay connected, or stay accountable.";
    setFullText(displayText);

    const systemMessage: Message = {
      role: 'system',
      content: `You are an AI fitness coach and companion for Nocena, a social challenge app.
                Please absolutely no emojis.
                Right now greet the user by reading out to them this text:
                "Hello challenger. I am Nova. I'll be giving you daily challenges to help you grow, have fun, stay connected, or stay accountable. You can pick Winter Arc 2k25 to level up your life and lock in, or Daily Side Quest for quick, fun challenges that keep you in touch with friends. Finally, there's the Custom Track, where we'll set challenges tailored to your personal goals and the skills you want to build. Once you choose your path, I'll send you a daily challenge at a random time. Complete it to lock in, then check your friends' completions, follow creators, and climb the leaderboard as you keep progressing."
`,
    };

    try {
      // Start AI speech immediately (parallel with typing animation)
      const response = await sendToOpenAI([systemMessage]);
      if (response && isClient) {
        await speakText(response);
      }

      // Auto-switch to paths 8 seconds after conversation starts
      timeoutRef.current = setTimeout(() => {
        console.log('Timeout triggered, isActiveRef:', isActiveRef.current, 'isClient:', isClient);
        setShowPaths(true);
      }, 8000);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setError('Failed to start conversation. Please refresh and try again.');
    }

    setConversationStarted(true);
  };

  const speakText = async (text: string): Promise<void> => {
    if (!isActiveRef.current || !isClient) return;

    try {
      setIsSpeaking(true);

      // Call OpenAI TTS API for better voice quality
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'nova',
          model: 'tts-1',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS API failed');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      audioRef.current = new Audio(audioUrl);

      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);

      // Fallback to browser TTS - only on client
      if (isClient && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
      }
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (isClient && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  };

  const handlePathSelect = async (pathId: string) => {
    setSelectedPath(pathId);

    if (pathId === 'custom-journey') {
      // Handle custom journey path with AI generation
      setShowPaths(false);
      setShowCustomInput(true);

      const promptText = 'Impressive, what would you like to start working on?';
      setFullText(promptText);

      const systemMessage: Message = {
        role: 'system',
        content: `You are Nova, the AI coach. The user has selected the Custom Journey path. 
                 Say exactly: "Impressive, what would you like to start working on?"
                 No emojis.`,
      };

      try {
        const response = await sendToOpenAI([systemMessage]);
        if (response && isClient) {
          await speakText(response);
        }
      } catch (error) {
        console.error('Failed to get custom journey prompt:', error);
        if (isClient) {
          await speakText(promptText);
        }
      }
    } else {
      // Handle predefined paths (Winter Arc, Daily Side Quest)
      setShowPaths(false);

      // Load predefined challenges for the selected path
      const challenges = await loadPreDefinedChallenges(pathId);

      if (!challenges) {
        return;
      }

      setGeneratedChallenges(challenges);

      // Create appropriate response based on path type
      const pathName = pathId === 'winter-arc' ? 'Winter Arc 2K25' : 'Daily Side Quest';
      const promptText = `Excellent choice! I've prepared 100 ${pathName} challenges to help you lock in and level up. Here are your first 3 challenges. Ready to start your journey?`;
      setFullText(promptText);

      const systemMessage: Message = {
        role: 'system',
        content: `The user selected ${pathName}. You have 100 predefined challenges ready for them.
                 Say: "Excellent choice! I've prepared 100 ${pathName} challenges to help you lock in and level up. Here are your first 3 challenges. Ready to start your journey?"
                 Be encouraging and energetic.
                 No emojis.`,
      };

      try {
        const response = await sendToOpenAI([systemMessage]);
        if (response) {
          setFullText(response);
          if (isClient) {
            await speakText(response);
          }
        }
      } catch (error) {
        console.error('Failed to get path response:', error);
        if (isClient) {
          await speakText(promptText);
        }
      }

      // Show the challenge preview
      setShowChallengePreview(true);
    }
  };

  // Speech recognition setup - only on client
  const initializeSpeechRecognition = () => {
    if (!isClient) return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsRecording(false);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        setIsListening(false);
        setError('Speech recognition failed. Please try typing instead.');
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsListening(false);
      };
    }
  };

  const startVoiceRecording = () => {
    if (!isClient) return;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setError('Speech recognition not available. Please use text input.');
      }
    } else {
      initializeSpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    }
  };

  const stopVoiceRecording = () => {
    if (isClient && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmitGoal = async () => {
    if (!userInput.trim()) return;

    // Generate 100 challenges first
    const challenges = await generateChallenges(userInput.trim());

    if (!challenges) {
      return;
    }

    setGeneratedChallenges(challenges);

    // Process the user's goal and create response
    const goalMessage: Message = {
      role: 'user',
      content: userInput,
    };

    const systemMessage: Message = {
      role: 'system',
      content: `The user wants to work on: "${userInput}". 
               You have successfully generated 100 personalized challenges for them.
               Say something like: "Perfect! I've created 100 personalized challenges to help you ${userInput}. Here are the first 3 challenges to get you started. Do these look good to you?"
               Be encouraging and brief.
               No emojis.`,
    };

    try {
      const response = await sendToOpenAI([systemMessage, goalMessage]);
      if (response) {
        setFullText(response);
        if (isClient) {
          await speakText(response);
        }

        // Show the challenge preview after speaking
        setShowCustomInput(false);
        setShowChallengePreview(true);
      }
    } catch (error) {
      console.error('Failed to process custom goal:', error);
      setError('Failed to process your goal. Please try again.');
    }
  };

  const restartConversation = () => {
    stopSpeaking();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    setFullText('');
    setConversationStarted(false);
    setShowPaths(false);
    setShowCustomInput(false);
    setShowChallengePreview(false);
    setGeneratedChallenges([]);
    setSelectedPath(null);
    setUserInput('');
    setInputMode('text');
    setIsRecording(false);
    setError(null);
    setIsSpeaking(false);
    setIsProcessing(false);
    setBlobMode('inactive');
  };

  // Update blob mode
  useEffect(() => {
    let newMode: 'speaking' | 'listening' | 'inactive' = 'inactive';

    if (isSpeaking) {
      newMode = 'speaking';
    } else if (isProcessing || isListening) {
      newMode = 'listening';
    }

    setBlobMode(newMode);
  }, [isSpeaking, isProcessing, isListening]);

  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return 'AI Coach thinking...';
    if (isSpeaking) return 'Nova speaking...';
    if (isRecording) return 'Listening to your goal...';
    if (isTyping) return 'Nova is speaking...';
    if (showCustomInput) return 'Tell Nova what you want to work on...';
    if (showChallengePreview) return 'Review your first 3 challenges...';
    return 'Listen to your AI coach...';
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden mb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20" />
        <div className="relative z-10 w-full max-w-md mx-auto text-center">
          <div className="flex justify-center items-center relative mb-8">
            <div className="w-45 h-45 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
          </div>
          <p className="text-sm text-white/60">Loading AI Coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden mb-20">
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
          onClick={restartConversation}
          className="absolute -top-16 right-0 p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 group"
          title="Restart conversation"
        >
          <svg
            className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Animated blob */}
        <div className="flex justify-center items-center relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <AnimatedBlob mode={blobMode} size={180} />
        </div>

        {/* Status text */}
        <div className="mb-8">
          <p className="text-sm text-white/60">{getStatusText()}</p>
        </div>

        {/* Content */}
        {showChallengePreview ? (
          // Challenge preview screen
          <div className="space-y-6 animate-fade-in-up">
            {/* AI Response Display */}
            {displayedText && (
              <div className="mb-8">
                <p className="text-xl font-medium text-white/95 text-center leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="ml-1 animate-pulse text-blue-400 font-bold">|</span>}
                </p>
              </div>
            )}

            {/* Goal editing and regeneration */}
            <div className="space-y-4 mb-8">
              <div className="text-center">
                <p className="text-sm text-white/70 mb-3">Your goal:</p>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <p className="text-white/90 font-medium">"{userInput}"</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <PrimaryButton
                  text="Edit Goal"
                  onClick={() => {
                    setShowChallengePreview(false);
                    setShowCustomInput(true);
                  }}
                  className="flex-1"
                  disabled={isRegenerating}
                />

                <PrimaryButton
                  text={isRegenerating ? 'Regenerating...' : 'Regenerate'}
                  onClick={regenerateChallenges}
                  className="flex-1"
                  disabled={isRegenerating}
                  isActive={true}
                />
              </div>
            </div>

            {/* Preview of first 3 challenges */}
            {generatedChallenges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90 text-center mb-4">Your First 3 Challenges:</h3>

                {generatedChallenges.slice(0, 3).map((challenge, index) => (
                  <ThematicContainer
                    key={index}
                    color="nocenaBlue"
                    glassmorphic={true}
                    className="p-6 text-left relative"
                    rounded="2xl"
                  >
                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          challenge.difficulty === 'Beginner'
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                            : challenge.difficulty === 'Advanced'
                              ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                        }`}
                      >
                        {challenge.difficulty}
                      </span>
                    </div>

                    {/* Challenge content */}
                    <div className="pr-20">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-sm font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-xl text-white mb-2">{challenge.title}</h4>
                          <p className="text-sm text-white/80 leading-relaxed mb-3">{challenge.description}</p>

                          <div className="flex items-center space-x-4 text-xs text-white/60">
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>{challenge.estimatedTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              <span>{challenge.category}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ThematicContainer>
                ))}

                <div className="space-y-3 mt-6">
                  <PrimaryButton
                    text="These Look Perfect!"
                    onClick={async () => {
                      // Save challenges to database with path info
                      const pathData =
                        selectedPath === 'custom-journey'
                          ? { type: 'custom-journey', goal: userInput }
                          : { type: selectedPath || 'custom-journey' };

                      const success = await saveCustomChallenges(generatedChallenges, pathData);
                      if (success && onPathSelect) {
                        onPathSelect(selectedPath || 'custom-journey');
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full"
                  />

                  <button
                    onClick={restartConversation}
                    className="w-full py-3 bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : showCustomInput ? (
          // Custom journey input screen
          <div className="space-y-6 animate-fade-in-up">
            {/* AI Response Display */}
            {displayedText && (
              <div className="mb-8">
                <p className="text-xl font-medium text-white/95 text-center leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="ml-1 animate-pulse text-blue-400 font-bold">|</span>}
                </p>
              </div>
            )}

            {/* Input mode toggle */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={() => setInputMode('text')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  inputMode === 'text'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Type</span>
              </button>

              <button
                onClick={() => setInputMode('voice')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  inputMode === 'voice'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'bg-white/5 text-white/60 border border-white/10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <span>Speak</span>
              </button>
            </div>

            {/* Input interface */}
            {inputMode === 'text' ? (
              // Text input
              <div className="space-y-4">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="I want to learn guitar, get better at cooking, improve my fitness..."
                  className="w-full p-4 bg-gray-800 text-white placeholder-white/50 resize-none outline-none rounded-lg border border-gray-600 focus:border-blue-400 transition-colors"
                  rows={4}
                  maxLength={200}
                />

                <PrimaryButton
                  onClick={handleSubmitGoal}
                  text={isProcessing ? 'Processing...' : 'Create My Journey'}
                  disabled={!userInput.trim() || isProcessing}
                  className="w-full"
                />
              </div>
            ) : (
              // Voice input
              <div className="space-y-6">
                {userInput && (
                  <ThematicContainer color="nocenaBlue" glassmorphic={true} className="p-4">
                    <p className="text-white/90 text-center italic">"{userInput}"</p>
                  </ThematicContainer>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <button
                    onMouseDown={startVoiceRecording}
                    onMouseUp={stopVoiceRecording}
                    onTouchStart={startVoiceRecording}
                    onTouchEnd={stopVoiceRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500/30 border-2 border-red-400 scale-110'
                        : 'bg-purple-500/20 border-2 border-purple-400/50 hover:bg-purple-500/30'
                    }`}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </button>

                  <p className="text-sm text-white/60 text-center">
                    {isRecording ? 'Release to stop' : 'Hold to speak'}
                  </p>
                </div>

                {userInput && (
                  <PrimaryButton
                    onClick={handleSubmitGoal}
                    text={isProcessing ? 'Processing...' : 'Create My Journey'}
                    disabled={isProcessing}
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
        ) : showPaths ? (
          // Path selection screen
          <div className="space-y-6 animate-fade-in-up">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Choose your
              </h1>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                challenge path
              </h2>
            </div>

            {pathOptions.map((path, index) => (
              <div
                key={path.id}
                className="opacity-100 transition-all duration-500"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              >
                <ThematicContainer
                  color={path.color}
                  isActive={selectedPath === path.id}
                  onClick={() => handlePathSelect(path.id)}
                  rounded="3xl"
                  glassmorphic={true}
                  className="w-full p-6 text-left relative overflow-hidden hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={`/cards/${path.id === 'winter-arc' ? 'lockin' : path.id === 'daily-side-quest' ? 'side' : 'ai'}.png`}
                      alt=""
                      className="w-full h-full object-cover opacity-20"
                    />
                  </div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <ThematicContainer
                      color={path.color}
                      glassmorphic={false}
                      rounded="full"
                      className="text-xs px-3 py-2 font-semibold"
                    >
                      {path.badge}
                    </ThematicContainer>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="mb-3">
                      <h3 className="text-2xl font-bold text-white">{path.title}</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed pr-16">{path.description}</p>
                  </div>

                  {/* Selection indicator */}
                  {selectedPath === path.id && (
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </ThematicContainer>
              </div>
            ))}

            {selectedPath && selectedPath !== 'custom-journey' && (
              <div className="space-y-4 animate-fade-in mt-6">
                <ThematicContainer
                  color="nocenaPurple"
                  onClick={restartConversation}
                  glassmorphic={true}
                  className="w-full py-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Try Another Path
                  </div>
                </ThematicContainer>

                <ThematicContainer
                  color="nocenaBlue"
                  isActive={true}
                  className="w-full py-6 text-center font-bold text-lg"
                >
                  Lock in & Start Challenge
                </ThematicContainer>
              </div>
            )}
          </div>
        ) : (
          // Voice conversation interface
          <div className="space-y-12">
            {/* AI Response Display with Typing Animation */}
            {displayedText && (
              <div className="transition-all duration-700 opacity-100 transform translate-y-0 animate-fade-in-up">
                <p className="text-xl font-medium text-white/95 min-h-[4rem] flex items-center justify-center text-center leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="ml-1 animate-pulse text-blue-400 font-bold">|</span>}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAIChat;