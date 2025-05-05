import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import AuthContext from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast'; 
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThematicImage from '../../components/ui/ThematicImage';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ChallengeFormData } from '../../lib/map/types';

// Types for challenge mode
type ChallengeMode = 'private' | 'public';
type ParticipantCount = 10 | 25 | 50 | 100 | 250 | 500 | 1000;

interface CreateChallengeViewProps {
  mode?: ChallengeMode;
  targetUserId?: string;
  targetUsername?: string;
  targetProfilePic?: string;
  lat?: string;
  lng?: string;
  onSubmit?: (challengeData: ChallengeFormData) => void;
}

const CreateChallengeView: React.FC<CreateChallengeViewProps> = ({
  mode = 'public',
  targetUserId,
  targetUsername,
  targetProfilePic,
  lat,
  lng,
  onSubmit
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const router = useRouter();
  const [challengeName, setChallengeName] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState(1); // Default to 1 NOCENIX
  const [customReward, setCustomReward] = useState('1'); // Default to 1 NOCENIX
  const [participants, setParticipants] = useState<ParticipantCount>(10); // Default to 10 participants
  
  // Dropdown toggles
  const [isRewardDropdownOpen, setIsRewardDropdownOpen] = useState(false);
  const [isParticipantsDropdownOpen, setIsParticipantsDropdownOpen] = useState(false);
  
  // Sample reward options
  const rewardOptions = [1, 5, 10, 25, 50, 100, 150];
  const participantOptions: ParticipantCount[] = [10, 25, 50, 100, 250, 500, 1000];
  
  // Calculate total cost for public challenges only
  const totalCost = mode === 'public' ? reward * participants : reward;
  
  // Set reward when customReward changes
  useEffect(() => {
    const newReward = parseInt(customReward);
    if (!isNaN(newReward) && newReward > 0) {
      setReward(newReward);
    }
  }, [customReward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
      toast.error("You must be logged in to create a challenge");
      return;
    }
    
    // Show loading state (you might want to add a loading state to your component)
    // setIsLoading(true);
    
    const challengeData: ChallengeFormData = {
      challengeName,
      description,
      reward,
      participants: mode === 'public' ? participants : 1,
      totalCost,
      ...(mode === 'private' && targetUserId && { targetUserId }),
      ...(mode === 'public' && lat && lng && {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      })
    };
    
    try {
      const response = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          challengeData,
          mode
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message
        toast.success(result.message);
        
        // Redirect based on mode
        if (mode === 'private' && targetUserId) {
          router.push(`/profile/${targetUserId}`);
        } else {
          router.push('/map');
        }
      } else {
        // Show error message
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge. Please try again.');
    } finally {
      // Hide loading state
      // setIsLoading(false);
    }
    
    // If onSubmit prop is provided, call it with the challenge data
    if (onSubmit) {
      onSubmit(challengeData);
    }
  };

  return (
    <div className="flex flex-col items-center w-full px-4 text-white">
      {/* Profile Image with Thematic Border */}
      <div className="mt-6 mb-8">
        <ThematicImage className="w-24 h-24">
          <Image
            src={mode === 'private' && targetProfilePic ? targetProfilePic : "/images/public.png"}
            alt={mode === 'private' && targetUsername ? targetUsername : "Public Challenge"}
            width={160}
            height={160}
            className="w-24 h-24 object-cover rounded-full"
          />
        </ThematicImage>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6">
        {/* Challenge Name Input */}
        <input
          type="text"
          placeholder="Name of the challenge"
          value={challengeName}
          onChange={(e) => setChallengeName(e.target.value)}
          className="w-full p-4 bg-gray-800 text-white rounded-lg focus:outline-hidden"
          required
        />
        
        {/* Reward Input */}
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <div 
              className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 text-white rounded-lg cursor-pointer"
              onClick={() => setIsRewardDropdownOpen(!isRewardDropdownOpen)}
            >
              <div className="flex items-center">
                <span className="text-sm">Reward</span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="number"
                  value={customReward}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseInt(value) >= 1) {
                      setCustomReward(value);
                    }
                  }}
                  min="1"
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 text-right bg-transparent text-lg font-medium mr-1 focus:outline-hidden"
                />
                <Image 
                  src="/nocenix.ico" 
                  alt="Nocenix" 
                  width={18} 
                  height={18}
                  className="mr-1"
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`transition-transform ${isRewardDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            {isRewardDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-10">
                {rewardOptions.map((option) => (
                  <div 
                    key={option} 
                    className="p-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm"
                    onClick={() => {
                      setReward(option);
                      setCustomReward(option.toString());
                      setIsRewardDropdownOpen(false);
                    }}
                  >
                    <span>{option} NOCENIX</span>
                    {reward === option && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Participants dropdown - Only for public challenges */}
          {mode === 'public' && (
            <div className="relative flex-1">
              <div 
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 text-white rounded-lg cursor-pointer"
                onClick={() => setIsParticipantsDropdownOpen(!isParticipantsDropdownOpen)}
              >
                <div className="flex items-center">
                  <span className="text-sm">Max users</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-lg font-medium mr-1">{participants}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${isParticipantsDropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              
              {isParticipantsDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-10">
                  {participantOptions.map((option) => (
                    <div 
                      key={option} 
                      className="p-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center text-sm"
                      onClick={() => {
                        setParticipants(option);
                        setIsParticipantsDropdownOpen(false);
                      }}
                    >
                      <span>{option} users</span>
                      {participants === option && (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Total cost display - Only for public challenges */}
        {mode === 'public' && (
          <div className="text-right text-sm text-gray-400 -mt-4 pr-1">
            Total cost: {totalCost} <Image src="/nocenix.ico" alt="Nocenix" width={14} height={14} className="inline mb-0.5" />
          </div>
        )}
        
        {/* Description Textarea */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-gray-800 text-white rounded-lg resize-none focus:outline-hidden"
          rows={5}
          required
        />
        
        {/* Submit Button - Dynamic text based on mode */}
        <PrimaryButton
          text={mode === 'private' ? `Challenge ${targetUsername || 'user'}` : 'Challenge public'}
          onClick={handleSubmit}
          disabled={!challengeName || !description || parseInt(customReward) < 1}
        />
      </form>
    </div>
  );
};

// Wrapper component to handle query parameters
const CreateChallengePage: React.FC = () => {
  const router = useRouter();
  const { isPrivate, targetUserId, targetUsername, targetProfilePic, isPublic, lat, lng } = router.query;

  const mode = isPrivate === 'true' ? 'private' : 'public';

  return (
    <CreateChallengeView
      mode={mode}
      targetUserId={targetUserId as string}
      targetUsername={targetUsername as string}
      targetProfilePic={targetProfilePic as string}
      lat={lat as string}
      lng={lng as string}
    />
  );
};

export default CreateChallengePage;