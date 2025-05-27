import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface UserLocationMarkerProps {
  map: any;
  MapLibre: any;
  location: [number, number];
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ map, MapLibre, location }) => {
  const { user } = useAuth();
  const defaultProfilePic = '/images/profile.png';
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !MapLibre) return;

    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const profilePicture = user?.profilePicture || defaultProfilePic;

    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.width = '48px';
    el.style.height = '60px';
    el.style.position = 'absolute';

    // Add the CSS animation classes and HTML structure
    el.innerHTML = `
      <style>
        @keyframes rotateGradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulseEffect {
          0% { 
            transform: scale(1);
            opacity: 0.7;
          }
          70% { 
            transform: scale(1.5);
            opacity: 0;
          }
          100% { 
            transform: scale(1.8);
            opacity: 0;
          }
        }
      </style>

      <div style="position: relative; width: 100%; height: 100%;">
        <!-- Pulse effect circle -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          z-index: 1;
          animation: pulseEffect 3s infinite;
        "></div>

        <!-- Gradient circle with rotation -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(45deg, #FF15C9, #6024FB, #2353FF);
          z-index: 2;
          animation: rotateGradient 4s linear infinite;
        "></div>
        
        <!-- Profile image -->
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-image: url('${profilePicture}');
          background-size: cover;
          background-position: center;
          border: 2px solid white;
          z-index: 3;
        "></div>
        
        <!-- Pin triangle -->
        <div style="
          position: absolute;
          top: 44px;
          left: 16px;
          width: 16px;
          height: 16px;
          background: white;
          clip-path: polygon(50% 100%, 0 0, 100% 0);
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        "></div>
      </div>
    `;

    // Create marker with proper anchor and offset
    const marker = new MapLibre.Marker({
      element: el,
      anchor: 'bottom', // Anchor at bottom of the pin
      offset: [0, 0], // No need for offset with bottom anchor
      draggable: false,
      rotationAlignment: 'viewport',
      pitchAlignment: 'viewport',
    })
      .setLngLat(location)
      .addTo(map);

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, MapLibre, location, user?.profilePicture]);

  return null;
};

export default UserLocationMarker;
