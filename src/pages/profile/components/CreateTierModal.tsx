import React, { useState } from 'react';
import { X, Plus, Trash2, Crown, DollarSign, FileText, Gift } from 'lucide-react';

interface CreateTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTier: (tierData: any) => void;
}

export const CreateTierModal: React.FC<CreateTierModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  onCreateTier,
                                                                }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [selectedColor, setSelectedColor] = useState<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>('common');

  const tierColors = [
    { value: 'common', label: 'Common', color: 'text-rarityCommon', bg: 'bg-rarityCommon' },
    { value: 'uncommon', label: 'Uncommon', color: 'text-rarityUncommon', bg: 'bg-rarityUncommon' },
    { value: 'rare', label: 'Rare', color: 'text-rarityRare', bg: 'bg-rarityRare' },
    { value: 'epic', label: 'Epic', color: 'text-rarityEpic', bg: 'bg-rarityEpic' },
    { value: 'legendary', label: 'Legendary', color: 'text-rarityLegendary', bg: 'bg-rarityLegendary' },
  ];

  const addBenefit = () => {
    setBenefits([...benefits, '']);
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  const handleSubmit = () => {
    const tierData = {
      name,
      price: parseInt(price),
      description,
      color: selectedColor,
      benefits: benefits.filter(benefit => benefit.trim() !== ''),
    };

    onCreateTier(tierData);

    // Reset form
    setName('');
    setPrice('');
    setDescription('');
    setBenefits(['']);
    setSelectedColor('common');
    onClose();
  };

  const isFormValid = name.trim() && price && description.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-nocenaPink" />
            <h2 className="text-xl font-bold text-white">Create New Tier</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Tier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tier Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Gold Supporter, VIP Member"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent"
            />
          </div>

          {/* Monthly Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monthly Price (NCX) *
            </label>
            <div className="relative">
              {/*<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />*/}
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="100"
                min="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what subscribers get with this tier..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Benefits (Optional)
              </label>
              <button
                onClick={addBenefit}
                className="flex items-center space-x-1 text-nocenaBlue hover:text-nocenaPink transition-colors duration-200 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Benefit</span>
              </button>
            </div>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="e.g., Access to exclusive posts"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nocenaBlue focus:border-transparent"
                  />
                  {benefits.length > 1 && (
                    <button
                      onClick={() => removeBenefit(index)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-medium mb-2">Preview</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedColor === 'common' ? 'bg-rarityCommon' :
                    selectedColor === 'uncommon' ? 'bg-rarityUncommon' :
                      selectedColor === 'rare' ? 'bg-rarityRare' :
                        selectedColor === 'epic' ? 'bg-rarityEpic' : 'bg-rarityLegendary'
                }`}></div>
                <span className="text-white font-semibold">{name || 'Tier Name'}</span>
                <span className="text-gray-400">•</span>
                <span className="text-nocenaPink font-medium">{price || '0'} NCX/month</span>
              </div>
              <p className="text-gray-300 text-sm">{description || 'Tier description will appear here...'}</p>
              {benefits.filter(b => b.trim()).length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-400 text-xs mb-1">Benefits:</p>
                  <ul className="text-gray-300 text-xs space-y-1">
                    {benefits.filter(b => b.trim()).map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <span className="text-nocenaBlue">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
            disabled={!isFormValid}
            className="bg-nocena-purple hover:bg-nocena-purple-fade disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2 rounded-lg transition-all duration-200 disabled:cursor-not-allowed font-semibold"
          >
            Create Tier
          </button>
        </div>
      </div>
    </div>
  );
};