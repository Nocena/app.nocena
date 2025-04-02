import React from 'react';
import { ChallengeData } from '../../../lib/map/types';

interface ChallengePopupProps {
  challenge: ChallengeData;
}

interface PopupContent {
  html: string;
  options: {
    closeButton: boolean;
    closeOnClick: boolean;
    offset: number[];
    maxWidth: string;
  };
}

/**
 * This component returns the HTML content for a map popup.
 * It's not a React component that gets rendered directly - 
 * instead it returns an HTML string that MapLibre will use.
 */
const ChallengePopup = ({ challenge }: ChallengePopupProps): PopupContent => {
  // Create the popup HTML with inline styles to ensure perfect alignment
  const popupHtml = `
    <div style="padding: 20px; max-width: 300px; color: white; font-family: system-ui, sans-serif; background-color: #141b2d; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <!-- Title in white -->
      <h2 style="margin: 0 0 14px; font-size: 28px; font-weight: bold; color: white; line-height: 1.2; text-align: center;">
        ${challenge.title}
      </h2>
      
      <!-- Description text -->
      <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.4; color: rgba(255, 255, 255, 0.9); text-align: center;">
        ${challenge.description}
      </p>
      
      <!-- Complete challenge button -->
      <button style="width: 100%; padding: 12px 0; border: none; border-radius: 9999px; background: linear-gradient(90deg, #10CAFF, #FD4EF5); color: white; font-weight: bold; font-size: 18px; cursor: pointer; margin-bottom: 20px; text-align: center;">
        Complete Challenge
      </button>
      
      <!-- Reward section -->
      <div style="display: flex; align-items: center; justify-content: center; background-color: rgba(30, 41, 59, 0.7); border-radius: 9999px; padding: 8px 16px; margin: 0 auto;">
        <img src="/nocenix.ico" alt="Nocenix" style="width: 24px; height: 24px; margin-right: 10px;" />
        <span style="font-weight: bold; font-size: 20px;">${challenge.reward} NOCENIX</span>
      </div>
    </div>
  `;

  // Set popup options
  return {
    html: popupHtml,
    options: {
      closeButton: false,
      closeOnClick: true,
      offset: [0, -10],
      maxWidth: '320px'
    }
  };
};

export default ChallengePopup;