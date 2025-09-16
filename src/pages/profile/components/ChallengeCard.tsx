import React, { useCallback, useRef } from 'react';
import { Clock, Heart, Play, Star } from 'lucide-react';
import { completionItem } from '../../../lib/types';

interface ChallengeCardProps {
  challenge: completionItem;
  onClick?: (challenge: completionItem) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onClick }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playButtonRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch((err) => console.log('Play failed:', err));
      } else {
        video.pause();
      }

      // Update the play button visibility manually
      const playButton = playButtonRef.current;
      if (playButton) {
        // Small delay to let the video state update
        setTimeout(() => {
          playButton.style.display = video.paused ? 'flex' : 'none';
        }, 50);
      }
    }
  }, []);

  return (
    <div
      onClick={() => onClick?.(challenge)}
      className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:border-nocenaBlue transition-all duration-300 cursor-pointer group"
    >
      {/* Video Thumbnail */}
      <div className="relative">
        <>
          <video
            ref={(el) => {
              if (el) {
                videoRef.current = el;

                // Add event listeners for play/pause to update button visibility
                const updatePlayButton = () => {
                  const playButton = playButtonRef.current;
                  if (playButton) {
                    playButton.style.display = el.paused ? 'flex' : 'none';
                  }
                };

                el.addEventListener('play', updatePlayButton);
                el.addEventListener('pause', updatePlayButton);
                el.addEventListener('loadeddata', updatePlayButton);
              }
            }}
            src={challenge.videoUrl}
            className="w-full h-56 object-cover cursor-pointer"
            loop
            muted={false}
            playsInline
            preload="metadata"
            poster={challenge.selfieUrl || undefined}
            onClick={handleVideoClick}
          />
          {/* Play button overlay - initially hidden, shown when paused */}
          <div
            ref={playButtonRef}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            style={{ display: 'none' }}
          >
            <button
              className="bg-nocenaPink hover:bg-nocenaPurple text-white p-4 rounded-full transition-colors duration-200"
            >
              <Play className="w-6 h-6 fill-current" />
            </button>
          </div>
        </>


        {/* Creator Avatar - Top Right */}
        <div className="absolute top-3 right-3">
          <img
            src={challenge.selfieUrl}
            alt="Creator"
            className="w-16 h-16 rounded-lg border-2 border-white shadow-lg object-cover"
          />
        </div>

        {/* Play Button Overlay */}
{/*
        <div
          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePlayClick}
            className="bg-nocenaPink hover:bg-nocenaPurple text-white p-4 rounded-full transition-colors duration-200"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>
*/}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
          {challenge.challenge.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {challenge.challenge.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3 text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(challenge.completionDate)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{challenge.likesCount}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <img
              src="/images/nocena-token.png"
              alt="Token Image"
              className="w-5 h-5 rounded-full"
            />
            <span className="text-nocenaBlue font-bold">
              {challenge.challenge.reward} NCX
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};