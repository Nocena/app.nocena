// pages/browsing/components/InteractionSidebar.tsx - ENHANCED VERSION
import React, { useState } from 'react';
import RealMojiCapture from './RealMojiCapture';

interface RealMoji {
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
}

interface InteractionSidebarProps {
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  challenge?: {
    reward: number;
  };
  completionId: string;
  onProfileClick?: () => void;
  onReactionClick?: (reactionType: string) => void;
  onInstantReactionClick?: () => void;
  onLikeClick?: () => void;
  onRealMojiCapture?: (imageBlob: Blob, reactionType: string, completionId: string) => void;
  onRealMojiStart?: () => void;
  reactions?: RealMoji[];
  totalReactions?: number;
  totalLikes?: number;
  isLiked?: boolean;
}

const InteractionSidebar: React.FC<InteractionSidebarProps> = ({
  user,
  challenge,
  completionId,
  onProfileClick,
  onReactionClick,
  onInstantReactionClick,
  onLikeClick,
  onRealMojiCapture,
  onRealMojiStart,
  reactions = [],
  totalReactions,
  totalLikes,
  isLiked = false,
}) => {
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showRealMojiCapture, setShowRealMojiCapture] = useState(false);
  const [isCreatingRealMoji, setIsCreatingRealMoji] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<{
    emoji: string;
    type: string;
    label: string;
  } | null>(null);

  // Available emoji reactions like BeReal
  const emojiReactions = [
    { type: 'thumbsUp' as const, emoji: '👍', label: 'Thumbs Up' },
    { type: 'love' as const, emoji: '😍', label: 'Love Eyes' },
    { type: 'shocked' as const, emoji: '🤯', label: 'Mind Blown' },
    { type: 'curious' as const, emoji: '🤔', label: 'Curious' },
    { type: 'fire' as const, emoji: '🔥', label: 'Fire' },
    { type: 'sad' as const, emoji: '😢', label: 'Sad' },
  ];

  const handleReactionMenuToggle = () => {
    if (isCreatingRealMoji) return; // Prevent opening menu while creating RealMoji
    setShowReactionMenu(!showReactionMenu);
  };

  const handleReactionSelect = (reactionType: string) => {
    const selectedEmojiData = emojiReactions.find((r) => r.type === reactionType);
    if (selectedEmojiData) {
      setSelectedReaction(selectedEmojiData);
      setShowReactionMenu(false);
      setShowRealMojiCapture(true);

      // Notify parent that RealMoji capture is starting
      onRealMojiStart?.();
    }
  };

  const handleInstantReaction = () => {
    if (isCreatingRealMoji) return; // Prevent multiple captures

    // For instant reaction (lightning bolt), randomly select an emoji for demo
    const randomEmoji = emojiReactions[Math.floor(Math.random() * emojiReactions.length)];
    setSelectedReaction(randomEmoji);
    setShowReactionMenu(false);
    setShowRealMojiCapture(true);

    // Notify parent that RealMoji capture is starting
    onRealMojiStart?.();
  };

  const handleRealMojiCaptured = async (imageBlob: Blob, reactionType: string) => {
    console.log('🎭 [Sidebar] RealMoji captured:', { reactionType, completionId, blobSize: imageBlob.size });

    setIsCreatingRealMoji(true);

    try {
      // Call the parent handler
      await onRealMojiCapture?.(imageBlob, reactionType, completionId);

      // Close the capture modal on success
      setShowRealMojiCapture(false);
      setSelectedReaction(null);
    } catch (error) {
      console.error('🎭 [Sidebar] Error in RealMoji capture:', error);
      // Keep the modal open so user can retry if needed
    } finally {
      setIsCreatingRealMoji(false);
    }
  };

  const handleCloseCaptureModal = () => {
    if (isCreatingRealMoji) {
      // Don't allow closing while processing
      return;
    }

    setShowRealMojiCapture(false);
    setSelectedReaction(null);
    // Note: RealMoji capture component will handle its own camera cleanup
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      <div className="absolute right-3 bottom-24 flex flex-col items-center space-y-6 z-40">
        {/* Profile picture */}
        <div className="relative cursor-pointer" onClick={onProfileClick}>
          <img
            src={user.profilePicture || '/images/profile.png'}
            alt={user.username}
            className="w-12 h-12 rounded-full border-2 border-white object-cover"
          />
        </div>

        {/* TikTok-style Like button */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center cursor-pointer" onClick={onLikeClick}>
            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <svg
                className={`w-6 h-6 drop-shadow-lg transition-colors duration-200 ${
                  isLiked ? 'text-red-500 fill-current' : 'text-white'
                }`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          </div>
          {/* Show like count */}
          {totalLikes !== undefined && (
            <span className="text-white text-xs font-semibold drop-shadow-lg mt-1">{formatCount(totalLikes)}</span>
          )}
        </div>

        {/* Reaction button (similar to BeReal's smiley face) */}
        <div className="flex flex-col items-center">
          <div
            className={`w-12 h-12 flex items-center justify-center cursor-pointer relative ${
              isCreatingRealMoji ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={handleReactionMenuToggle}
          >
            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              {isCreatingRealMoji ? (
                // Loading spinner when creating RealMoji
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-6 h-6 text-white drop-shadow-lg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              )}
            </div>
          </div>
          {/* Show reaction count even if 0, but only if totalReactions is defined */}
          {totalReactions !== undefined && (
            <span className="text-white text-xs font-semibold drop-shadow-lg mt-1">{formatCount(totalReactions)}</span>
          )}
        </div>

        {/* Nocenix token display */}
        {challenge?.reward && (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500 bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <img src="/nocenix.ico" alt="Nocenix" className="w-6 h-6" />
            </div>
            <span className="text-pink-500 text-xs font-bold drop-shadow-lg mt-1">+{challenge.reward}</span>
          </div>
        )}
      </div>

      {/* BeReal-style reaction menu overlay */}
      {showReactionMenu && !isCreatingRealMoji && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">Choose a RealMoji</h3>
              <button
                onClick={() => setShowReactionMenu(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {emojiReactions.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReactionSelect(reaction.type)}
                  className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-3xl mb-2">{reaction.emoji}</span>
                  <span className="text-xs text-gray-600 text-center">{reaction.label}</span>
                </button>
              ))}
            </div>

            {/* Instant RealMoji (Lightning bolt) */}
            <button
              onClick={handleInstantReaction}
              className="w-full p-4 rounded-xl border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 transition-colors flex items-center justify-center space-x-3"
            >
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-medium text-gray-700">Instant RealMoji</span>
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">Take a photo of your reaction to create a RealMoji</p>
          </div>
        </div>
      )}

      {/* Processing overlay when creating RealMoji */}
      {isCreatingRealMoji && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-black mb-2">Creating your RealMoji</h3>
            <p className="text-sm text-gray-600">Uploading to IPFS and saving to database...</p>
          </div>
        </div>
      )}

      {/* RealMoji Capture Modal */}
      <RealMojiCapture
        isOpen={showRealMojiCapture}
        onClose={handleCloseCaptureModal}
        selectedEmoji={selectedReaction}
        onCapture={handleRealMojiCaptured}
        completionId={completionId}
      />
    </>
  );
};

export default InteractionSidebar;
