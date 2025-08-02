'use client';

import React, { useState, useEffect, useRef } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
}

interface SelfieScreenProps {
  challenge: Challenge;
  onSelfieCompleted: (photoBlob: Blob) => void;
  onBack: () => void;
  onCancel: () => void; // Add cancel handler
}

type SelfieStage = 'camera';

const SelfieScreen: React.FC<SelfieScreenProps> = ({ challenge, onSelfieCompleted, onBack, onCancel }) => {
  const [stage, setStage] = useState<SelfieStage>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeCamera();
    return () => stopCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      onBack();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip the image horizontally to match mirror view
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          stopCamera();
          // Go straight to verification - no review step
          onSelfieCompleted(blob);
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  const handleContinue = () => {
    if (photoBlob) {
      onSelfieCompleted(photoBlob);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Navigation Buttons */}
      <div
        className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 pointer-events-none mt-4"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Back Button - Left */}
        <button onClick={onBack} className="focus:outline-none pointer-events-auto" aria-label="Back">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </ThematicContainer>
        </button>

        {/* Cancel Button - Right */}
        <button onClick={onCancel} className="focus:outline-none pointer-events-auto" aria-label="Cancel">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ThematicContainer>
        </button>
      </div>

      {/* Header Info - Moved down to accommodate navigation buttons */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10 text-center"
        style={{
          top: 'calc(env(safe-area-inset-top) + 100px)',
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="text-lg font-medium mb-1 text-center">Identity Verification</div>
          <div className="text-sm text-gray-300 text-center">Verify it's really you completing this challenge</div>
        </div>
      </div>

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
      />

      {/* Face Guide Overlay - Centered text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-64 h-80 border-2 border-white/50 rounded-full flex items-center justify-center">
          <div className="text-white/70 text-sm text-center">
            <div className="text-center">Center your face</div>
            <div className="text-center">in this area</div>
          </div>
        </div>
      </div>

      {/* Instructions - Centered text */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 140px)',
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <span className="text-white text-sm text-center">Look directly at the camera</span>
        </div>
      </div>

      {/* Capture Button - Safe area aware */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        }}
      >
        <button
          onClick={capturePhoto}
          className="relative w-20 h-20 rounded-full border-2 border-white transition-all duration-300"
        >
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background: '#FF15C9',
            }}
          />
        </button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SelfieScreen;
