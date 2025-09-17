import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { MembershipTiers } from './MembershipTiers';
import { CreateTierModal } from './CreateTierModal';
import {
  addMembershipTierForUser,
  fetchMembershipTiersByCreator,
  getSubscriptionsByUserId,
} from '../../../lib/api/dgraph';
import { MembershipTier } from '../../../lib/types';

interface MembershipSectionProps {
  userId: string;
  isOwnProfile: boolean;
  subscribedTiers: string[];
  membershipTiers: MembershipTier[];
  updateUserMembershipTiers?: (userId: string) => Promise<void>;
}

const MembershipSection: React.FC<MembershipSectionProps> = ({
                                                               userId,
                                                               isOwnProfile,
                                                               subscribedTiers,
                                                               membershipTiers,
                                                               updateUserMembershipTiers,
                                                             }) => {
  const [isCreateTierModalOpen, setIsCreateTierModalOpen] = useState(false);

  const onSubscribe = (tierId: string) => {
  };
  const handleCreateTier = async (tierData: any) => {
    // onCreateTier?.(tierData);
    await addMembershipTierForUser(
      userId,
      tierData.name,
      tierData.description,
      tierData.price,
      tierData.benefits,
    )
    await updateUserMembershipTiers?.(userId)
    setIsCreateTierModalOpen(false);
  };

  // UNIFIED AVATAR INTERFACE - Single container for visual consistency
  return (
    <div>
      {membershipTiers.length > 0 ? (
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
            tiers={membershipTiers}
            subscribedTiers={subscribedTiers}
            onSubscribe={onSubscribe}
            isOwnProfile={isOwnProfile}
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
