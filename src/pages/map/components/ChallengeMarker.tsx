import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ChallengeData } from '../../../lib/map/types';
import ChallengePopup from './ChallengePopup';
import { useAuth } from '../../../contexts/AuthContext'; // Add this import

interface ChallengeMarkerProps {
  map: any;
  MapLibre: any;
  challenge: ChallengeData;
  index: number;
  isSelected: boolean;
  onSelect: (index: number | null) => void;
}

const ChallengeMarker: React.FC<ChallengeMarkerProps> = ({ map, MapLibre, challenge, index, isSelected, onSelect }) => {
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const router = useRouter();
  const { user } = useAuth(); // Add this line

  useEffect(() => {
    if (!map || !MapLibre) return;

    const colors = ['#FD4EF5', '#10CAFF', '#ffffff'];
    const strokeColors = ['#FD4EF5', '#10CAFF', '#ffffff'];
    const colorIndex = index % 3; // Calculate color index based on marker position

    // Clean up previous marker if it exists
    if (markerRef.current) {
      markerRef.current.remove();
    }
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Create container element for the marker
    const el = document.createElement('div');
    el.className = `challenge-marker challenge-marker-${index}`;
    el.style.width = isSelected ? '40px' : '32px';
    el.style.height = isSelected ? '40px' : '32px';
    el.style.position = 'absolute';
    el.style.cursor = 'pointer';
    el.style.transition = 'width 0.2s ease, height 0.2s ease';
    // Ensure challenge markers have a higher z-index
    el.style.zIndex = '10';

    // Simple SVG without complex styling or animations
    el.innerHTML = `
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 8.66668C13.4267 8.66668 11.3333 10.76 11.3333 13.3333C11.3333 15.9067 13.4267 18 16 18C18.5733 18 20.6667 15.9067 20.6667 13.3333C20.6667 10.76 18.572 8.66668 16 8.66668ZM16 16.6667C14.1627 16.6667 12.6667 15.1707 12.6667 13.3333C12.6667 11.496 14.1627 10 16 10C17.8373 10 19.3333 11.496 19.3333 13.3333C19.3333 15.1707 17.8373 16.6667 16 16.6667ZM15.9947 3.33334C10.2973 3.33334 6 7.63201 6 13.3333C6 21.4507 12.212 26.5213 14.8813 28.324C15.2187 28.552 15.6067 28.6667 15.9947 28.6667C16.3813 28.6667 16.768 28.5534 17.1053 28.3254C19.78 26.5187 26 21.4414 26 13.332C26 7.63204 21.6973 3.33334 15.9947 3.33334ZM16.36 27.22C16.1373 27.3693 15.8507 27.3693 15.628 27.2187C13.6827 25.9053 7.33333 21.0214 7.33333 13.332C7.33333 8.39071 11.056 4.66537 15.9947 4.66537C20.9387 4.66537 24.6667 8.39071 24.6667 13.332C24.6667 20.8027 18.856 25.5333 16.36 27.22Z"
          fill="${colors[colorIndex]}"
          stroke="${strokeColors[colorIndex]}"
          stroke-width="0.5"
        />
      </svg>
    `;

    // Create marker with specific options and a high z-index
    const marker = new MapLibre.Marker({
      element: el,
      anchor: 'center', // Center is more stable for this icon type
      offset: [0, isSelected ? -20 : -16], // Adjust offset based on selection
      draggable: false,
      rotationAlignment: 'viewport',
      pitchAlignment: 'viewport',
    })
      .setLngLat(challenge.position)
      .addTo(map);

    // Set the marker to a higher z-index to display above user location
    const markerElement = marker.getElement();
    markerElement.style.zIndex = '100'; // Higher z-index to ensure it's above user location

    // Function to handle challenge completion
    const handleCompleteChallenge = (challengeData: ChallengeData) => {
      // Navigate to the completing page with challenge details
      router.push({
        pathname: '/completing',
        query: {
          type: 'PUBLIC', // Use PUBLIC instead of AI
          frequency: 'once', // Public challenges are completed once
          title: challengeData.title,
          description: challengeData.description,
          reward: challengeData.reward.toString(),
          visibility: 'public',
          challengeId: challengeData.id, // Pass the challenge ID
          longitude: challengeData.position[0].toString(),
          latitude: challengeData.position[1].toString(),
        },
      });
    };

    // Create popup with challenge details and completion handler - UPDATED to include currentUserId
    const popupContent = ChallengePopup({
      challenge,
      currentUserId: user?.id, // Add this line
      onComplete: handleCompleteChallenge,
    });

    const popup = new MapLibre.Popup({
      className: 'custom-popup',
      closeButton: popupContent.options.closeButton,
      closeOnClick: popupContent.options.closeOnClick,
      offset: [0, isSelected ? -40 : -32],
      maxWidth: popupContent.options.maxWidth,
    })
      .setLngLat(challenge.position)
      .setHTML(popupContent.html);

    // Store refs for later use
    markerRef.current = marker;
    popupRef.current = popup;

    // Handle click with popup toggling
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isSelected) {
        // Deselect and close popup
        onSelect(null);
        if (popupRef.current) {
          popupRef.current.remove();
        }
      } else {
        // Select and open popup
        onSelect(index);
        if (popupRef.current) {
          popupRef.current.addTo(map);

          // Setup event listeners after the popup is added to the DOM
          if (popupContent.setupEventListeners) {
            const popupElement = popup.getElement();
            if (popupElement) {
              popupContent.setupEventListeners(popupElement);
            }
          }
        }
      }
    };

    el.addEventListener('click', handleClick);

    // Show popup initially if selected
    if (isSelected && popupRef.current) {
      popupRef.current.addTo(map);

      // Setup event listeners for initially selected popups too
      if (popupContent.setupEventListeners) {
        const popupElement = popup.getElement();
        if (popupElement) {
          popupContent.setupEventListeners(popupElement);
        }
      }
    }

    return () => {
      el.removeEventListener('click', handleClick);
      if (markerRef.current) markerRef.current.remove();
      if (popupRef.current) popupRef.current.remove();
    };
  }, [map, MapLibre, challenge, index, isSelected, onSelect, router, user?.id]); // Add user?.id to dependencies

  // Update popup visibility when selection changes
  useEffect(() => {
    if (!map || !popupRef.current) return;

    if (isSelected) {
      popupRef.current.addTo(map);

      // Re-setup event listeners when popup becomes visible - UPDATED to include currentUserId
      const popupContent = ChallengePopup({
        challenge,
        currentUserId: user?.id, // Add this line
        onComplete: (challengeData) => {
          // Navigate to the completing page with challenge details
          router.push({
            pathname: '/completing',
            query: {
              type: 'PUBLIC',
              frequency: 'once',
              title: challengeData.title,
              description: challengeData.description,
              reward: challengeData.reward.toString(),
              visibility: 'public',
              challengeId: challengeData.id,
              longitude: challengeData.position[0].toString(),
              latitude: challengeData.position[1].toString(),
            },
          });
        },
      });

      if (popupContent.setupEventListeners) {
        const popupElement = popupRef.current.getElement();
        if (popupElement) {
          popupContent.setupEventListeners(popupElement);
        }
      }
    } else {
      popupRef.current.remove();
    }

    // Update marker size
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        el.style.width = isSelected ? '40px' : '32px';
        el.style.height = isSelected ? '40px' : '32px';
        markerRef.current.setOffset([0, isSelected ? -20 : -16]);
      }
    }
  }, [isSelected, map, challenge, router, user?.id]); // Add user?.id to dependencies

  return null;
};

export default ChallengeMarker;
