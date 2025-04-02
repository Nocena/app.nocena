import React from 'react';

interface MapControlsProps {
  mapLoaded: boolean;
  locatingUser: boolean;
  onRecenter: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  mapLoaded, 
  locatingUser, 
  onRecenter 
}) => {
  if (!mapLoaded) {
    return null;
  }

  return (
    <div className="absolute bottom-20 right-4 flex flex-col space-y-2">
      {/* Recenter button - Direction arrow style */}
      <button 
        onClick={onRecenter}
        className="w-14 h-14 rounded-full bg-[#FD4EF5] text-white flex items-center justify-center shadow-lg"
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
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* North-pointing arrow/navigation icon */}
          <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="white" />
        </svg>
      </button>
    </div>
  );
};

export default MapControls;