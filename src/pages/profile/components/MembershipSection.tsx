import React, { useState } from 'react';
import { Creator } from '../../../lib/types';
import { Plus, Users } from 'lucide-react';
import { MembershipTiers } from './MembershipTiers';
import { CreateTierModal } from './CreateTierModal';

interface MembershipSectionProps {
  creator: Creator;
  subscribedTiers: string[];
  isOwnProfile: boolean;
}

const MembershipSection: React.FC<MembershipSectionProps> = ({
                                                               creator,
                                                               subscribedTiers,
                                                               isOwnProfile,
                                                             }) => {
  const [isCreateTierModalOpen, setIsCreateTierModalOpen] = useState(false);
  const onSubscribe = (tierId: string) => {
  };
  const handleCreateTier = (tierData: any) => {
    // onCreateTier?.(tierData);
    setIsCreateTierModalOpen(false);
  };

  // UNIFIED AVATAR INTERFACE - Single container for visual consistency
  return (
    <div>
      {creator.membershipTiers.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Membership Tiers</h3>
            {isOwnProfile && (
              <button
                onClick={() => setIsCreateTierModalOpen(true)}
                className="bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Tier</span>
              </button>
            )}
          </div>
          <MembershipTiers
            tiers={creator.membershipTiers}
            subscribedTiers={subscribedTiers}
            onSubscribe={onSubscribe}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No membership tiers available yet.</p>
          {isOwnProfile && (
            <button
              onClick={() => setIsCreateTierModalOpen(true)}
              className="mt-4 bg-nocena-purple hover:bg-nocena-purple-fade text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              Create Your First Tier
            </button>
          )}
        </div>
      )}
      {/* Create Tier Modal */}
      <CreateTierModal
        isOpen={isCreateTierModalOpen}
        onClose={() => setIsCreateTierModalOpen(false)}
        onCreateTier={handleCreateTier}
      />
    </div>);
};

export default MembershipSection;
