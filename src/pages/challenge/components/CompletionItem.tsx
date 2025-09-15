// components/home/CompletionItem.tsx - FIXED VERSION
import React from 'react';
import Image from 'next/image';
import { getProfilePictureUrl, getVideoUrl, getSelfieUrl } from '../../../lib/api/pinata';
import IPFSMediaLoader from '../../../components/IPFSMediaLoader';
import ThematicContainer from '../../../components/ui/ThematicContainer';

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
    <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="p-6 mb-4">
      {/* User profile section */}
      <div className="flex items-center mb-4">
        <ThematicContainer
          asButton={false}
          color="nocenaPink"
          rounded="full"
          className="h-12 w-12 overflow-hidden flex-shrink-0"
        >
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
        </ThematicContainer>

        <div className="ml-4 flex-1">
          <p className="font-bold text-white text-lg">{profile.username}</p>
          <p className="text-sm text-gray-300">
            {completionDate.toLocaleDateString()} at {completionDate.toLocaleTimeString()}
          </p>
          {completion.status && (
            <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1 mt-1 inline-block">
              <span className="text-xs font-medium capitalize">{completion.status}</span>
            </ThematicContainer>
          )}
        </div>
      </div>

      {/* Challenge description if available */}
      {media?.description && (
        <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPurple" rounded="lg" className="p-3 mb-4">
          <p className="text-sm text-white italic">"{media.description}"</p>
        </ThematicContainer>
      )}

      {/* Video and selfie content */}
      {videoUrl || selfieUrl ? (
        <ThematicContainer asButton={false} color="nocenaBlue" rounded="lg" className="mb-4 overflow-hidden">
          <IPFSMediaLoader videoUrl={videoUrl} selfieUrl={selfieUrl} className="w-full" loop={true} />
        </ThematicContainer>
      ) : (
        <ThematicContainer
          asButton={false}
          glassmorphic={true}
          color="nocenaPurple"
          rounded="lg"
          className="p-4 mb-4 text-center"
        >
          <p className="text-gray-300">Media not available</p>
          {media && (
            <p className="text-xs mt-1 text-gray-400">
              Video: {media.hasVideo ? 'Yes' : 'No'} | Selfie: {media.hasSelfie ? 'Yes' : 'No'}
            </p>
          )}
        </ThematicContainer>
      )}

      {/* Verification status if available */}
      {media?.verificationResult && (
        <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPink" rounded="lg" className="p-3 mb-4">
          <div className="flex items-center">
            <span className="text-green-400 mr-2 text-lg">✓</span>
            <p className="text-sm font-medium">
              Verified with {Math.round((media.verificationResult.overallConfidence || 0) * 100)}% confidence
            </p>
          </div>
        </ThematicContainer>
      )}

      {/* Action buttons and stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ThematicContainer asButton={true} color="nocenaPink" className="px-3 py-2 flex items-center">
            <span className="text-red-400 mr-2">♥</span>
            <span className="text-sm font-medium">{completion.likesCount || 0}</span>
          </ThematicContainer>
        </div>

        {isSelf && (
          <ThematicContainer asButton={false} color="nocenaBlue" className="px-3 py-1">
            <span className="text-xs font-medium">Your completion</span>
          </ThematicContainer>
        )}
      </div>
    </ThematicContainer>
  );
};

export default CompletionItem;
