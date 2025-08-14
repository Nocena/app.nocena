import React, { useState } from 'react';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

interface TrailerSectionProps {
  profilePicture: string | StaticImageData;
  generatedAvatar?: string | null;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
  userID?: string; // Add userID prop for generation
  enableAvatarFeature?: boolean; // New toggle prop - defaults to false (coming soon)
}

interface ClothingUploadBoxProps {
  type: 'cap' | 'hoodie' | 'pants' | 'shoes';
  icon: React.ReactNode;
  onImageUpload: (file: File) => void;
}

const ClothingUploadBox: React.FC<ClothingUploadBoxProps> = ({ type, icon, onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        onImageUpload(file);
      }
    };
    input.click();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        w-16 h-16 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
        flex items-center justify-center backdrop-blur-sm overflow-hidden
        ${
          imagePreview
            ? 'border-green-400 bg-green-500/20 p-0'
            : 'border-gray-400 bg-gray-700/30 text-gray-400 hover:border-purple-400 hover:bg-purple-500/20 hover:text-purple-300'
        }
      `}
      title={`Upload ${type} image`}
    >
      {imagePreview ? (
        <img src={imagePreview} alt={`${type} preview`} className="w-full h-full object-cover rounded-lg" />
      ) : (
        <>{icon}</>
      )}
    </div>
  );
};

const TrailerSection: React.FC<TrailerSectionProps> = ({
  profilePicture,
  generatedAvatar,
  onAvatarUpdated,
  userID = 'current-user',
  enableAvatarFeature = true, // Default to false (coming soon mode)
}) => {
  // State for avatar generation
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');

  // State for clothing uploads and avatar updating
  const [clothingUploads, setClothingUploads] = useState<{
    cap?: File;
    hoodie?: File;
    pants?: File;
    shoes?: File;
  }>({});

  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');

  const handleClothingUpload = (type: 'cap' | 'hoodie' | 'pants' | 'shoes', file: File) => {
    setClothingUploads((prev) => ({
      ...prev,
      [type]: file,
    }));
    console.log(`Uploaded ${type}:`, file.name);
  };

  const hasClothingUploads = () => {
    return Object.keys(clothingUploads).length > 0;
  };

  // Generate avatar function
  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    setGenerationError('');

    try {
      console.log('Generating avatar with template and profile picture...');

      // Convert profile picture to string if needed
      let profilePictureString: string;
      if (typeof profilePicture === 'string') {
        profilePictureString = profilePicture;
      } else {
        // If it's a StaticImageData object, use the src property
        profilePictureString = profilePicture.src || '/images/profile.png';
      }

      const response = await fetch('/api/chainGPT/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a stylized 3D avatar for the Nocena universe',
          profilePicture: profilePictureString,
          userID: userID,
          model: 'velogen',
          width: 512,
          height: 768,
          enhance: '2x',
          useTemplate: true, // Use the public/nft/avatar.png template
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Generation response:', data);

      if (data.success) {
        console.log('Avatar generation started, collection ID:', data.collectionId);
        console.log('Features used:', data.features);

        // Start polling for the generated avatar
        pollForGeneratedAvatar(data.collectionId);

        // Show success message
        console.log('🎨 Avatar generation started with template and profile picture!');
      } else {
        setGenerationError(data.error || 'Failed to generate avatar');
        setIsGeneratingAvatar(false);
      }
    } catch (error: any) {
      console.error('Avatar generation failed:', error);
      setGenerationError(`Failed to generate avatar: ${error.message || 'Unknown error'}`);
      setIsGeneratingAvatar(false);
    }
  };

  // Poll for generated avatar completion
  const pollForGeneratedAvatar = async (collectionId: string) => {
    const checkProgress = async () => {
      try {
        console.log('Checking avatar generation progress for:', collectionId);
        const response = await fetch(`/api/chainGPT/check-avatar-progress?collectionId=${collectionId}`);
        const data = await response.json();

        if (data.success && data.progress) {
          const progress = data.progress;
          console.log('Avatar generation progress:', progress);

          // Check if generation is completed
          if (progress.data && progress.data.generated && progress.data.images) {
            // Avatar generation completed, update the display
            const generatedAvatarUrl = progress.data.images[0];
            console.log('✅ Avatar generated successfully:', generatedAvatarUrl);

            // Update the parent component with new avatar
            if (onAvatarUpdated) {
              onAvatarUpdated(generatedAvatarUrl);
            }

            setIsGeneratingAvatar(false);
            console.log('🎉 Avatar successfully generated using template!');
          } else {
            // Continue polling if not completed
            console.log('Avatar generation still in progress...');
            setTimeout(checkProgress, 5000); // Check every 5 seconds
          }
        } else {
          console.error('Error in progress check:', data);
          setTimeout(checkProgress, 5000); // Retry in 5 seconds
        }
      } catch (err) {
        console.error('Error checking avatar generation progress:', err);
        setGenerationError('Error checking generation progress');
        setIsGeneratingAvatar(false);
      }
    };

    checkProgress();
  };

  // Convert files to base64 for API
  const convertFilesToBase64 = async (files: { [key: string]: File }) => {
    const base64Files: { [key: string]: string } = {};

    for (const [key, file] of Object.entries(files)) {
      if (file) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          base64Files[key] = base64;
        } catch (error) {
          console.error(`Error converting ${key} to base64:`, error);
        }
      }
    }

    return base64Files;
  };

  const handleUpdateAvatar = async () => {
    if (!hasClothingUploads() || !generatedAvatar) return;

    setIsUpdatingAvatar(true);
    setUpdateError('');

    try {
      console.log('Converting clothing files to base64...');
      const clothingBase64 = await convertFilesToBase64(clothingUploads);

      console.log('Updating avatar with clothing...');
      const response = await fetch('/api/chainGPT/update-avatar-clothing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseAvatar: generatedAvatar,
          clothingItems: clothingBase64,
          userID: userID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Update response:', data);

      if (data.success) {
        console.log('Avatar update started, collection ID:', data.collectionId);

        // Start polling for the updated avatar
        pollForUpdatedAvatar(data.collectionId);

        // Show success message
        console.log(`Avatar update started! Applied: ${data.clothingApplied.join(', ')}`);
      } else {
        setUpdateError(data.error || 'Failed to update avatar');
        setIsUpdatingAvatar(false);
      }
    } catch (error: any) {
      console.error('Avatar update failed:', error);
      setUpdateError(`Failed to update avatar: ${error.message || 'Unknown error'}`);
      setIsUpdatingAvatar(false);
    }
  };

  // Poll for updated avatar completion
  const pollForUpdatedAvatar = async (collectionId: string) => {
    const checkProgress = async () => {
      try {
        console.log('Checking avatar update progress for:', collectionId);
        const response = await fetch(`/api/chainGPT/check-avatar-progress?collectionId=${collectionId}`);
        const data = await response.json();

        if (data.success && data.progress) {
          const progress = data.progress;
          console.log('Avatar update progress:', progress);

          // Check if generation is completed
          if (progress.data && progress.data.generated && progress.data.images) {
            // Avatar update completed, update the display
            const updatedAvatarUrl = progress.data.images[0];
            console.log('✅ Avatar updated successfully:', updatedAvatarUrl);

            // Update the parent component with new avatar
            if (onAvatarUpdated) {
              onAvatarUpdated(updatedAvatarUrl);
            }

            setIsUpdatingAvatar(false);
            console.log('🎉 Avatar successfully updated with clothing!');
          } else {
            // Continue polling if not completed
            console.log('Avatar update still in progress...');
            setTimeout(checkProgress, 5000); // Check every 5 seconds
          }
        } else {
          console.error('Error in progress check:', data);
          setTimeout(checkProgress, 5000); // Retry in 5 seconds
        }
      } catch (err) {
        console.error('Error checking avatar update progress:', err);
        setUpdateError('Error checking update progress');
        setIsUpdatingAvatar(false);
      }
    };

    checkProgress();
  };

  // COMING SOON VIEW - Minimal version
  if (!enableAvatarFeature) {
    return (
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-3xl overflow-hidden p-6">
        <div className="text-center py-8">
          <h2 className="text-white text-xl font-bold mb-3">User Avatar</h2>
          <p className="text-gray-400 text-base mb-2">Feature Coming Soon</p>
          <p className="text-gray-500 text-sm">Avatar generation will be available soon</p>
        </div>
      </div>
    );
  }

  // FULL FEATURE VIEW (when enableAvatarFeature is true)
  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold mb-2">User Avatar</h2>
        <p className="text-gray-300 text-base">
          {generatedAvatar ? 'Your Nocena avatar' : 'Generate your unique Nocena avatar'}
        </p>
      </div>

      {/* Avatar Display Area */}
      <div className="px-6 pb-6">
        {generatedAvatar ? (
          // Show generated avatar with clothing options
          <div>
            <div className="flex gap-4 items-start">
              {/* Avatar Image */}
              <div className="flex-1">
                <div className="relative inline-block w-full">
                  <img
                    src={generatedAvatar}
                    alt="Generated Nocena Avatar"
                    className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl border border-white/20"
                  />

                  {/* Avatar info overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                      <p className="text-white text-sm font-medium">Nocena Avatar NFT</p>
                      <p className="text-gray-300 text-xs">Generated with template & profile reference</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clothing Options */}
              <div className="flex flex-col gap-3 w-20">
                {/* Cap */}
                <ClothingUploadBox
                  type="cap"
                  icon={
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L8 5v3h8V5l-4-4z" />
                      <path d="M7 9c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2H7z" />
                    </svg>
                  }
                  onImageUpload={(file) => handleClothingUpload('cap', file)}
                />

                {/* Hoodie */}
                <ClothingUploadBox
                  type="hoodie"
                  icon={
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3C9.8 3 8 4.8 8 7v2H6v10h12V9h-2V7c0-2.2-1.8-4-4-4zm2 6V7c0-1.1-.9-2-2-2s-2 .9-2 2v2h4z" />
                      <path d="M9 12h6v2H9v-2zm0 3h6v2H9v-2z" />
                      <circle cx="10" cy="6" r="1" />
                      <circle cx="14" cy="6" r="1" />
                    </svg>
                  }
                  onImageUpload={(file) => handleClothingUpload('hoodie', file)}
                />

                {/* Pants */}
                <ClothingUploadBox
                  type="pants"
                  icon={
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 2v8L6 20h4l1-6 1 6h4l-2-10V2H8zm2 2h4v6l-1 8h-2l-1-8V4z" />
                      <path d="M10 4h4v2h-4V4z" />
                    </svg>
                  }
                  onImageUpload={(file) => handleClothingUpload('pants', file)}
                />

                {/* Shoes */}
                <ClothingUploadBox
                  type="shoes"
                  icon={
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 18h20c0-1-1-2-2-2H16l-2-2H10l-2 2H4c-1 0-2 1-2 2z" />
                      <path d="M8 14h8l1 2H7l1-2z" />
                      <ellipse cx="12" cy="16" rx="8" ry="1" />
                    </svg>
                  }
                  onImageUpload={(file) => handleClothingUpload('shoes', file)}
                />
              </div>
            </div>

            {/* Update Avatar Button */}
            <div className="mt-6 px-4">
              {updateError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <p className="text-red-300 text-sm text-center">{updateError}</p>
                </div>
              )}

              <button
                onClick={handleUpdateAvatar}
                disabled={!hasClothingUploads() || !generatedAvatar || isUpdatingAvatar}
                className={`
                  w-full py-3 px-6 rounded-xl font-medium transition-all duration-200
                  ${
                    hasClothingUploads() && generatedAvatar && !isUpdatingAvatar
                      ? 'bg-gradient-to-r from-[#2353FF] via-[#6024FB] to-[#FF15C9] text-white hover:opacity-90 transform hover:scale-[1.02]'
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }
                  backdrop-blur-sm border border-white/10
                `}
              >
                {isUpdatingAvatar ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating Avatar...</span>
                  </div>
                ) : (
                  'Update Avatar with Clothing'
                )}
              </button>
            </div>

            {/* Avatar Actions */}
            <div className="mt-4 flex space-x-3 justify-center">
              <button
                onClick={handleGenerateAvatar}
                disabled={isGeneratingAvatar}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-sm hover:bg-white/20 transition-all"
              >
                Regenerate
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-[#2353FF] to-[#6024FB] border border-white/20 rounded-xl text-white text-sm hover:opacity-90 transition-all">
                Mint as NFT
              </button>
            </div>
          </div>
        ) : (
          // Show placeholder and generation options
          <div className="text-center py-8">
            {/* Current Profile Picture Preview */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-4">Using Profile Picture as Reference:</p>
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-white/20">
                <Image
                  src={profilePicture}
                  alt="Current Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Template Preview */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-4">Based on Nocena Avatar Template:</p>
              <div className="w-32 h-40 mx-auto rounded-xl overflow-hidden border-2 border-purple-400/30 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                <img
                  src="/nft/avatar.png"
                  alt="Avatar Template"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if template image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    `;
                  }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">Low-poly futuristic style</p>
            </div>

            {/* Generation Error Display */}
            {generationError && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-red-300 text-sm text-center">{generationError}</p>
              </div>
            )}

            <h3 className="text-white text-lg font-semibold mb-2">Generate Your Avatar</h3>
            <p className="text-gray-400 text-base mb-4">Create a unique stylized 3D avatar for the Nocena universe</p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Your avatar will be generated using the Nocena 3D template style combined with features from your profile
              picture
            </p>

            {/* Generate Avatar Button */}
            <button
              onClick={handleGenerateAvatar}
              disabled={isGeneratingAvatar}
              className={`
                w-full max-w-sm mx-auto py-4 px-6 rounded-xl font-medium transition-all duration-200
                ${
                  !isGeneratingAvatar
                    ? 'bg-gradient-to-r from-[#2353FF] via-[#6024FB] to-[#FF15C9] text-white hover:opacity-90 transform hover:scale-[1.02]'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }
                backdrop-blur-sm border border-white/10
              `}
            >
              {isGeneratingAvatar ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Avatar...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate Nocena Avatar</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailerSection;
