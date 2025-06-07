import React, { useEffect, useRef, useState } from 'react';
import type { MapOptions } from 'maplibre-gl';
import { ChallengeData, LocationData } from '../../lib/map/types';
import UserLocationMarker from './components/UserLocationMarker';
import ChallengeMarker from './components/ChallengeMarker';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import { fetchNearbyChallenge, getMapStyleURL, getUserLocation, loadMapLibreCSS } from '../../lib/map/mapService';

const MapView = () => {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLibrary, setMapLibrary] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [locatingUser, setLocatingUser] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  // Force full viewport height for map container
  useEffect(() => {
    const setMapHeight = () => {
      if (mapContainerRef.current) {
        // Force the map to take full viewport height
        mapContainerRef.current.style.height = '100vh';
        mapContainerRef.current.style.width = '100vw';
        
        // Also set position to ensure it covers everything
        const parentContainer = mapContainerRef.current.parentElement;
        if (parentContainer) {
          parentContainer.style.position = 'fixed';
          parentContainer.style.top = '0';
          parentContainer.style.left = '0';
          parentContainer.style.right = '0';
          parentContainer.style.bottom = '0';
          parentContainer.style.zIndex = '1';
        }
      }
    };

    setMapHeight();
    window.addEventListener('resize', setMapHeight);

    return () => {
      window.removeEventListener('resize', setMapHeight);
    };
  }, []);

  // Get user location first, then initialize map
  useEffect(() => {
    const getUserLocationFirst = async () => {
      setLocatingUser(true);

      try {
        // Get user location
        const location = await getUserLocation();
        setUserLocation(location);
        setInitialLocationSet(true);
      } catch (error: any) {
        console.warn('Error getting user location:', error);

        // Default location already handled in getUserLocation
        const defaultLocation = { longitude: 14.4378, latitude: 50.0755 }; // Prague center
        setUserLocation(defaultLocation);
        setInitialLocationSet(true);

        setLoadError('Unable to determine your precise location. Using default location instead.');
        setTimeout(() => setLoadError(null), 5000);
      }
    };

    getUserLocationFirst();
  }, []);

  // Load and initialize MapLibre only after we have the user's location
  useEffect(() => {
    if (!initialLocationSet || !userLocation) return;

    const initializeMap = async () => {
      try {
        // Load MapLibre CSS
        loadMapLibreCSS();

        // Dynamically import MapLibre
        const MapLibre = await import('maplibre-gl');
        setMapLibrary(MapLibre);

        if (!mapContainerRef.current) return;

        // Get token from environment variable
        const jawgAccessToken = process.env.NEXT_PUBLIC_JAWG_ACCESS_TOKEN;

        if (!jawgAccessToken) {
          console.warn('NEXT_PUBLIC_JAWG_ACCESS_TOKEN is not set in environment variables');
          setLoadError('Map access token not configured. Please contact support.');
          return;
        }

        // Create map with the user's location as center
        const map = new MapLibre.Map({
          container: mapContainerRef.current,
          style: getMapStyleURL(jawgAccessToken),
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 15,
          attributionControl: false,
          zoomControl: false,
          renderWorldCopies: false,
          interactive: true,
          pitchWithRotate: false,
          antialias: true,
          fadeDuration: 0,
          preserveDrawingBuffer: true,
        } as MapOptions);

        // Add only a minimal attribution control
        map.addControl(
          new MapLibre.AttributionControl({
            compact: true,
          }),
          'bottom-left',
        );

        // When map loads, load challenges
        map.on('load', async () => {
          console.log('Map loaded successfully');
          mapInstanceRef.current = map;
          setMapLoaded(true);

          try {
            // Load nearby challenges
            const nearbyChallenge = await fetchNearbyChallenge(userLocation);
            setChallenges(nearbyChallenge);
          } catch (error) {
            console.error('Error fetching challenges:', error);
          } finally {
            setLocatingUser(false);
          }
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
          setLoadError('Error loading map. Please try again later.');
          setLocatingUser(false);
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setLoadError('Failed to load map. Please check your connection and try again.');
        setLocatingUser(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLocationSet, userLocation]);

  // Handle recenter button click
  const handleRecenterMap = async () => {
    if (!mapInstanceRef.current) return;

    setLocatingUser(true);

    try {
      const location = await getUserLocation();
      setUserLocation(location);

      mapInstanceRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        essential: true,
        animate: true,
        duration: 1000, // 1 second animation
      });
    } catch (error) {
      console.warn('Error getting position for recentering:', error);
    } finally {
      setLocatingUser(false);
    }
  };

  // Reset selected pin when map moves
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapMove = () => {
      if (selectedPin !== null) {
        setSelectedPin(null);
      }
    };

    const mapInstance = mapInstanceRef.current;
    mapInstance.on('movestart', handleMapMove);

    return () => {
      if (mapInstance && mapInstance.off) {
        mapInstance.off('movestart', handleMapMove);
      }
    };
  }, [selectedPin]);

  return (
    <div 
      className="fixed inset-0 bg-gray-900"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-gray-900"
        style={{
          width: '100vw',
          height: '100vh'
        }}
      />

      {/* Challenge markers - Render these first so user marker appears on top */}
      {mapLoaded &&
        mapLibrary &&
        challenges.map((challenge, index) => (
          <ChallengeMarker
            key={challenge.id || `challenge-${index}`}
            map={mapInstanceRef.current}
            MapLibre={mapLibrary}
            challenge={challenge}
            index={index}
            isSelected={selectedPin === index}
            onSelect={setSelectedPin}
          />
        ))}

      {/* User location marker - Render last so it appears on top */}
      {mapLoaded && mapLibrary && userLocation && (
        <UserLocationMarker
          map={mapInstanceRef.current}
          MapLibre={mapLibrary}
          location={[userLocation.longitude, userLocation.latitude]}
        />
      )}

      {/* Map controls */}
      <MapControls
        mapLoaded={mapLoaded}
        locatingUser={locatingUser}
        onRecenter={handleRecenterMap}
        userLocation={userLocation}
      />

      {/* Loading overlay */}
      <LoadingOverlay mapLoaded={mapLoaded} locatingUser={locatingUser} loadError={loadError} />
    </div>
  );
};

export default MapView;
