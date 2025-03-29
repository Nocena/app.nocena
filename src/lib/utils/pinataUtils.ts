// src/lib/utils/pinataUtils.ts
export async function checkPinataForFile(fileName: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/checkPinataFile?fileName=${encodeURIComponent(fileName)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.cid || null;
  } catch (error) {
    console.error('Error checking Pinata:', error);
    return null;
  }
}

export function createFallbackMediaMetadata(videoCID: string, selfieCID: string | null): any {
  return {
    videoCID,
    selfieCID,
    hasVideo: true,
    hasSelfie: !!selfieCID,
    timestamp: Date.now(),
  };
}
