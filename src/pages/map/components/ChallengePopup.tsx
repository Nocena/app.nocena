// src/lib/map/components/ChallengePopup.tsx
import React from 'react';
import { ChallengeData } from '../../../lib/map/types';

interface ChallengePopupProps {
  challenge: ChallengeData;
  onComplete: (challenge: ChallengeData) => void;
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
const ChallengePopup = ({ challenge, onComplete }: ChallengePopupProps): PopupContent => {
  // Define popup options
  const options: PopupOptions = {
    closeButton: false,
    closeOnClick: true,
    offset: [0, -10],
    maxWidth: '320px'
  };
  
  // Create a unique ID for the button based on the challenge ID
  const buttonId = `challenge-complete-btn-${challenge.id}`;
  
  // Convert the JSX to an HTML string
  const popupHtml = `
    <div class="challenge-popup-container">
      <!-- Main ThematicContainer -->
      <div class="relative p-8 border-2 border-gray-700 text-white rounded-xl" style="background: linear-gradient(to bottom, #101010, #000740);">
        <!-- Blue glow effect on top -->
        <div class="absolute -top-px left-0 w-full h-[1.5px]" style="background: radial-gradient(circle at center, #2353FF 0%, transparent 50%); transform: translateY(-1px); border-radius: 9999px;"></div>
        
        <!-- Title -->
        <h2 class="text-3xl font-bold mb-4 text-center">
          ${challenge.title}
        </h2>
        
        <!-- Description -->
        <p class="text-lg text-gray-300 mb-8 text-center font-light">
          ${challenge.description}
        </p>
        
        <!-- Complete challenge button (PrimaryButton style) -->
        <button 
          class="w-full h-12 rounded-full mb-6 text-white text-base font-medium cursor-pointer"
          style="background: linear-gradient(to right, #2353FF, #FF15C9)"
          id="${buttonId}"
        >
          Complete Challenge
        </button>
        
        <!-- Reward ThematicContainer (centered) -->
        <div class="flex justify-center">
          <div class="relative px-4 py-1 border-2 border-gray-700 text-white rounded-full inline-flex items-center space-x-1" style="background: linear-gradient(to bottom, #101010, #000740);">
            <!-- Pink glow effect on top -->
            <div class="absolute -top-px left-0 w-full h-[1.5px]" style="background: radial-gradient(circle at center, #FF15C9 0%, transparent 50%); transform: translateY(-1px); border-radius: 9999px;"></div>
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
    }
    .challenge-popup-container * {
      box-sizing: border-box;
    }
    .challenge-popup-container button:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(styleEl);

  // Function to set up event listeners after the popup is added to the DOM
  const setupEventListeners = (container: HTMLElement) => {
    const completeButton = container.querySelector(`#${buttonId}`);
    if (completeButton) {
      completeButton.addEventListener('click', () => {
        onComplete(challenge);
      });
    }
  };

  return {
    html: popupHtml,
    options,
    setupEventListeners
  };
};

export default ChallengePopup;