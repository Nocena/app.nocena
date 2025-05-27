import React from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface LoadingOverlayProps {
  mapLoaded: boolean;
  locatingUser: boolean;
  loadError: string | null;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ mapLoaded, locatingUser, loadError }) => {
  return (
    <>
      {/* Loading overlay */}
      {(!mapLoaded || locatingUser) && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-70">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white">{!mapLoaded ? 'Loading map...' : 'Finding your location...'}</p>
        </div>
      )}

      {/* Error notification */}
      {loadError && (
        <div className="absolute top-4 left-0 right-0 mx-auto max-w-xs bg-red-500 bg-opacity-90 text-white px-4 py-3 rounded-lg shadow-lg text-center">
          <p>{loadError}</p>
        </div>
      )}
    </>
  );
};

export default LoadingOverlay;
