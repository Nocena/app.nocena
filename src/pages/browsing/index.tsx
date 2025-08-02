// pages/browsing.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import IPFSMediaLoader from '../../components/IPFSMediaLoader';
import VideoBackground from '../../components/layout/BackgroundVideo';
import ArrowBackIcon from '../../components/icons/back';
import ThematicContainer from '../../components/ui/ThematicContainer';

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
}

const BrowsingPage: React.FC = () => {
  const router = useRouter();
  const { challengeId, userId } = router.query;

  const [completion, setCompletion] = useState<ChallengeCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId || !userId) return;

    fetchChallengeCompletion();
  }, [challengeId, userId]);

  const fetchChallengeCompletion = async () => {
    try {
      setLoading(true);

      const query = `
        query GetChallengeCompletion {
          queryChallengeCompletion(filter: { 
            has: publicChallenge
          }) {
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
          }
        }
      `;

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
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to fetch completion');
      }

      const completions = data.data.queryChallengeCompletion || [];

      // Find the completion for the specific challenge and user
      const targetCompletion = completions.find(
        (comp: any) => comp.publicChallenge?.id === challengeId && comp.user?.id === userId,
      );

      if (!targetCompletion) {
        throw new Error('Challenge completion not found');
      }

      setCompletion(targetCompletion);

      // Parse media data and construct IPFS URLs
      try {
        const media = JSON.parse(targetCompletion.media);

        // Construct IPFS gateway URLs
        const videoCID = media.videoCID || media.directoryCID;
        const selfieCID = media.selfieCID || media.directoryCID;

        if (videoCID) {
          setVideoUrl(`https://gateway.pinata.cloud/ipfs/${videoCID}`);
        }
        if (selfieCID) {
          setSelfieUrl(`https://gateway.pinata.cloud/ipfs/${selfieCID}`);
        }
      } catch (parseError) {
        console.error('Error parsing media data:', parseError);
        setError('Invalid media data format');
      }
    } catch (err) {
      console.error('Error fetching challenge completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to load completion');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col relative">
        <VideoBackground videoSrc="/AppBG.mp4" />

        {/* Header with back button */}
        <div
          className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 mt-4"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: '0.5rem',
          }}
        >
          <button onClick={handleBack} className="focus:outline-none" aria-label="Back">
            <ThematicContainer
              color="nocenaBlue"
              glassmorphic={true}
              asButton={false}
              rounded="full"
              className="w-12 h-12 flex items-center justify-center"
            >
              <ArrowBackIcon className="transition-colors duration-300" style={{ color: 'white' }} />
            </ThematicContainer>
          </button>
          <div className="flex-grow"></div>
          <div className="w-12"></div>
        </div>

        {/* Loading content */}
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nocenaPink"></div>
        </div>
      </div>
    );
  }

  if (error || !completion) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col relative">
        <VideoBackground videoSrc="/AppBG.mp4" />

        {/* Header with back button */}
        <div
          className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 mt-4"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: '0.5rem',
          }}
        >
          <button onClick={handleBack} className="focus:outline-none" aria-label="Back">
            <ThematicContainer
              color="nocenaBlue"
              glassmorphic={true}
              asButton={false}
              rounded="full"
              className="w-12 h-12 flex items-center justify-center"
            >
              <ArrowBackIcon className="transition-colors duration-300" style={{ color: 'white' }} />
            </ThematicContainer>
          </button>
          <div className="flex-grow"></div>
          <div className="w-12"></div>
        </div>

        {/* Error content */}
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <div className="text-red-400 mb-4 text-lg">{error || 'Challenge completion not found'}</div>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-nocenaPink rounded-full text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const challenge = completion.publicChallenge || completion.privateChallenge || completion.aiChallenge;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative">
      {/* Background Video */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Header with back button - positioned outside the full-screen media */}
      <div
        className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-[100] mt-4"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: '0.5rem',
        }}
      >
        <button onClick={handleBack} className="focus:outline-none" aria-label="Back">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <ArrowBackIcon className="transition-colors duration-300" style={{ color: 'white' }} />
          </ThematicContainer>
        </button>
        <div className="flex-grow"></div>
        <div className="w-12"></div>
      </div>

      {/* Full-screen media container */}
      <div className="absolute inset-0 bg-black">
        {/* Full-screen media with IPFSMediaLoader */}
        <div className="absolute inset-0">
          <IPFSMediaLoader videoUrl={videoUrl} selfieUrl={selfieUrl} className="w-full h-full" loop={true} />
        </div>

        {/* User info overlay - bottom left */}
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={completion.user.profilePicture || '/images/profile.png'}
              alt={completion.user.username}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold text-lg">@{completion.user.username}</p>
              <p className="text-white/80 text-sm">{new Date(completion.completionDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Challenge info */}
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-white font-bold text-lg mb-2">{challenge?.title}</h3>
            <p className="text-white/90 text-sm mb-3">{challenge?.description}</p>

            {/* Reward display */}
            <div className="flex items-center space-x-2">
              <span className="text-nocenaPink font-semibold">+{challenge?.reward}</span>
              <img src="/nocenix.ico" alt="Nocenix" className="w-5 h-5" />
              <span className="text-white/80 text-sm">NOCENIX earned</span>
            </div>
          </div>
        </div>

        {/* TikTok-style right sidebar (placeholder for future) */}
        <div className="absolute right-4 bottom-32 top-32 flex flex-col justify-center space-y-6 z-30">
          {/* Like button placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>

          {/* Comment button placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          {/* Share button placeholder */}
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowsingPage;
