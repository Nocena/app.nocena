import React, { useState } from 'react';
import { X, Image, Video, Upload, Tag, Globe, Lock } from 'lucide-react';
import { MembershipTier } from '../../../lib/types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  membershipTiers: MembershipTier[];
  onCreatePost: (postData: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  membershipTiers,
                                                                  onCreatePost,
                                                                }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('public');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
    }
  };

  const handleSubmit = () => {
    const postData = {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      tierRequired: selectedTier === 'public' ? null : selectedTier,
      isPublic: selectedTier === 'public',
      mediaFile: mediaFile,
    };

    onCreatePost(postData);

    // Reset form
    setTitle('');
    setContent('');
    setTags('');
    setSelectedTier('public');
    setMediaFile(null);
    setMediaPreview('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent resize-none"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Media (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors duration-200">
              {mediaPreview ? (
                <div className="space-y-4">
                  {mediaFile?.type.startsWith('image/') ? (
                    <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <video src={mediaPreview} className="max-h-48 mx-auto rounded-lg" controls />
                  )}
                  <button
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview('');
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove media
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">Upload image or video</p>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="inline-flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200"
                  >
                    <Image className="w-4 h-4" />
                    <span>Choose File</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access Level
            </label>
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedTier === 'public'
                    ? 'border-nocenaBlue bg-nocenaBlue bg-opacity-10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedTier('public')}
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-nocenaBlue" />
                  <div>
                    <p className="text-white font-medium">Public</p>
                    <p className="text-gray-400 text-sm">Free for everyone to view</p>
                  </div>
                </div>
              </div>

              {membershipTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedTier === tier.id
                      ? 'border-nocenaPurple bg-nocenaPurple bg-opacity-10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-nocenaPurple" />
                    <div>
                      <p className="text-white font-medium">{tier.name}</p>
                      <p className="text-gray-400 text-sm">
                        {tier.price} NCX/month • {tier.subscriberCount} subscribers
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gaming, tutorial, review (comma separated)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title || !content}
            className="bg-nocena-purple hover:bg-nocena-purple-fade disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            Create Post
          </button>
        </div>
      </div>
    </div>
  );
};