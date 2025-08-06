// src/lib/map/mapService.ts
import { ChallengeData, LocationData } from './types';
import axios from 'axios';

// Function to fetch public challenges from Dgraph - UPDATED to include completions
export const fetchNearbyChallenge = async (userLocation: LocationData): Promise<ChallengeData[]> => {
  try {
    // Query Dgraph directly - UPDATED to include completions
    const query = `
      query {
        queryPublicChallenge(filter: { isActive: true }) {
          id
          title
          description
          reward
          location {
            longitude
            latitude
          }
          creator {
            id
            username
            profilePicture
          }
          participantCount
          maxParticipants
          createdAt
          completions {
            id
            completionDate
            user {
              id
              username
              profilePicture
            }
          }
        }
      }
    `;

    const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

    const response = await axios.post(DGRAPH_ENDPOINT, { query }, { headers: { 'Content-Type': 'application/json' } });

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return [];
    }

    const allChallenges = response.data.data?.queryPublicChallenge || [];

    // Filter challenges by distance (10km radius)
    const nearbyPublicChallenges = allChallenges.filter((challenge: any) => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        challenge.location.latitude,
        challenge.location.longitude,
      );

      return distance <= 1000; // 1000km radius
    });

    // Transform Dgraph challenge data to match our ChallengeData type
    return nearbyPublicChallenges.map((challenge: any, index: number) => ({
      id: challenge.id,
      position: [challenge.location.longitude, challenge.location.latitude],
      title: challenge.title,
      description: challenge.description,
      reward: challenge.reward,
      color: '#2353FF', // Default color for consistency
      // Additional data for UI
      creatorName: challenge.creator.username,
      creatorAvatar: challenge.creator.profilePicture,
      participantCount: challenge.participantCount,
      maxParticipants: challenge.maxParticipants,
      // NEW: Add completion data
      completionCount: challenge.completions?.length || 0,
      recentCompletions:
        challenge.completions
          ?.sort((a: any, b: any) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())
          ?.slice(0, 5) // Get most recent 5 completions
          ?.map((completion: any) => ({
            userId: completion.user.id,
            username: completion.user.username,
            profilePicture: completion.user.profilePicture,
            completedAt: completion.completionDate,
          })) || [],
    }));
  } catch (error) {
    console.error('Error fetching public challenges:', error);
    // Return empty array in case of error
    return [];
  }
};

// Helper for loading map styles
export const getMapStyleURL = (accessToken: string): string => {
  // Use your custom NOCENA style ID with the correct URL format
  const customStyleId = '43a6bd45-bb06-45ab-a7df-6e52d3fc98cb';
  return `https://api.jawg.io/styles/${customStyleId}.json?access-token=${accessToken}`;
};

// Get user location with reliable caching
export const getUserLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    const handleError = (error: GeolocationPositionError | Error) => {
      console.warn('Geolocation error:', error);

      // Use a default location in Prague
      // This is a fallback to always have a usable location
      const defaultLocation = {
        longitude: 14.4378,
        latitude: 50.0755, // Prague center
      };

      resolve(defaultLocation);
    };

    try {
      // Try to get cached location for immediate response
      const cachedData = localStorage.getItem('nocena_user_location');
      if (cachedData) {
        try {
          const { location, timestamp } = JSON.parse(cachedData);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('Using cached location');
            return resolve(location);
          }
        } catch (e) {
          console.warn('Error parsing cached location:', e);
        }
      }
    } catch (e) {
      console.warn('Error reading cached location:', e);
    }

    // No valid cache, get fresh location
    if (!navigator.geolocation) {
      return handleError(new Error('Geolocation is not supported by your browser'));
    }

    // Set up a timeout to handle slow geolocation requests
    const timeoutId = setTimeout(() => {
      handleError(new Error('Location request timed out'));
    }, 10000); // 10 second timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const locationData = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };

        // Cache the new location
        try {
          localStorage.setItem(
            'nocena_user_location',
            JSON.stringify({
              location: locationData,
              timestamp: Date.now(),
            }),
          );
        } catch (e) {
          console.warn('Error caching location:', e);
        }

        resolve(locationData);
      },
      (error) => {
        clearTimeout(timeoutId);
        handleError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000, // Accept positions up to 1 minute old
      },
    );
  });
};

// Load MapLibre CSS
export const loadMapLibreCSS = () => {
  if (document.querySelector('link[href*="maplibre-gl.css"]')) {
    return; // Already loaded
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
  document.head.appendChild(link);
};

/**
 * Helper function to calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
