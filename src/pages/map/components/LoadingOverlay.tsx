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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/70">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white">{!mapLoaded ? 'Loading map...' : 'Finding your location...'}</p>
        </div>
      )}

      {/* Error notification */}
      {loadError && (
        <div className="absolute top-4 right-0 left-0 mx-auto max-w-xs rounded-lg bg-red-500/90 px-4 py-3 text-center text-white shadow-lg">
          <p>{loadError}</p>
        </div>
      )}
    </>
  );
};

export default LoadingOverlay;
