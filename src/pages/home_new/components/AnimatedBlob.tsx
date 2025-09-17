import React, { useEffect, useRef, useState } from 'react';

interface AnimatedBlobProps {
  mode?: 'waiting' | 'speaking';
  size?: number;
  onRestart?: () => void;
  showRestartButton?: boolean;
}

const AnimatedBlob: React.FC<AnimatedBlobProps> = ({ 
  mode = 'waiting', 
  size = 200,
  onRestart,
  showRestartButton = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const sphereRef = useRef<any>(null);
  const animationRef = useRef<number>(null);
  const timeRef = useRef(0);
  const lastTimestampRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Brand colors
  const nocenaColors = {
    blue: '#3B82F6',
    purple: '#8B5CF6', 
    pink: '#EC4899'
  };

  // Different animation parameters for modes
  const getModeParams = () => {
    switch (mode) {
      case 'speaking':
        return {
          speed: 25,
          spikes: 1.2,
          processing: 1.4,
          color: nocenaColors.pink
        };
      case 'waiting':
      default:
        return {
          speed: 13,
          spikes: 0.6,
          processing: 1.0,
          color: nocenaColors.blue
        };
    }
  };

  const initThreeJS = async () => {
    if (!canvasRef.current || isInitialized) return;

    try {
      // Dynamically import Three.js to avoid SSR issues
      const THREE = await import('three');
      
      const canvas = canvasRef.current;
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
      });
      
      renderer.setSize(size, size);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setClearColor(0x000000, 0); // Transparent background
      
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.z = 5;
      
      // Create sphere geometry with high detail for smooth morphing
      const geometry = new THREE.SphereGeometry(0.8, 128, 128);
      
      const params = getModeParams();
      const material = new THREE.MeshPhongMaterial({
        color: params.color,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });
      
      // Lighting setup for nice 3D effect
      const lightTop = new THREE.DirectionalLight(0xffffff, 0.7);
      lightTop.position.set(0, 500, 200);
      scene.add(lightTop);
      
      const lightBottom = new THREE.DirectionalLight(0xffffff, 0.25);
      lightBottom.position.set(0, -500, 400);
      scene.add(lightBottom);
      
      const ambientLight = new THREE.AmbientLight(0x798296, 0.5);
      scene.add(ambientLight);
      
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      
      // Store references
      sceneRef.current = scene;
      rendererRef.current = renderer;
      sphereRef.current = sphere;
      
      setIsInitialized(true);
      startAnimation();
      
    } catch (error) {
      console.error('Failed to initialize Three.js:', error);
    }
  };

  // Simple noise function (simplified version of simplex noise)
  const noise3D = (x: number, y: number, z: number): number => {
    return Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4) * 0.5;
  };

  const updateBlob = (timestamp: number) => {
    if (!sphereRef.current || !sceneRef.current) return;

    const timeDiff = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;
    
    const params = getModeParams();
    timeRef.current += timeDiff * 0.00005 * params.speed;
    
    const spikes = params.spikes * params.processing;
    const vertices = sphereRef.current.geometry.attributes.position.array;
    const originalVertices = sphereRef.current.geometry.userData.originalVertices;
    
    if (!originalVertices) {
      // Store original vertices on first run
      sphereRef.current.geometry.userData.originalVertices = [...vertices];
      return;
    }
    
    // Morph vertices based on noise
    for (let i = 0; i < vertices.length; i += 3) {
      const x = originalVertices[i];
      const y = originalVertices[i + 1];
      const z = originalVertices[i + 2];
      
      // Normalize
      const length = Math.sqrt(x * x + y * y + z * z);
      const nx = x / length;
      const ny = y / length;
      const nz = z / length;
      
      // Apply noise
      const noiseValue = noise3D(
        nx * spikes,
        ny * spikes,
        nz * spikes + timeRef.current
      );
      
      const scale = 1 + 0.3 * noiseValue;
      vertices[i] = nx * scale;
      vertices[i + 1] = ny * scale;
      vertices[i + 2] = nz * scale;
    }
    
    sphereRef.current.geometry.attributes.position.needsUpdate = true;
    sphereRef.current.geometry.computeVertexNormals();
    
    // Update material color based on mode
    sphereRef.current.material.color.setHex(params.color.replace('#', '0x'));
  };

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      updateBlob(timestamp);
      
      if (rendererRef.current && sceneRef.current) {
        const camera = sceneRef.current.getObjectByName('camera') || 
                      sceneRef.current.children.find((child: any) => child.type === 'PerspectiveCamera');
        
        if (camera) {
          rendererRef.current.render(sceneRef.current, camera);
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    lastTimestampRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleRestart = () => {
    // Reset animation state
    timeRef.current = 0;
    lastTimestampRef.current = 0;
    
    // Call parent restart handler
    if (onRestart) {
      onRestart();
    }
  };

  useEffect(() => {
    initThreeJS();
    
    return () => {
      stopAnimation();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update blob when mode changes
  useEffect(() => {
    if (sphereRef.current && isInitialized) {
      const params = getModeParams();
      sphereRef.current.material.color.setHex(params.color.replace('#', '0x'));
    }
  }, [mode, isInitialized]);

  return (
    <div className="relative flex flex-col items-center">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ 
            filter: mode === 'speaking' ? 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.5))' : 
                   'drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))'
          }}
        />
        
        {/* Loading state */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Restart button */}
      {showRestartButton && (
        <button
          onClick={handleRestart}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          Restart Experience
        </button>
      )}
      
      {/* Mode indicator */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {mode === 'speaking' ? 'Speaking...' : 'Listening...'}
      </div>
    </div>
  );
};

export default AnimatedBlob;