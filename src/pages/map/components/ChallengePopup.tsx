// src/lib/map/components/ChallengePopup.tsx
import React from 'react';
import { ChallengeData } from '../../../lib/map/types';

interface ChallengePopupProps {
  challenge: ChallengeData;
  onComplete: (challenge: ChallengeData) => void;
  currentUserId?: string; // Add current user ID as optional prop
}

interface PopupOptions {
  closeButton: boolean;
  closeOnClick: boolean;
  offset: number[];
  maxWidth: string;
}

interface PopupContent {
  html: string;
  options: PopupOptions;
  setupEventListeners: (container: HTMLElement) => void;
}

/**
 * This component returns the HTML content for a map popup.
 * It's not a React component that gets rendered directly -
 * instead it renders to an HTML string that MapLibre will use.
 */
const ChallengePopup = ({ challenge, onComplete, currentUserId }: ChallengePopupProps): PopupContent => {
  // Define popup options
  const options: PopupOptions = {
    closeButton: false,
    closeOnClick: true,
    offset: [0, -10],
    maxWidth: '320px',
  };

  // Create a unique ID for the button based on the challenge ID
  const buttonId = `challenge-complete-btn-${challenge.id}`;

  // Get completion data
  const completionCount = challenge.completionCount || 0;
  const participantCount = challenge.participantCount || 0;
  const maxParticipants = challenge.maxParticipants || 10;
  const recentCompletions = challenge.recentCompletions || [];

  // Check if current user has completed this challenge
  const hasUserCompleted = currentUserId && recentCompletions.some((completion) => completion.userId === currentUserId);

  // Generate floating profile bubbles HTML
  const generateProfileBubbles = () => {
    if (recentCompletions.length === 0) return '';

    // Show up to 4 profile pictures
    const visibleCompletions = recentCompletions.slice(0, 4);

    return visibleCompletions
      .map((completion, index) => {
        // Position bubbles around the popup
        const positions = [
          { top: '-20px', right: '60px' }, // Top right
          { top: '20px', right: '-25px' }, // Middle right
          { bottom: '60px', right: '40px' }, // Bottom right
          { top: '40px', left: '-25px' }, // Middle left
        ];

        const position = positions[index] || positions[0];
        const positionStyles = Object.entries(position)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');

        // Create unique ID for click handling
        const bubbleId = `profile-bubble-${challenge.id}-${completion.userId}`;

        return `
        <div class="profile-bubble" 
             id="${bubbleId}"
             data-user-id="${completion.userId}"
             data-challenge-id="${challenge.id}"
             style="position: absolute; ${positionStyles}; z-index: 1000; cursor: pointer;
                    animation: float-in 0.6s ease-out ${index * 0.1}s both;">
          <div class="profile-bubble-inner">
            <img src="${completion.profilePicture || '/images/profile.png'}" 
                 alt="${completion.username}" 
                 class="profile-bubble-image" />
            <div class="profile-bubble-ring"></div>
          </div>
        </div>
      `;
      })
      .join('');
  };

  // Convert the JSX to an HTML string
  const popupHtml = `
    <div class="challenge-popup-container">
      <!-- Profile Bubbles -->
      ${generateProfileBubbles()}
      
      <!-- Main Glassmorphic Container with milky effect -->
      <div class="relative p-8 border border-white/20 text-white rounded-xl backdrop-blur-md" 
           style="background: linear-gradient(to bottom, rgba(59, 60, 152, 0.2), rgba(37, 37, 90, 0.3)); 
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);">
        <!-- White/blue milky overlay -->
        <div class="absolute inset-0 rounded-xl" 
             style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(143, 164, 252, 0.05)); 
                    z-index: -1;"></div>
                    
        <!-- Blue glow effect on top -->
        <div class="absolute -top-px left-0 w-full h-[1.5px]" 
             style="background: radial-gradient(circle at center, #2353FF 0%, transparent 50%); 
                    transform: translateY(-1px); border-radius: 9999px;"></div>
        
        <!-- Title -->
        <h2 class="text-3xl font-bold mb-4 text-center">
          ${challenge.title}
        </h2>
        
        <!-- Description -->
        <p class="text-lg text-gray-300 mb-8 text-center font-light">
          ${challenge.description}
        </p>
        
        <!-- Complete challenge button or completion status -->
        ${
          hasUserCompleted
            ? `
        <!-- Completed State -->
        <div class="w-full mb-6 text-center">
          <div class="bg-green-600 text-white px-6 py-3 rounded-full text-base font-medium mb-4">
            Challenge Complete
          </div>
        </div>
        `
            : `
        <!-- Complete Challenge Button -->
        <button 
          class="w-full h-12 rounded-full mb-6 text-white text-base font-medium cursor-pointer transition-opacity"
          style="background: linear-gradient(to right, #2353FF, #FF15C9)"
          id="${buttonId}"
          ${participantCount >= maxParticipants ? 'disabled' : ''}
        >
          ${participantCount >= maxParticipants ? 'Challenge Full' : 'Complete Challenge'}
        </button>
        `
        }
        
        <!-- Reward ThematicContainer (centered) -->
        <div class="flex justify-center">
          <div class="relative px-4 py-1 border border-gray-700 text-white rounded-full inline-flex items-center space-x-1" 
               style="background: linear-gradient(to bottom, #101010, #000740);">
            <!-- Pink glow effect on top -->
            <div class="absolute -top-px left-0 w-full h-[1.5px]" 
                 style="background: radial-gradient(circle at center, #FF15C9 0%, transparent 50%); 
                        transform: translateY(-1px); border-radius: 9999px;"></div>
            <span class="text-xl font-semibold">${challenge.reward}</span>
            <img src="/nocenix.ico" alt="Nocenix" class="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  `;

  // Add CSS to ensure proper styling in the popup
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .challenge-popup-container {
      font-family: "Montserrat", sans-serif;
      width: 320px;
      color: white;
      position: relative;
    }
    .challenge-popup-container * {
      box-sizing: border-box;
    }
    .challenge-popup-container button:hover:not(:disabled) {
      opacity: 0.9;
    }
    .challenge-popup-container button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Profile Bubble Styles */
    .profile-bubble {
      width: 50px;
      height: 50px;
      pointer-events: auto;
      transition: transform 0.2s ease;
    }
    
    .profile-bubble:hover {
      transform: scale(1.1);
    }
    
    .profile-bubble-inner {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .profile-bubble-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #FF15C9;
      box-shadow: 0 4px 15px rgba(255, 21, 201, 0.4);
      transition: border-color 0.2s ease;
    }
    
    .profile-bubble:hover .profile-bubble-image {
      border-color: #2353FF;
      box-shadow: 0 4px 15px rgba(35, 83, 255, 0.4);
    }
    
    .profile-bubble-ring {
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px solid rgba(255, 21, 201, 0.6);
      border-radius: 50%;
      animation: pulse-ring 2s infinite;
    }
    
    /* Animations */
    @keyframes float-in {
      0% {
        opacity: 0;
        transform: scale(0.3) translateY(20px);
      }
      50% {
        transform: scale(1.1) translateY(-5px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes pulse-ring {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.4;
      }
      100% {
        transform: scale(1);
        opacity: 0.8;
      }
    }
    
    /* For browsers that support backdrop-filter */
    @supports (backdrop-filter: blur(10px)) {
      .challenge-popup-container .backdrop-blur-md {
        backdrop-filter: blur(12px) saturate(150%);
      }
    }
    /* Fallback for browsers that don't support backdrop-filter */
    @supports not (backdrop-filter: blur(10px)) {
      .challenge-popup-container .backdrop-blur-md {
        background: rgba(59, 60, 152, 0.5);
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Function to set up event listeners after the popup is added to the DOM
  const setupEventListeners = (container: HTMLElement) => {
    // Only set up complete button if user hasn't completed the challenge
    if (!hasUserCompleted) {
      const completeButton = container.querySelector(`#${buttonId}`);
      if (completeButton) {
        // Disable button if challenge is full
        if (participantCount >= maxParticipants) {
          (completeButton as HTMLButtonElement).disabled = true;
          return;
        }

        completeButton.addEventListener('click', () => {
          onComplete(challenge);
        });
      }
    }

    // Add click listeners to profile bubbles
    const profileBubbles = container.querySelectorAll('.profile-bubble');
    profileBubbles.forEach((bubble) => {
      bubble.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent popup from closing

        const userId = (bubble as HTMLElement).getAttribute('data-user-id');
        const challengeId = (bubble as HTMLElement).getAttribute('data-challenge-id');

        if (userId && challengeId) {
          console.log('🎬 Profile bubble clicked:', { challengeId, userId });

          // Try multiple navigation methods for reliability
          // Method 1: Use custom event (preferred)
          const navigationEvent = new CustomEvent('navigateToBrowsing', {
            detail: { challengeId, userId },
          });
          window.dispatchEvent(navigationEvent);

          // Method 2: Direct router access (backup)
          setTimeout(() => {
            const router = (window as any).__NEXT_ROUTER__;
            if (router && router.push) {
              console.log('🔄 Using router backup navigation');
              router
                .push({
                  pathname: '/browsing',
                  query: { challengeId, userId },
                })
                .catch((error: any) => {
                  console.error('Router navigation failed:', error);
                  // Method 3: Direct URL navigation (last resort)
                  console.log('🔄 Using direct URL navigation');
                  window.location.href = `/browsing?challengeId=${challengeId}&userId=${userId}`;
                });
            }
          }, 100);
        }
      });
    });
  };

  return {
    html: popupHtml,
    options,
    setupEventListeners,
  };
};

export default ChallengePopup;
