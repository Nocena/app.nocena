// pages/home/index.tsx - WITH DISCOVER BUTTON
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

// Component imports
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ChevronRight, Clock, Sparkles, Trophy } from 'lucide-react';
import { CreatorCard } from './components/CreatorCard';
import { mockCreators, newCreators, recentChallengers, recentlyVisited } from '../../data/mock';
import { Creator } from '../../lib/types';
import SearchBox, { SearchUser } from '@pages/search/components/SearchBox';

const SectionHeader = ({ icon: Icon, title, subtitle, color }: {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
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
    <button className="flex items-center space-x-1 text-nocenaBlue hover:text-nocenaPink transition-colors duration-200">
      <span className="text-sm">View All</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

const HomeView = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Creator | null>(null);

  const handleProfileClick = (username: string) => {
    const creator = mockCreators.find(c => c.username === username);
    if (creator) {
      setSelectedUser(creator);
      // setCurrentView('profile');
    }
  };

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

  if (loading) {
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-white p-4 min-h-screen mt-20">
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
                title="Recently Visited"
                subtitle="Creators you've checked out recently"
                color="bg-nocenaBlue"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {recentlyVisited.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onProfileClick={handleProfileClick}
                  />
                ))}
              </div>
            </section>

            {/* Recent Challengers */}
            <section>
              <SectionHeader
                icon={Trophy}
                title="Recent Challengers"
                subtitle="Top performing creators this week"
                color="bg-nocenaPink"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {recentChallengers.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onProfileClick={handleProfileClick}
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
                {newCreators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onProfileClick={handleProfileClick}
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

export default HomeView;
