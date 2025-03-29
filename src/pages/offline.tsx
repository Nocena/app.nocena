import React from 'react';
import Head from 'next/head';
import Image from 'next/image';

const OfflinePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-nocenaBg text-white">
      <Head>
        <title>Offline - Nocena</title>
      </Head>
      <div className="text-center p-4">
        <div className="mb-6">
          <div className="h-20 mx-auto relative">
            <Image src="/logo/eyes.png" alt="Nocena Logo" width={256} height={256} priority />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">You're offline</h1>
        <p className="mb-4">Please check your internet connection and try again.</p>
        <p className="text-sm text-gray-400">
          Nocena requires an internet connection to fetch challenges and connect with other users.
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
