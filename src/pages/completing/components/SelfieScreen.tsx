'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  onCancel: () => void;
}

const SelfieScreen: React.FC<SelfieScreenProps> = ({ challenge, onSelfieCompleted, onBack, onCancel }) => {
  const [cameraReady, setCameraReady] = useState<boolean>(false);
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
        videoRef.current.oncanplay = () => {
          setCameraReady(true);
        };
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
          stopCamera();
          onSelfieCompleted(blob);
        }
      },
      'image/jpeg',
      0.9,
    );
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
        {/* Back Button */}
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

        {/* Cancel Button */}
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

      {/* Header */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10 text-center"
        style={{
          top: 'calc(env(safe-area-inset-top) + 100px)',
        }}
      >
        <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="xl" className="px-6 py-3">
          <div className="text-lg font-medium mb-1">Identity Verification</div>
          <div className="text-sm text-gray-300">Take a selfie to verify completion</div>
        </ThematicContainer>
      </div>

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
      />

      {/* Face Guide Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative">
          {/* Face oval guide */}
          <div className="w-56 h-72 border-2 border-nocenaPurple/60 rounded-full flex items-center justify-center">
            {!cameraReady && (
              <div className="text-nocenaPurple/70 text-sm text-center">
                <div>Loading camera...</div>
              </div>
            )}
          </div>

          {/* Corner guides */}
          <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-nocenaPurple rounded-tl-lg"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-nocenaPurple rounded-tr-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-nocenaPurple rounded-bl-lg"></div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-nocenaPurple rounded-br-lg"></div>
        </div>
      </div>

      {/* Challenge Info */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 140px)',
        }}
      >
        <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="xl" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src={challenge.challengerProfile}
              alt="Challenger"
              width={32}
              height={32}
              className="w-8 h-8 object-cover rounded-full"
            />
            <div>
              <div className="text-sm font-medium text-white">{challenge.title}</div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-nocenaPink">{challenge.reward}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={14} height={14} />
              </div>
            </div>
          </div>
        </ThematicContainer>
      </div>

      {/* Capture Button */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        }}
      >
        <button
          onClick={capturePhoto}
          disabled={!cameraReady}
          className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
            cameraReady ? 'border-2 border-white shadow-lg hover:scale-105' : 'border-2 border-gray-600 opacity-50'
          }`}
          aria-label="Take selfie"
        >
          <div
            className={`absolute inset-1 rounded-full transition-all duration-300 ${
              cameraReady ? 'bg-gradient-to-br from-nocenaPink to-nocenaPurple' : 'bg-gray-600'
            }`}
          />
          {cameraReady && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />}
        </button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SelfieScreen;
