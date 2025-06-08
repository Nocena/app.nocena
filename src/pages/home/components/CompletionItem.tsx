// components/home/CompletionItem.tsx - FIXED VERSION
import React from 'react';
import Image from 'next/image';
import { getProfilePictureUrl, getVideoUrl, getSelfieUrl } from '../../../lib/api/pinata';
import IPFSMediaLoader from '../../../components/IPFSMediaLoader';

interface ProfileInfo {
  userId: string;
  username: string;
  profilePicture: string | null;
}

interface MediaMetadata {
  // New format (individual CIDs) - this is what you're using now
  videoCID?: string;
  selfieCID?: string;
  // Old format (directory structure) - for backwards compatibility
  directoryCID?: string;
  videoFileName?: string;
  selfieFileName?: string;
  // Common properties
  hasVideo?: boolean;
  hasSelfie?: boolean;
  timestamp?: number;
  description?: string;
  verificationResult?: any;
}

interface CompletionItemProps {
  profile: ProfileInfo;
  completion: any;
  isSelf: boolean;
}

const CompletionItem: React.FC<CompletionItemProps> = ({ profile, completion, isSelf }) => {
  // Parse media metadata from the completion
  let media: MediaMetadata | null = null;

  try {
    if (completion.media) {
      if (typeof completion.media === 'string') {
        media = JSON.parse(completion.media);
      } else {
        media = completion.media;
      }
    }
  } catch (error) {
    console.error('Error parsing media metadata:', error);
  }

  // Handle the nested structure from your data
  if (media && media.directoryCID && typeof media.directoryCID === 'string') {
    try {
      const nestedData = JSON.parse(media.directoryCID);
      if (nestedData.videoCID || nestedData.selfieCID) {
        media = { ...media, ...nestedData };
      }
    } catch (error) {
      console.error('Error parsing nested directoryCID:', error);
    }
  }

  const completionDate = new Date(completion.completionDate || completion.date);

  // Get media URLs using the centralized functions
  const videoUrl = media ? getVideoUrl(media) : null;
  const selfieUrl = media ? getSelfieUrl(media) : null;
  const profilePicUrl = getProfilePictureUrl(profile.profilePicture);

  // Debug logging
  console.log('Completion data:', completion);
  console.log('Parsed media:', media);
  console.log('Video URL:', videoUrl);
  console.log('Selfie URL:', selfieUrl);

  return (
    <div className="bg-[#2A3B4D] rounded-xl p-4 border border-[#4A5B6D] mb-4">
      {/* User profile section */}
      <div className="flex items-center mb-3">
        <div className="h-12 w-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
          <Image
            src={profilePicUrl}
            alt={profile.username}
            width={48}
            height={48}
            className="object-cover w-full h-full"
            onError={(e) => {
              // Fallback to default image on error
              e.currentTarget.src = '/images/profile.png';
            }}
          />
        </div>
        <div className="ml-3 flex-1">
          <p className="font-semibold text-white">{profile.username}</p>
          <p className="text-xs text-gray-400">
            {completionDate.toLocaleDateString()} at {completionDate.toLocaleTimeString()}
          </p>
          {completion.status && <p className="text-xs text-green-400 capitalize">{completion.status}</p>}
        </div>
      </div>

      {/* Challenge description if available */}
      {media?.description && (
        <div className="mb-3">
          <p className="text-sm text-gray-300 italic">"{media.description}"</p>
        </div>
      )}

      {/* Video and selfie content */}
      {videoUrl || selfieUrl ? (
        <div className="mb-3">
          <IPFSMediaLoader videoUrl={videoUrl} selfieUrl={selfieUrl} className="rounded-lg overflow-hidden" />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 mb-3 text-center text-gray-400">
          <p>Media not available</p>
          {media && (
            <p className="text-xs mt-1">
              Video: {media.hasVideo ? 'Yes' : 'No'} | Selfie: {media.hasSelfie ? 'Yes' : 'No'}
            </p>
          )}
        </div>
      )}

      {/* Verification status if available */}
      {media?.verificationResult && (
        <div className="mb-3 p-2 bg-gray-700 rounded-md">
          <p className="text-xs text-green-400">
            ✓ Verified with {Math.round((media.verificationResult.overallConfidence || 0) * 100)}% confidence
          </p>
        </div>
      )}

      {/* Action buttons and stats */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{completion.likesCount || 0}</span>
          </button>

          {/* Challenge type indicator */}
          {completion.challengeType && (
            <span className="text-xs px-2 py-1 bg-purple-900 text-purple-300 rounded-full">
              {completion.challengeType.toUpperCase()}
            </span>
          )}
        </div>

        {isSelf && <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-full">Your completion</span>}
      </div>
    </div>
  );
};

export default CompletionItem;
