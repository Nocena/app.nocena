import { useState } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

interface LensProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  picture: string;
}

interface Props {
  lensProfiles: LensProfile[];
  onProfileSelected: (profile: LensProfile | null) => void;
}

const RegisterLensProfileStep = ({ lensProfiles, onProfileSelected }: Props) => {
  const [selectedProfile, setSelectedProfile] = useState<LensProfile | null>(null);

  const handleContinue = () => {
    onProfileSelected(selectedProfile);
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 rounded-2xl animate-pulse opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6" />
              <path d="m21 12-6-6-6 6-6-6" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Import Profile</h2>
        <p className="text-gray-400 text-sm font-light">
          {lensProfiles.length > 0
            ? `${lensProfiles.length} Lens Protocol profile${lensProfiles.length > 1 ? 's' : ''} found`
            : 'No existing profiles detected'}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {lensProfiles.length > 0 ? (
          <>
            {lensProfiles.map((profile) => (
              <ThematicContainer
                key={profile.id}
                color={selectedProfile?.id === profile.id ? 'nocenaPink' : 'nocenaBlue'}
                asButton={true}
                glassmorphic={true}
                rounded="xl"
                className={`p-4 border transition-all duration-300 ${
                  selectedProfile?.id === profile.id
                    ? 'border-pink-400 border-opacity-50 scale-105 shadow-xl'
                    : 'border-white border-opacity-5 hover:scale-[1.02]'
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={profile.picture || '/images/profile.png'}
                      alt={profile.handle}
                      className="w-12 h-12 rounded-xl border border-white border-opacity-20"
                    />
                    {selectedProfile?.id === profile.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-white font-semibold text-sm tracking-wide">@{profile.handle}</h3>
                    <p className="text-gray-300 text-xs font-light">{profile.displayName}</p>
                    {profile.bio && (
                      <p className="text-gray-500 text-xs mt-1 truncate font-light">{profile.bio.slice(0, 60)}...</p>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full opacity-60"></div>
                </div>
              </ThematicContainer>
            ))}

            <ThematicContainer
              color={selectedProfile === null ? 'nocenaPink' : 'nocenaPurple'}
              asButton={true}
              glassmorphic={true}
              rounded="xl"
              className={`p-4 border transition-all duration-300 ${
                selectedProfile === null
                  ? 'border-pink-400 border-opacity-50 scale-105 shadow-xl'
                  : 'border-white border-opacity-5 hover:scale-[1.02]'
              }`}
              onClick={() => setSelectedProfile(null)}
            >
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center border border-white border-opacity-20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {selectedProfile === null && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold text-sm tracking-wide">Start Fresh</h3>
                  <p className="text-gray-300 text-xs font-light">
                    Create a new identity without importing existing profiles
                  </p>
                </div>
                <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full opacity-60"></div>
              </div>
            </ThematicContainer>
          </>
        ) : (
          <ThematicContainer
            color="nocenaBlue"
            asButton={false}
            glassmorphic={true}
            rounded="xl"
            className="p-6 border border-blue-500 border-opacity-20"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center opacity-60">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-white font-medium mb-2 tracking-wide">No Profiles Found</p>
              <p className="text-gray-400 text-sm font-light">
                This wallet has no associated Lens Protocol profiles. You'll start with a fresh identity.
              </p>
            </div>
          </ThematicContainer>
        )}
      </div>

      <PrimaryButton text="CONTINUE" onClick={handleContinue} className="w-full" />
    </div>
  );
};

export default RegisterLensProfileStep;
