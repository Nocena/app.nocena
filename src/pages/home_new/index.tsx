import React, { useState, useEffect, useRef } from 'react';
import AnimatedBlob from './components/AnimatedBlob';
import { SpeechRecognition } from '../../lib/types';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

interface VoiceAIChatProps {
  onPathSelect?: (pathId: string) => void;
}

const VoiceAIChat: React.FC<VoiceAIChatProps> = ({ onPathSelect }) => {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAIResponse, setCurrentAIResponse] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blobMode, setBlobMode] = useState<'speaking' | 'listening' | 'inactive'>('inactive');

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(true);

  const pathOptions: PathOption[] = [
    {
      id: 'winter-arc',
      title: 'Winter Arc',
      subtitle: '2K25',
      description:
        'Take better control of your life and lock in! Discipline-focused challenges to transform your habits and mindset.',
      badge: '🔥 LOCK IN',
      gradient: 'from-red-500 via-orange-500 to-yellow-500',
      bgGradient: 'from-red-500/10 via-orange-500/10 to-yellow-500/10',
    },
    {
      id: 'daily-side-quest',
      title: 'Daily Side',
      subtitle: 'Quest',
      description:
        'Have fun and socialize! Simple daily challenges to stay connected with friends and create main character moments.',
      badge: '✨ FUN MODE',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bgGradient: 'from-purple-500/10 via-pink-500/10 to-rose-500/10',
    },
    {
      id: 'custom-journey',
      title: 'Custom',
      subtitle: 'Journey',
      description:
        "Pick up new skills or pursue specific goals. I'll create personalized daily challenges just for you.",
      badge: '🎯 TAILORED',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-500/10 via-cyan-500/10 to-teal-500/10',
    },
  ];

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();

        if (recognitionRef.current) {
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setError(null);
          };

          recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0]?.item(0)?.transcript;
            if (transcript) {
              handleUserMessage(transcript);
            }
          };

          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setError('Speech recognition error. Please try again.');
            setIsListening(false);
          };

          recognitionRef.current.onend = () => {
            setIsListening(false);
          };
        }
      } else {
        setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      isActiveRef.current = false;
    };
  }, []);

  // Initialize conversation
  useEffect(() => {
    if (!conversationStarted) {
      initializeConversation();
    }
  }, [conversationStarted]);

  const initializeConversation = async () => {
    const systemMessage: Message = {
      role: 'system',
      content: `You are an AI fitness coach and companion for Nocena, a social challenge app.
                Please absolutely no emojis.
                Right now greet the user by reading out to them this text:
                "Hello challenger. I am your new companion helping you reach any goals that we set out for you to achieve. I will give you a daily challenge. Either if you want to take better control of your life pick this "Winter Arc 2k25" challenge and lock in! If you want to just have fun and socialize with other of your friends on here completing a simple challenge to stay in touch pick "Daily Side Quest" that will give you once a day a challenge to have your main character moment. Finally if you want to pick up some new skill or to be held accountable with pursuing your goals we can have a little chat and I will prepare a specific daily challenge only for you. Then the way this app works is that I will send you a daily challenge at some random time during the day along with all of the other users on this app."
`,
    };

    setMessages([systemMessage]);

    try {
      const response = await sendToOpenAI([systemMessage]);
      if (response) {
        addAIMessage(response);
        await speakText(response);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setError('Failed to start conversation. Please refresh and try again.');
    }

    setConversationStarted(true);
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

  const handleUserMessage = async (transcript: string) => {
    const userMessage: Message = { role: 'user', content: transcript };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await sendToOpenAI(updatedMessages);
      if (response) {
        if (response.includes('SHOW_PATHS')) {
          const cleanResponse = response.replace('SHOW_PATHS', '').trim();
          if (cleanResponse) {
            addAIMessage(cleanResponse);
            await speakText(cleanResponse);
            setTimeout(() => setShowPaths(true), 2000);
          } else {
            setShowPaths(true);
          }
        } else {
          addAIMessage(response);
          await speakText(response);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Failed to process your message. Please try again.');
    }
  };

  const addAIMessage = (content: string) => {
    const aiMessage: Message = { role: 'assistant', content };
    setMessages((prev) => [...prev, aiMessage]);
    setCurrentAIResponse(content);
  };

  const speakText = async (text: string): Promise<void> => {
    if (!isActiveRef.current) return;

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
          voice: 'nova', // OpenAI's best voice
          model: 'tts-1', // Fast model for real-time
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

      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
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

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking && !isProcessing) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError('Could not start listening. Please check microphone permissions.');
      }
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  };

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
    if (onPathSelect) {
      onPathSelect(pathId);
    }
  };

  const restartConversation = () => {
    stopSpeaking();

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    setMessages([]);
    setCurrentAIResponse('');
    setConversationStarted(false);
    setShowPaths(false);
    setSelectedPath(null);
    setError(null);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setBlobMode('inactive');
  };

  // Update blob mode
  useEffect(() => {
    let newMode: 'speaking' | 'listening' | 'inactive' = 'inactive';

    if (isSpeaking) {
      newMode = 'speaking';
    } else if (isListening) {
      newMode = 'listening';
    } else if (isProcessing) {
      newMode = 'listening';
    }

    setBlobMode(newMode);
  }, [isListening, isSpeaking, isProcessing]);

  const getStatusText = () => {
    if (error) return error;
    if (isProcessing) return 'AI Coach thinking...';
    if (isSpeaking) return 'AI Coach speaking...';
    if (isListening) return 'Listening to you...';
    return 'Tap microphone to speak with your AI coach';
  };

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
        <div className="mb-16 flex justify-center items-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <AnimatedBlob mode={blobMode} size={180} />
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
                  animationFillMode: 'forwards',
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
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${path.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="absolute top-4 right-4 z-10">
                    <span
                      className={`text-xs px-3 py-2 rounded-full bg-gradient-to-r ${path.gradient} text-white font-semibold shadow-lg`}
                    >
                      {path.badge}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white mb-1">{path.title}</h3>
                      <h4
                        className={`text-3xl font-black bg-gradient-to-r ${path.gradient} bg-clip-text text-transparent`}
                      >
                        {path.subtitle}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed pr-20">{path.description}</p>
                  </div>

                  {selectedPath === path.id && (
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            ))}

            {selectedPath && (
              <div className="space-y-4 animate-fade-in">
                <button
                  onClick={restartConversation}
                  className="w-full py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white/80 rounded-2xl font-medium text-base transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-white flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
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
          // Voice conversation interface
          <div className="space-y-12">
            {/* AI Response Display */}
            {currentAIResponse && (
              <div className="transition-all duration-700 opacity-100 transform translate-y-0 animate-fade-in-up">
                <p className="text-xl font-medium text-white/95 min-h-[4rem] flex items-center justify-center text-center leading-relaxed">
                  {currentAIResponse}
                </p>
              </div>
            )}

            {/* Status Display */}
            <div className="space-y-6">
              <p className={`text-lg ${error ? 'text-red-400' : 'text-white/70'} text-center`}>{getStatusText()}</p>

              {/* Voice Controls */}
              <div className="flex justify-center space-x-4">
                {/* Microphone Button */}
                <button
                  onClick={startListening}
                  disabled={isListening || isSpeaking || isProcessing}
                  className={`p-6 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 shadow-lg shadow-red-500/30 scale-110'
                      : isProcessing || isSpeaking
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-500/30'
                  }`}
                  title={isListening ? 'Listening...' : 'Start speaking'}
                >
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-6 rounded-full bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-orange-500/30"
                    title="Stop speaking"
                  >
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Instructions */}
              {!conversationStarted && !isProcessing && (
                <p className="text-sm text-white/50 text-center">
                  Grant microphone permissions and wait for the AI coach to start speaking
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAIChat;
