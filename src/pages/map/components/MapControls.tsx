import React from 'react';
import { useRouter } from 'next/router';
import { LocationData } from '../../../lib/map/types';

interface MapControlsProps {
  mapLoaded: boolean;
  locatingUser: boolean;
  onRecenter: () => void;
  userLocation?: LocationData | null;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  mapLoaded, 
  locatingUser, 
  onRecenter,
  userLocation
}) => {
  const router = useRouter();

  const handleCreateChallenge = () => {
    console.log('Create challenge button clicked');
    
    if (!userLocation) {
      alert('Location access is required to create a challenge. Please enable location access in your browser settings and try again.');
      return;
    }
    
    console.log('Navigating to create challenge with location:', userLocation);
    
    // Navigate to create challenge with public flag and location data
    router.push({
      pathname: '/createchallenge',
      query: { 
        isPublic: 'true',
        lat: userLocation.latitude.toString(),
        lng: userLocation.longitude.toString()
      }
    });
  };

  if (!mapLoaded) {
    return null;
  }

  return (
    <div className="absolute bottom-24 right-4 flex flex-col space-y-2 z-10">
      {/* Recenter button - White with gradient arrow */}
      <button 
        onClick={onRecenter}
        className="w-14 h-14 rounded-full bg-white text-white flex items-center justify-center shadow-lg"
        aria-label="Center map on my location"
        disabled={locatingUser}
        style={{ 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* North-pointing arrow with gradient fill */}
          <defs>
            <linearGradient id="locationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10CAFF" />
              <stop offset="100%" stopColor="#FD4EF5" />
            </linearGradient>
          </defs>
          <path 
            d="M12 2L19 21L12 17L5 21L12 2Z" 
            fill="url(#locationGradient)" 
            stroke="url(#locationGradient)" 
          />
        </svg>
      </button>

      {/* Create Challenge button */}
      <button 
        onClick={handleCreateChallenge}
        className={`w-14 h-14 rounded-full ${
          userLocation 
            ? 'bg-gradient-to-r from-nocenaBlue to-nocenaPink' 
            : 'bg-gray-500'
        } text-white flex items-center justify-center shadow-lg`}
        aria-label="Create a challenge at your location"
        title={userLocation ? "Create a challenge" : "Location access required"}
        style={{ 
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

export default MapControls;