import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import AuthContext from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ThematicImage from '../../components/ui/ThematicImage';
import ThematicContainer from '../../components/ui/ThematicContainer';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ChallengeFormData } from '../../lib/map/types';

// Types for challenge mode
type ChallengeMode = 'private' | 'public';
type ParticipantCount = 5 | 10 | 25 | 50 | 100 | 250 | 500 | 1000;

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
  onSubmit,
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const router = useRouter();
  const [challengeName, setChallengeName] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState(10); // Default to 10 NOCENIX
  const [participants, setParticipants] = useState<ParticipantCount>(10); // Default to 10 participants

  // Dropdown toggles
  const [isRewardDropdownOpen, setIsRewardDropdownOpen] = useState(false);
  const [isParticipantsDropdownOpen, setIsParticipantsDropdownOpen] = useState(false);
  const [isTotalCostDropdownOpen, setIsTotalCostDropdownOpen] = useState(false);

  // Sample reward options
  const rewardOptions = [1, 5, 10, 25, 50, 100, 150];
  const participantOptions: ParticipantCount[] = [5, 10, 25, 50, 100, 250, 500, 1000];

  // Calculate total cost for public challenges only
  const totalCost = mode === 'public' ? reward * participants : reward;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside of dropdown areas
      if (!target.closest('[data-dropdown="reward"]')) {
        setIsRewardDropdownOpen(false);
      }

      if (!target.closest('[data-dropdown="participants"]')) {
        setIsParticipantsDropdownOpen(false);
      }

      if (!target.closest('[data-dropdown="totalcost"]')) {
        setIsTotalCostDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
      toast.error('You must be logged in to create a challenge');
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
      ...(mode === 'public' &&
        lat &&
        lng && {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        }),
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
          mode,
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
    <div className="flex flex-col items-center w-full px-8 text-white">
      {/* Profile Image with Thematic Border */}
      <div className="mt-6 mb-8">
        <ThematicImage>
          <Image
            src={mode === 'private' && targetProfilePic ? targetProfilePic : '/images/public.jpg'}
            alt={mode === 'private' && targetUsername ? targetUsername : 'Public Challenge'}
            width={160}
            height={160}
            className="w-32 h-32 object-cover rounded-full"
          />
        </ThematicImage>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-8">Create Challenge</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6">
        {/* Challenge Name Input */}
        <input
          type="text"
          placeholder="Name of the challenge"
          value={challengeName}
          onChange={(e) => setChallengeName(e.target.value)}
          className="w-full p-4 bg-[#222639] text-white rounded-full focus:outline-none"
          required
        />

        {/* Reward and Max Users - Single Line Layout */}
        <div className="flex justify-between items-center">
          {/* Reward Label and Container */}
          <div className="flex items-center space-x-4">
            <span className="text-sm">Reward</span>
            <div className="relative" data-dropdown="reward">
              <ThematicContainer
                asButton={false}
                color="nocenaBlue"
                rounded="full"
                className="flex items-center justify-between py-1 px-3 cursor-pointer w-24"
                onClick={() => setIsRewardDropdownOpen(!isRewardDropdownOpen)}
              >
                <span className="text-white">{reward}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${isRewardDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </ThematicContainer>

              {isRewardDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-10">
                  <ThematicContainer
                    asButton={false}
                    color="nocenaPink"
                    glassmorphic={true}
                    rounded="xl"
                    className="py-2 w-32"
                  >
                    {rewardOptions.map((option) => (
                      <div
                        key={option}
                        className={`p-3 hover:bg-[rgba(244,114,182,0.4)] cursor-pointer flex justify-between items-center ${reward === option ? 'bg-[rgba(244,114,182,0.3)]' : ''}`}
                        onClick={() => {
                          setReward(option);
                          setIsRewardDropdownOpen(false);
                        }}
                      >
                        <span>{option}</span>
                        {reward === option && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    ))}
                  </ThematicContainer>
                </div>
              )}
            </div>
          </div>

          {/* Max Users - Only for public challenges */}
          {mode === 'public' && (
            <div className="flex items-center space-x-4">
              <span className="text-sm">Max Users</span>
              <div className="relative" data-dropdown="participants">
                <ThematicContainer
                  asButton={false}
                  color="nocenaBlue"
                  rounded="full"
                  className="flex items-center justify-between py-1 px-3 cursor-pointer w-24"
                  onClick={() => setIsParticipantsDropdownOpen(!isParticipantsDropdownOpen)}
                >
                  <span className="text-white">{participants}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isParticipantsDropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </ThematicContainer>

                {isParticipantsDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 z-10">
                    <ThematicContainer
                      asButton={false}
                      color="nocenaPink"
                      glassmorphic={true}
                      rounded="xl"
                      className="py-2 w-40"
                    >
                      {participantOptions.map((option) => (
                        <div
                          key={option}
                          className={`p-3 hover:bg-[rgba(244,114,182,0.4)] cursor-pointer flex justify-between items-center ${participants === option ? 'bg-[rgba(244,114,182,0.3)]' : ''}`}
                          onClick={() => {
                            setParticipants(option);
                            setIsParticipantsDropdownOpen(false);
                          }}
                        >
                          <span>{option}</span>
                          {participants === option && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      ))}
                    </ThematicContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Total Cost Row */}
        {mode === 'public' && (
          <div className="flex justify-between items-center">
            <label className="text-sm">Total Cost</label>
            <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-semibold">{totalCost}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
              </div>
            </ThematicContainer>
          </div>
        )}

        {/* Description Textarea */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-[#222639] text-white rounded-3xl resize-none focus:outline-none min-h-[120px]"
          required
        />

        {/* Submit Button - Dynamic text based on mode */}
        <PrimaryButton
          text={mode === 'private' ? `Challenge ${targetUsername || 'user'}` : 'Challenge Public'}
          onClick={handleSubmit}
          className="w-full mt-4"
          disabled={!challengeName || !description || reward < 1}
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
