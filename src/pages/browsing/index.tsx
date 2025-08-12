// pages/browsing/index.tsx - Minimal camera cleanup additions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../src/contexts/AuthContext'; // Add this import
import InteractionSidebar from './components/InteractionSidebar';

interface ChallengeCompletion {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  completionDate: string;
  media: string; // JSON string containing videoCID and selfieCID
  challengeType: string;
  description?: string; // User's completion description (removed from query)
  publicChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  privateChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  aiChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  videoUrl?: string;
  selfieUrl?: string;
  // Local state for likes (will be replaced with DB data later)
  localLikes?: number;
  localIsLiked?: boolean;
  // Database fields for likes
  totalLikes?: number;
  isLiked?: boolean;
  recentLikes?: Array<{
    id: string;
    username: string;
    profilePicture: string;
  }>;
  // Database fields for reactions
  totalReactions?: number;
  recentReactions?: Array<{
    id: string;
    reactionType: string;
    emoji: string;
    selfieUrl?: string;
    user: {
      id: string;
      username: string;
      profilePicture: string;
    };
    createdAt: string;
  }>;
}

const BrowsingPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth(); // Get current user from auth context
  const { challengeId, userId } = router.query;
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    // Always fetch completions, with or without challengeId
    fetchChallengeCompletions();
  }, [challengeId]); // Add challengeId back since we might need to refetch when it changes

  useEffect(() => {
    // Find the initial completion to show based on userId
    if (completions.length > 0 && userId) {
      const initialIndex = completions.findIndex((comp) => comp.user.id === userId);
      if (initialIndex !== -1) {
        setCurrentIndex(initialIndex);
        scrollToIndex(initialIndex, false);
      }
    }
  }, [completions, userId]);

  const fetchChallengeCompletions = async () => {
    try {
      setLoading(true);

      // Import the enhanced function from dgraph.ts
      const { fetchChallengeCompletionsWithLikesAndReactions } = await import('../../../src/lib/api/dgraph');

      // Get current user ID for like status
      const currentUserId = user?.id; // Use actual user ID from auth context

      // Fetch completions with like and reaction data
      const allCompletions = await fetchChallengeCompletionsWithLikesAndReactions(
        challengeId as string | undefined,
        currentUserId,
      );

      if (allCompletions.length === 0) {
        throw new Error(challengeId ? 'No completions found for this challenge' : 'No completions found');
      }

      // Process media URLs for each completion
      const processedCompletions = await Promise.all(
        allCompletions.map(async (completion: any) => {
          let videoUrl = null;
          let selfieUrl = null;

          try {
            const media = JSON.parse(completion.media);
            let videoCID = media.videoCID;
            let selfieCID = media.selfieCID;

            // Handle nested CID structure
            if (!videoCID && !selfieCID && media.directoryCID) {
              try {
                const directoryData = JSON.parse(media.directoryCID);
                videoCID = directoryData.videoCID;
                selfieCID = directoryData.selfieCID;
              } catch (dirParseError) {
                console.error('Error parsing directory CID:', dirParseError);
              }
            }

            if (videoCID) {
              videoUrl = `https://gateway.pinata.cloud/ipfs/${videoCID}`;
            }
            if (selfieCID) {
              selfieUrl = `https://gateway.pinata.cloud/ipfs/${selfieCID}`;
            }
          } catch (parseError) {
            console.error('Error parsing media for completion:', completion.id, parseError);
          }

          return {
            ...completion,
            videoUrl,
            selfieUrl,
            // Use real database values for both likes and reactions
            localLikes: completion.totalLikes || 0,
            localIsLiked: completion.isLiked || false,
          };
        }),
      );

      // Sort by completion date (most recent first)
      processedCompletions.sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

      setCompletions(processedCompletions);
    } catch (err) {
      console.error('Error fetching challenge completions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load completions');
    } finally {
      setLoading(false);
    }
  };

  const scrollToIndex = useCallback((index: number, smooth: boolean = true) => {
    if (containerRef.current) {
      const scrollTop = index * window.innerHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  const pauseAllVideos = useCallback(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.pause();
      }
    });
  }, []);

  const playCurrentVideo = useCallback(
    (index: number) => {
      const completion = completions[index];
      if (completion && completion.id) {
        const video = videoRefs.current[completion.id];
        if (video) {
          video.muted = false;
          video.play().catch((err) => {
            console.log('Video play failed:', err);
          });
        }
      }
    },
    [completions],
  );

  const handleVideoClick = useCallback((completionId: string) => {
    const video = videoRefs.current[completionId];
    if (video) {
      if (video.paused) {
        video.play().catch((err) => console.log('Play failed:', err));
      } else {
        video.pause();
      }

      // Update the play button visibility manually
      const playButton = document.getElementById(`play-button-${completionId}`);
      if (playButton) {
        // Small delay to let the video state update
        setTimeout(() => {
          playButton.style.display = video.paused ? 'flex' : 'none';
        }, 50);
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrolling) return;

    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < completions.length) {
      pauseAllVideos();
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, completions.length, isScrolling, pauseAllVideos]);

  const handleScrollEnd = useCallback(() => {
    if (!containerRef.current || isScrolling) return;

    setIsScrolling(true);

    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const nearestIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(nearestIndex, completions.length - 1));

    if (clampedIndex !== currentIndex) {
      pauseAllVideos();
      setCurrentIndex(clampedIndex);
      scrollToIndex(clampedIndex);
    }

    setTimeout(() => {
      setIsScrolling(false);
      playCurrentVideo(clampedIndex);
    }, 300);
  }, [completions.length, scrollToIndex, currentIndex, pauseAllVideos, playCurrentVideo]);

  // Play current video when index changes (but not during scrolling)
  useEffect(() => {
    if (!isScrolling && completions.length > 0) {
      pauseAllVideos();
      setTimeout(() => playCurrentVideo(currentIndex), 100);
    }
  }, [currentIndex, isScrolling, completions.length, pauseAllVideos, playCurrentVideo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const onScroll = () => {
      handleScroll();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 200);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll, handleScrollEnd]);

  // Cleanup: pause all videos when component unmounts or when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      pauseAllVideos();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAllVideos();
      }
    };

    // Add page visibility and beforeunload listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup when component unmounts
      pauseAllVideos();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseAllVideos]);

  // Additional cleanup when router changes (back button, navigation)
  useEffect(() => {
    const handleRouteChange = () => {
      pauseAllVideos();
    };

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('beforeHistoryChange', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('beforeHistoryChange', handleRouteChange);
    };
  }, [router.events, pauseAllVideos]);

  // Interaction handlers for the BeReal-style sidebar
  const handleProfileClick = (completion: ChallengeCompletion) => {
    router.push(`/profile/${completion.user.id}`);
  };

  const handleLikeClick = async (completion: ChallengeCompletion) => {
    // Check if user is logged in
    if (!user?.id) {
      alert('Please log in to like posts');
      return;
    }

    const currentUserId = user.id; // Use actual user ID

    // Optimistic update for immediate UI feedback
    const wasLiked = completion.localIsLiked || false;
    const currentLikes = completion.localLikes || 0;

    // Update UI immediately
    setCompletions((prevCompletions) =>
      prevCompletions.map((comp) => {
        if (comp.id === completion.id) {
          return {
            ...comp,
            localIsLiked: !wasLiked,
            localLikes: wasLiked ? currentLikes - 1 : currentLikes + 1,
          };
        }
        return comp;
      }),
    );

    try {
      // Make API call to persist the like
      const response = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionId: completion.id,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle like');
      }

      console.log('Like toggled successfully:', data);

      // Update with server response to ensure consistency
      setCompletions((prevCompletions) =>
        prevCompletions.map((comp) => {
          if (comp.id === completion.id) {
            return {
              ...comp,
              localIsLiked: data.isLiked,
              localLikes: data.newLikeCount,
            };
          }
          return comp;
        }),
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);

      // Revert optimistic update on error
      setCompletions((prevCompletions) =>
        prevCompletions.map((comp) => {
          if (comp.id === completion.id) {
            return {
              ...comp,
              localIsLiked: wasLiked,
              localLikes: currentLikes,
            };
          }
          return comp;
        }),
      );

      // Show error message to user
      alert('Failed to update like. Please try again.');
    }
  };

  const handleRealMojiCapture = async (imageBlob: Blob, reactionType: string, completionId: string) => {
    console.log('🎭 [RealMoji] Starting capture process:', {
      reactionType,
      completionId,
      blobSize: imageBlob.size,
      userId: user?.id,
    });

    if (!user?.id) {
      alert('Please log in to create RealMoji reactions');
      return;
    }

    try {
      // Show loading state
      console.log('🎭 [RealMoji] Uploading and creating reaction...');

      // Create FormData for the API request
      const formData = new FormData();
      formData.append('image', imageBlob, `realmoji-${reactionType}-${Date.now()}.jpg`);
      formData.append('userId', user.id);
      formData.append('completionId', completionId);
      formData.append('reactionType', reactionType);

      // Make API call to create the RealMoji reaction
      const response = await fetch('/api/reactions/create', {
        method: 'POST',
        body: formData, // Don't set Content-Type, let browser set it for FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      console.log('🎭 [RealMoji] Reaction created successfully:', data);

      // Get the emoji for the reaction type
      const getEmojiForType = (type: string): string => {
        const emojiMap: { [key: string]: string } = {
          thumbsUp: '👍',
          love: '😍',
          shocked: '🤯',
          curious: '🤔',
          fire: '🔥',
          sad: '😢',
        };
        return emojiMap[type] || '😊';
      };

      // Update the local state to show the new reaction immediately
      setCompletions((prevCompletions) =>
        prevCompletions.map((comp) => {
          if (comp.id === completionId) {
            const newReaction = {
              id: data.reactionId,
              reactionType: data.reactionType,
              emoji: data.emoji || getEmojiForType(data.reactionType),
              selfieUrl: data.selfieUrl,
              user: {
                id: user.id!,
                username: user.username || 'You',
                profilePicture: user.profilePicture || '/images/profile.png',
              },
              createdAt: new Date().toISOString(),
            };

            const updatedReactions = [newReaction, ...(comp.recentReactions || [])];

            return {
              ...comp,
              totalReactions: (comp.totalReactions || 0) + 1,
              recentReactions: updatedReactions,
            };
          }
          return comp;
        }),
      );

      // Show success message to user
      const emojiLabel = getEmojiForType(reactionType);
      console.log(`🎭 [RealMoji] Success! ${emojiLabel} RealMoji created`);

      // Optional: You could add a toast notification here instead of alert
      // showToast(`${emojiLabel} RealMoji created! 📸`);
    } catch (error) {
      console.error('🎭 [RealMoji] Failed to create RealMoji:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('log in') || errorMessage.includes('authentication')) {
        alert('Please log in to create RealMoji reactions');
      } else if (errorMessage.includes('upload') || errorMessage.includes('IPFS')) {
        alert('Failed to upload your RealMoji. Check your internet connection and try again.');
      } else if (errorMessage.includes('Database') || errorMessage.includes('not found')) {
        alert('There was an issue saving your RealMoji. Please try again.');
      } else {
        alert('Failed to save your RealMoji. Please try again.');
      }
    }
  };

  // Helper function to get emoji for reaction type
  const getEmojiForType = (reactionType: string): string => {
    const emojiMap: { [key: string]: string } = {
      thumbsUp: '👍',
      love: '😍',
      shocked: '🤯',
      curious: '🤔',
      fire: '🔥',
      sad: '😢',
    };
    return emojiMap[reactionType] || '😊';
  };

  // Don't render anything if user is not loaded yet
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || completions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-4">
        <div className="text-red-400 mb-4 text-lg">{error || 'No completions found'}</div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-white rounded-full text-black font-medium hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {completions.map((completion, index) => {
          const challenge = completion.publicChallenge || completion.privateChallenge || completion.aiChallenge;

          return (
            <div key={completion.id} className="h-screen w-full relative snap-start snap-always overflow-hidden">
              {/* Full-screen video */}
              <div className="absolute inset-0 w-full h-full bg-black">
                {completion.videoUrl ? (
                  <>
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[completion.id] = el;

                          // Add event listeners for play/pause to update button visibility
                          const updatePlayButton = () => {
                            const playButton = document.getElementById(`play-button-${completion.id}`);
                            if (playButton) {
                              playButton.style.display = el.paused ? 'flex' : 'none';
                            }
                          };

                          el.addEventListener('play', updatePlayButton);
                          el.addEventListener('pause', updatePlayButton);
                          el.addEventListener('loadeddata', updatePlayButton);
                        }
                      }}
                      src={completion.videoUrl}
                      className="w-full h-full object-cover cursor-pointer"
                      loop
                      muted={false}
                      playsInline
                      preload="metadata"
                      poster={completion.selfieUrl || undefined}
                      onClick={() => handleVideoClick(completion.id)}
                    />

                    {/* Play button overlay - initially hidden, shown when paused */}
                    <div
                      id={`play-button-${completion.id}`}
                      className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                      style={{ display: 'none' }}
                    >
                      <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-4">📱</div>
                      <div>No video available</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Corner selfie */}
              {completion.selfieUrl && (
                <div className="absolute top-4 right-4 w-48 h-48 rounded-xl overflow-hidden border-2 border-white shadow-lg z-30">
                  <img src={completion.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              )}

              {/* BeReal-Style Interaction Sidebar Component */}
              <InteractionSidebar
                user={completion.user}
                challenge={challenge}
                completionId={completion.id}
                onProfileClick={() => handleProfileClick(completion)}
                onLikeClick={() => handleLikeClick(completion)}
                onRealMojiCapture={handleRealMojiCapture}
                // Use real data from database
                reactions={completion.recentReactions || []}
                totalReactions={completion.totalReactions || 0}
                totalLikes={completion.localLikes || 0}
                isLiked={completion.localIsLiked || false}
              />

              {/* Bottom overlay with user info and challenge details */}
              <div
                className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-8"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
              >
                {/* RealMoji Reactions - positioned above user info */}
                {completion.recentReactions && completion.recentReactions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                      {completion.recentReactions.slice(0, 8).map((reaction, index) => (
                        <div key={reaction.id || index} className="flex-shrink-0 relative">
                          {reaction.selfieUrl ? (
                            // User's RealMoji selfie with emoji overlay - BeReal style
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">
                              <img
                                src={reaction.selfieUrl}
                                alt={`${reaction.user.username}'s ${reaction.reactionType} reaction`}
                                className="w-full h-full object-cover"
                                style={{
                                  objectPosition: 'center 25%', // Focus even more on face area
                                  transform: 'scale(2.2)', // Much more zoom to show just the face
                                  transformOrigin: 'center',
                                }}
                              />
                              {/* Emoji overlay in bottom right corner */}
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm">
                                <span className="text-xs">{reaction.emoji}</span>
                              </div>
                            </div>
                          ) : (
                            // Fallback: just emoji if no selfie
                            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                              <span className="text-lg">{reaction.emoji}</span>
                            </div>
                          )}

                          {/* User indicator on hover/tap */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {reaction.user.username}
                          </div>
                        </div>
                      ))}

                      {/* Show "+X more" if there are more than 8 reactions */}
                      {completion.recentReactions.length > 8 && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                          <span className="text-xs text-white font-medium">
                            +{completion.recentReactions.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* User info */}
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-white font-bold text-lg drop-shadow-lg">@{completion.user.username}</p>
                    <span className="text-white/80 text-sm drop-shadow-lg">
                      {new Date(completion.completionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Challenge description */}
                <div className="mb-3">
                  <h3 className="text-white font-bold text-base mb-1 drop-shadow-lg">{challenge?.title}</h3>
                  <p className="text-white text-sm drop-shadow-lg leading-relaxed">{challenge?.description}</p>
                </div>

                {/* User's completion description */}
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 text-sm drop-shadow-lg">"Completed the challenge!"</span>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center space-x-1 mt-3">
                  {completions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-1'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Top safe area for status bar */}
              <div
                className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-20"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowsingPage;
