// components/home/CompletionItem.tsx
import React from 'react';
import Image from 'next/image';
import { getProfilePictureUrl, getVideoUrl, getSelfieUrl } from '../../../lib/api/pinata';
import { parseMediaMetadata } from '../../../lib/api/dgraph';
import IPFSMediaLoader from '../../../components/IPFSMediaLoader';

interface ProfileInfo {
  userId: string;
  username: string;
  profilePicture: string | null;
}

interface MediaMetadata {
  // Support both new format (individual CIDs)
  videoCID?: string;
  selfieCID?: string;
  // Support old format (directory structure)
  directoryCID?: string;
  videoFileName?: string;
  selfieFileName?: string;
  // Common properties
  hasVideo?: boolean;
  hasSelfie?: boolean;
  timestamp?: number;
}

interface CompletionItemProps {
  profile: ProfileInfo;
  completion: any;
  isSelf: boolean;
}

const CompletionItem: React.FC<CompletionItemProps> = ({
  profile,
  completion,
  isSelf
}) => {
  // Handle different media metadata formats
  let media: MediaMetadata | null = null;
  
  if (completion.media) {
    // Parse string metadata if needed
    media = typeof completion.media === 'string' 
      ? parseMediaMetadata(completion.media) 
      : completion.media;
  }
  
  const completionDate = new Date(completion.date || completion.completionDate);
  
  // Get media URLs using our centralized functions that support both formats
  const videoUrl = media ? getVideoUrl(media) : null;
  const selfieUrl = media ? getSelfieUrl(media) : null;
  const profilePicUrl = getProfilePictureUrl(profile.profilePicture);
  
  // For debugging - remove in production
  console.log('Media metadata:', media);
  console.log('Video URL:', videoUrl);
  console.log('Selfie URL:', selfieUrl);
  
  return (
    <div className="bg-[#2A3B4D] rounded-xl p-4 border border-[#4A5B6D]">
      {/* User profile section */}
      <div className="flex items-center mb-3">
        <div className="h-12 w-12 rounded-full bg-gray-700 overflow-hidden">
          <Image 
            src={profilePicUrl}
            alt={profile.username} 
            width={48} 
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="ml-3">
          <p className="font-semibold">{profile.username}</p>
          <p className="text-xs text-gray-400">
            {completionDate.toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      {/* Video and selfie content using the resilient loader */}
      {(videoUrl || selfieUrl) ? (
        <IPFSMediaLoader
          videoUrl={videoUrl}
          selfieUrl={selfieUrl}
          className="mb-3"
        />
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 mb-3 text-center text-gray-400">
          <p>Media not available</p>
        </div>
      )}
      
      {/* Like/comment actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{completion.likesCount || 0}</span>
          </button>
        </div>
        
        {isSelf && (
          <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-full">
            Your completion
          </span>
        )}
      </div>
    </div>
  );
};

export default CompletionItem;