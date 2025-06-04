// pages/admin/seed-invites.tsx
import React, { useState } from 'react';
import { Copy, Plus, Download } from 'lucide-react';
import Head from 'next/head';

const AdminSeedInvites: React.FC = () => {
  const [adminKey, setAdminKey] = useState('');
  const [count, setCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSeedCodes = async () => {
    if (!adminKey.trim()) {
      setError('Admin key is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/seed-initial-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, count }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedCodes(data.codes);
        setSuccess(`Successfully generated ${data.codesCreated} invite codes!`);
        if (data.errors && data.errors.length > 0) {
          setError(`Note: ${data.errors.length} codes failed to generate`);
        }
      } else {
        setError(data.error || 'Failed to generate codes');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error generating codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAllCodes = async () => {
    const codesText = generatedCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      setSuccess('All codes copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to copy codes');
    }
  };

  const handleDownloadCodes = () => {
    const codesText = generatedCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nocena-invite-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(`Code ${code} copied!`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setError('Failed to copy code');
    }
  };

  return (
    <>
      <Head>
        <title>Admin - Seed Invite Codes | Nocena</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-nocenaBg to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Nocena Admin - Seed Invite Codes</h1>
            <p className="text-white/60">Generate initial invite codes for app launch</p>
          </div>

          {/* Seed Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Admin Key</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter admin key"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Number of Codes to Generate</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 100)}
                  min={1}
                  max={1000}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="100"
                  required
                />
                <p className="text-white/40 text-xs mt-1">Maximum 1000 codes per batch</p>
              </div>

              <button
                type="button"
                onClick={handleSeedCodes}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? 'Generating...' : 'Generate Invite Codes'}</span>
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400">{success}</p>
              </div>
            )}
          </div>

          {/* Generated Codes Display */}
          {generatedCodes.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Generated Invite Codes ({generatedCodes.length})</h2>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyAllCodes}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy All</span>
                  </button>

                  <button
                    onClick={handleDownloadCodes}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Codes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-white/10 rounded-lg p-3 text-center border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                    onClick={() => handleCopyCode(code)}
                    title="Click to copy"
                  >
                    <span className="font-mono text-white font-medium text-sm">{code}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">Click any code to copy it individually</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-600/10 rounded-2xl p-6 border border-blue-600/20">
            <h3 className="text-white font-medium text-lg mb-3">📋 Distribution Instructions</h3>
            <ul className="text-white/70 text-sm space-y-2">
              <li>• Share these codes with your initial user base</li>
              <li>• Each code can only be used once</li>
              <li>• New users get 2 invite codes when they join</li>
              <li>• Users earn 50 Nocenix tokens when their invites are used</li>
              <li>• Monitor usage through the admin dashboard</li>
              <li>• These are system-generated codes (not tied to specific users)</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSeedInvites;
