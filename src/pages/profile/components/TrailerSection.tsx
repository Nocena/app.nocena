import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateTrailerVideo } from '../../../lib/api/dgraph';
import { unpinFromPinata } from '../../../lib/api/pinata';
import { getPageState, updatePageState } from '../../../components/PageManager';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import PenIcon from '../../../components/icons/pen';

interface TrailerSectionProps {
  currentStreak: number;
  totalChallenges: number;
  tokenBalance: number;
  user?: any; // Optional user data for read-only mode
  isOtherProfile?: boolean; // Flag to indicate read-only mode
}

const TrailerSection: React.FC<TrailerSectionProps> = ({
  currentStreak,
  totalChallenges,
  tokenBalance,
  user: externalUser,
  isOtherProfile = false,
}) => {
  const { user, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use external user for other profiles, or auth user for own profile
  const profileUser = isOtherProfile ? externalUser : user;

  // Use user's trailer video or default
  const [trailerVideo, setTrailerVideo] = useState<string>(profileUser?.trailerVideo || '/trailer.mp4');
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const isDefaultVideo = trailerVideo === '/trailer.mp4';

  // Update trailer video when user changes
  useEffect(() => {
    if (profileUser) {
      setTrailerVideo(profileUser.trailerVideo || '/trailer.mp4');
    }
  }, [profileUser]);

  // Auto-play video when it loads
  useEffect(() => {
    const video = videoRef.current;
    if (video && !isDefaultVideo) {
      const playVideo = async () => {
        try {
          await video.play();
          setIsVideoPlaying(true);
        } catch (error) {
          console.log('Auto-play prevented:', error);
          setIsVideoPlaying(false);
        }
      };

      // Small delay to ensure video is ready
      const timer = setTimeout(playVideo, 100);
      return () => clearTimeout(timer);
    }
  }, [trailerVideo, isDefaultVideo]);

  const handleVideoClick = () => {
    // Only allow video upload for own profile
    if (!isOtherProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user && !isOtherProfile) {
      setIsUploading(true);
  
      try {
        // Validate file type
        if (!file.type.startsWith('video/')) {
          alert('Please select a valid video file.');
          return;
        }
  
        // Check file size (max 100MB for video)
        if (file.size > 100 * 1024 * 1024) {
          alert('Video file must be smaller than 100MB.');
          return;
        }
  
        console.log('Starting video compression and upload...');
  
        // Convert to base64 - no compression for video files, handle them as-is
        const reader = new FileReader();
  
        reader.onloadend = async () => {
          try {
            const base64String = (reader.result as string).replace(/^data:.+;base64,/, '');
  
            // Clean up old trailer video if it's not the default
            if (
              user.trailerVideo &&
              user.trailerVideo !== '/trailer.mp4' &&
              !user.trailerVideo.includes('/trailer.mp4')
            ) {
              const oldCid = user.trailerVideo.includes('/') ? user.trailerVideo.split('/').pop() : user.trailerVideo;
              if (oldCid) {
                await unpinFromPinata(oldCid).catch((error) => {
                  console.warn('Failed to unpin old trailer video:', error);
                });
              }
            }
  
            // Upload new video to IPFS
            const response = await fetch('/api/pinFileToIPFS', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64String,
                fileName: `trailer-${user.id}-${Date.now()}.${file.name.split('.').pop()}`,
                fileType: 'video',
              }),
            });
  
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
  
            const result = await response.json();
  
            // Check for the correct response format from your API
            const ipfsUrl = result.ipfsHash 
              ? `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}` 
              : result.url; // Fallback to url if that's what your API returns
  
            setTrailerVideo(ipfsUrl);
  
            // Update in database
            await updateTrailerVideo(user.id, ipfsUrl);
  
            // Update user state (same pattern as profile picture)
            const updatedUser = { ...user, trailerVideo: ipfsUrl };
            login(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
  
            // Update page cache
            const profileCacheKey = `profile_${user.id}`;
            updatePageState(profileCacheKey, {
              ...(getPageState()[profileCacheKey]?.data || {}),
              trailerVideo: ipfsUrl,
            });
  
            console.log('Trailer video successfully updated.');
          } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to update trailer video. Please try again.');
          } finally {
            setIsUploading(false);
          }
        };
  
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Video upload failed:', error);
        alert('Video upload failed. Please try with a different video.');
        setIsUploading(false);
      }
    }
  };
  
  return (
    <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPink" rounded="xl" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{isOtherProfile ? `${profileUser?.username}'s Trailer` : 'My Trailer'}</h3>
        {!isOtherProfile && (
          <button
            onClick={handleVideoClick}
            disabled={isUploading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Change trailer video"
          >
            <PenIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Video Player - Similar to VideoReviewScreen */}
      <div className="mb-4 flex justify-center">
        <div className="relative rounded-2xl overflow-hidden bg-black w-64 h-80 shadow-2xl">
          <video
            ref={videoRef}
            src={trailerVideo}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Trailer video loading error:', e);
              // Fallback to default video if custom video fails
              if (!isDefaultVideo) {
                setTrailerVideo('/trailer.mp4');
              }
            }}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onLoadedData={() => {
              // Auto-play when video loads (if not default)
              if (!isDefaultVideo && videoRef.current) {
                videoRef.current.play().catch(console.log);
              }
            }}
            preload="metadata"
            playsInline
            muted={isDefaultVideo} // Only mute if it's the default video
            loop
            autoPlay={!isDefaultVideo} // Auto-play custom videos
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            onClick={(e) => {
              // Only allow play/pause if it's not the default video
              if (!isDefaultVideo) {
                const video = e.target as HTMLVideoElement;
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }
            }}
            style={
              {
                WebkitPlaysinline: true,
              } as React.CSSProperties
            }
          />

          {/* Upload overlay - only show when pen icon is clicked or when video is default (and not other profile) */}
          {(isDefaultVideo || isUploading) && !isOtherProfile && (
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
              onClick={handleVideoClick}
            >
              <div className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                {isUploading ? 'Uploading...' : 'Add Your Trailer'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="text-center">
        <p className="text-sm text-white/60">
          {isOtherProfile
            ? isDefaultVideo
              ? `${profileUser?.username} hasn't uploaded a trailer yet`
              : `${profileUser?.username}'s challenge trailer`
            : isDefaultVideo
              ? 'Upload a trailer video to showcase your challenge journey'
              : 'Your personal challenge trailer'}
        </p>
      </div>

      {/* Hidden file input - only for own profile */}
      {!isOtherProfile && (
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleVideoUpload}
        />
      )}
    </ThematicContainer>
  );
};

export default TrailerSection;
