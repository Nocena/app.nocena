// pages/browsing.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

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
}

const BrowsingPage: React.FC = () => {
  const router = useRouter();
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
  }, []); // Remove challengeId dependency since we handle it inside the function

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

      // Use the same query for both cases since we'll filter client-side
      const query = `
        query GetChallengeCompletions {
          queryChallengeCompletion {
            id
            user {
              id
              username
              profilePicture
            }
            completionDate
            media
            challengeType
            publicChallenge {
              id
              title
              description
              reward
            }
            aiChallenge {
              id
              title
              description
              reward
              frequency
            }
            privateChallenge {
              id
              title
              description
              reward
            }
          }
        }
      `;

      // No variables needed since we're doing client-side filtering
      const variables = {};

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
            'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
          }),
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to fetch completions');
      }

      let allCompletions = data.data.queryChallengeCompletion || [];

      // If we have a specific challengeId, filter the results client-side
      // since the GraphQL filter might not be working as expected
      if (challengeId && allCompletions.length > 0) {
        allCompletions = allCompletions.filter((completion: any) => 
          completion.publicChallenge && completion.publicChallenge.id === challengeId
        );
      }

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

              {/* TikTok-style right sidebar */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center space-y-6 z-40">
                {/* Profile picture */}
                <div className="relative">
                  <img
                    src={completion.user.profilePicture || '/images/profile.png'}
                    alt={completion.user.username}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>

                {/* Like button */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {Math.floor(Math.random() * 50 + 10)}K
                  </span>
                </div>

                {/* Comment button */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {Math.floor(Math.random() * 5000 + 100)}
                  </span>
                </div>

                {/* Share button */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-lg">Share</span>
                </div>

                {/* Nocenix token display */}
                <div className="flex flex-col items-center mt-4">
                  <div className="w-10 h-10 rounded-full border-2 border-pink-500 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <img src="/nocenix.ico" alt="Nocenix" className="w-6 h-6" />
                  </div>
                  <span className="text-pink-500 text-xs font-bold drop-shadow-lg mt-1">+{challenge?.reward}</span>
                </div>
              </div>

              {/* Bottom overlay with user info and challenge details */}
              <div
                className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-8"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
              >
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