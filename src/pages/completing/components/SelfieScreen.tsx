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
}

type SelfieStage = 'camera';

const SelfieScreen: React.FC<SelfieScreenProps> = ({ challenge, onSelfieCompleted, onBack }) => {
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
      {/* Header Info */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="text-lg font-medium mb-1">Identity Verification</div>
          <div className="text-sm text-gray-300">Verify it's really you completing this challenge</div>
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

      {/* Face Guide Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-64 h-80 border-2 border-white/50 rounded-full flex items-center justify-center">
          <div className="text-white/70 text-sm text-center">
            <div>Center your face</div>
            <div>in this area</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <span className="text-white text-sm">Look directly at the camera</span>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
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
