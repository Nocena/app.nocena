import React from 'react';
import { DualTokenTest } from '../components/test/DualTokenTest';

export default function TestTokensPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dual Token System Test</h1>
        <DualTokenTest />
      </div>
    </div>
  );
}
