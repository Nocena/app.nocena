import React from 'react';

interface OtherProfileViewProps {
  walletAddress: string;
}

const OtherProfileView: React.FC<OtherProfileViewProps> = ({ walletAddress }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-white">Other Profile Page</h1>
      <p className="text-lg text-gray-300 mt-4">Wallet Address: {walletAddress}</p>
    </div>
  );
};

export default OtherProfileView;