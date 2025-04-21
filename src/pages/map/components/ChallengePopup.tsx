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
    <div class="p-5 max-w-[300px] text-white font-sans bg-[#141b2d] rounded-xl overflow-hidden shadow-lg z-2000">
      <!-- Title -->
      <h2 class="mb-3.5 text-[28px] font-bold leading-tight text-center text-white">
        ${challenge.title}
      </h2>
      
      <!-- Description -->
      <p class="mb-5 text-lg leading-relaxed text-white/90 text-center">
        ${challenge.description}
      </p>
      
      <!-- Complete challenge button -->
      <button 
        class="w-full py-3 rounded-full bg-gradient-to-r from-[#10CAFF] to-[#FD4EF5] text-white font-bold text-lg cursor-pointer mb-5 text-center"
        id="${buttonId}"
      >
        Complete Challenge
      </button>
      
      <!-- Reward section -->
      <div class="flex items-center justify-center bg-slate-800/70 rounded-full px-4 py-2 mx-auto">
        <img src="/nocenix.ico" alt="Nocenix" class="w-6 h-6 mr-2.5" />
        <span class="font-bold text-xl">${challenge.reward} NOCENIX</span>
      </div>
    </div>
  `;

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