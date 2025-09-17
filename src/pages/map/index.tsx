// pages/map/index.tsx - WITH DISCOVER BUTTON
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchChallengeCompletionsWithLikesAndReactions,
  fetchTopPosts,
  getRecentUsers,
  getSubscriptionsByUserId,
} from '../../lib/api/dgraph';

// Component imports
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ChevronRight, Clock, Sparkles, Trophy } from 'lucide-react';
import { CreatorCard } from '../../components/home/CreatorCard';
import { ChallengeCompletion, Creator, Post, SimplifiedUser } from '../../lib/types';
import SearchBox, { SearchUser } from '@pages/search/components/SearchBox';
import { ChallengeCard } from '../../components/profile/ChallengeCard';
import { PostCard } from '../../components/profile/PostCard';

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  color,
  onClickViewAll,
}: {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  onClickViewAll?: (() => void) | null;
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
    </div>
    <button
      className="flex items-center space-x-1 text-nocenaBlue hover:text-nocenaPink transition-colors duration-200"
      onClick={() => onClickViewAll?.()}
    >
      <span className="text-sm">View All</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const MapView = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [selectedUser, setSelectedUser] = useState<Creator | null>(null);
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [newJoinedUsers, setNewJoinedUsers] = useState<SimplifiedUser[]>([]);
  const [subscribedTiers, setSubscribedTiers] = useState<string[]>([]);
  const updateSubscriptionTiers = useCallback(async (userId: string) => {
    const tiers = await getSubscriptionsByUserId(userId);
    setSubscribedTiers(tiers.map((tier: any) => tier.tierId));
  }, []);

  useEffect(() => {
    updateSubscriptionTiers(user?.id || '');
  }, [user]);

  const handleUserSelect = useCallback(
    (selectedUser: SearchUser) => {
      if (user?.id === selectedUser.id) {
        router.push('/profile');
      } else {
        router.push(`/profile/${selectedUser.id}`);
      }
    },
    [router, user?.id],
  );

  const fetchChallengeCompletions = async () => {
    try {
      // Import the enhanced function from dgraph.ts

      // Get current user ID for like status
      const currentUserId = user?.id; // Use actual user ID from auth context

      // Fetch completions with like and reaction data
      const allCompletions = await fetchChallengeCompletionsWithLikesAndReactions('', currentUserId);

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
            // Use real database values for both likes and reactions
            localLikes: completion.totalLikes || 0,
            localIsLiked: completion.isLiked || false,
          };
        }),
      );

      // Sort by completion date (most recent first)
      processedCompletions.sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

      setCompletions(processedCompletions.slice(0, 6));
    } catch (err) {
      console.error('Error fetching challenge completions:', err);
    }
  };

  const fetchNewJoinedUsers = async () => {
    try {
      // Fetch completions with like and reaction data
      const users = await getRecentUsers();
      setNewJoinedUsers(
        users.slice(0, 6).map((user) => ({
          id: user.id,
          username: user.username,
          avatar: user.profilePicture,
          bio: user.bio,
        })),
      );
      console.log('users', users);
    } catch (err) {
      console.error('Error fetching challenge completions:', err);
    }
  };

  const updateTopPosts = async () => {
    try {
      // Fetch completions with like and reaction data
      const posts = await fetchTopPosts();
      setRecentPosts(posts.slice(0, 4));
    } catch (err) {
      console.error('Error fetching top posts:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchChallengeCompletions(), fetchNewJoinedUsers(), updateTopPosts()])
      .then(() => {
        setIsLoadingData(false);
      })
      .catch(() => {
        setIsLoadingData(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-white p-4 min-h-screen mt-20 mb-20">
      <div className="max-w-4xl mx-auto">
        {/* Show loading state while fetching challenge */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading ...</span>
          </div>
        ) : (
          /* Main Content */
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex justify-center">
              <SearchBox onUserSelect={handleUserSelect} />
            </div>
            {/* Recently Visited */}
            <section>
              <SectionHeader
                icon={Clock}
                title="Recent Posts"
                subtitle="Latest content from creators you follow"
                color="bg-nocenaPurple"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recentPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    hasAccess={
                      post.isPublic ||
                      !post.tierRequired ||
                      post.creator.id === user?.id ||
                      subscribedTiers.includes(post.tierRequired.id)
                    }
                    justShowLocked={true}
                    onSubscribe={() => {}}
                    onClick={() => router.push(`/post/${post.id}`)}
                  />
                ))}
              </div>
            </section>

            {/* Recent Challengers */}
            <section>
              <SectionHeader
                icon={Trophy}
                title="Recent Challengers"
                subtitle="recent challengers this week"
                color="bg-nocenaPink"
                onClickViewAll={() => {
                  router.push('/browsing');
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {completions.map((item) => (
                  <ChallengeCard
                    key={item.id}
                    challenge={{
                      id: item.id,
                      user: item.user,
                      challenge: (item.aiChallenge || item.publicChallenge || item.privateChallenge)!,
                      completionDate: item.completionDate,
                      isLiked: item.isLiked ?? false,
                      likesCount: item.totalLikes ?? 0,
                      videoUrl: item.videoUrl ?? '',
                      selfieUrl: item.selfieUrl ?? '',
                    }}
                    onClick={(challenge) => {
                      router.push(`/profile/${challenge.user.id}`);
                    }}
                  />
                ))}
              </div>
            </section>

            {/* New Posts */}
            <section>
              <SectionHeader
                icon={Sparkles}
                title="New Creators"
                subtitle="Fresh faces joining the platform"
                color="bg-nocenaPurple"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {newJoinedUsers.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onProfileClick={() => {
                      router.push(`/profile/${creator.id}`);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
