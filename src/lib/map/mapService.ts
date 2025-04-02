import { ChallengeData, LocationData } from './types';

// Function to fetch challenges near a location
export const fetchNearbyChallenge = async (userLocation: LocationData): Promise<ChallengeData[]> => {
  // Return fixed marker positions in Prague
  return [
    {
      id: 'challenge-1',
      position: [14.3896, 50.0891], // Prague Castle area
      color: '#FF5722',
      title: 'Photo Challenge',
      description: 'Take a creative photo at this historic location',
      reward: 50
    },
    {
      id: 'challenge-2',
      position: [14.3700, 50.0980], // Letná Park
      color: '#9C27B0',
      title: 'Street Art Hunt',
      description: 'Find the hidden artwork nearby',
      reward: 75
    },
    {
      id: 'challenge-3',
      position: [14.3450, 50.0835], // Břevnov Monastery
      color: '#2196F3',
      title: 'Local Monument',
      description: 'Visit this historical landmark',
      reward: 100
    },
    {
      id: 'challenge-4',
      position: [14.3540, 50.1010], // Stromovka Park
      color: '#4CAF50',
      title: 'Nature Spot',
      description: 'Capture the natural beauty here',
      reward: 60
    }
  ];
};

// Helper for loading map styles
export const getMapStyleURL = (accessToken: string): string => {
  return `https://api.jawg.io/styles/jawg-dark.json?access-token=${accessToken}`;
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
        latitude: 50.0755 // Prague center
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
          latitude: position.coords.latitude
        };
        
        // Cache the new location
        try {
          localStorage.setItem('nocena_user_location', JSON.stringify({
            location: locationData,
            timestamp: Date.now()
          }));
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
        maximumAge: 60000 // Accept positions up to 1 minute old
      }
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