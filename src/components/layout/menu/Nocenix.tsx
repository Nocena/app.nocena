import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Coins, AlertTriangle, Gift, TrendingUp, Users, Heart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const nocenix = '/nocenix.ico';

interface NocenixMenuProps {
  onBack: () => void;
}

const NocenixMenu: React.FC<NocenixMenuProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [tokenBalance] = useState<number>(user?.earnedTokens || 0);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    rendererRef.current = renderer;

    // Make canvas fill the background
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '-1';
    renderer.domElement.style.pointerEvents = 'none';

    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup with more subtle intensity for background
    const ambientLight = new THREE.AmbientLight(0x404040, 10);
    scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Accent lights for coin material
    const pinkLight = new THREE.PointLight(0xff69b4, 0.6, 15);
    pinkLight.position.set(-6, 4, 5);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 0.4, 15);
    blueLight.position.set(6, -4, 4);
    scene.add(blueLight);

    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-4, 0, -6);
    scene.add(rimLight);

    // Handle window resize
    const handleResize = () => {
      if (renderer && camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      '/3d/nocenix.glb',
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Scale and position the model for background effect
        model.scale.set(3, 3, 3);
        model.position.set(2, -1, 0);

        // Enhanced materials with subtle glow for background
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.metalness = 0.9;
              child.material.roughness = 0.1;
              child.material.envMapIntensity = 1;

              // Add subtle emission for background glow effect
              child.material.emissive = new THREE.Color(0x1a1a2e);
              child.material.emissiveIntensity = 0.1;

              // Make it slightly transparent for background effect
              child.material.transparent = true;
              child.material.opacity = 0.7;
            }
          }
        });

        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('Error loading 3D model:', error);
      },
    );

    // Smooth animation loop
    let lastTime = 0;
    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Smooth rotation with easing for background effect
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005;
        modelRef.current.rotation.x += 0.002;

        // Add subtle floating motion
        modelRef.current.position.y = -1 + Math.sin(currentTime * 0.001) * 0.3;
        modelRef.current.position.x = 2 + Math.cos(currentTime * 0.0008) * 0.5;
      }

      renderer.render(scene, camera);
    };
    animate(0);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* 3D Background Container */}
      <div ref={mountRef} className="fixed inset-0 -z-10" />

      {/* Content Layer */}
      <div className="relative z-10 p-6 min-h-screen backdrop-blur-[0.5px]">
        {/* Back Button - Thumb-friendly zone */}
        <div
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          className="flex items-center text-white/70 hover:text-white mb-8 transition-colors cursor-pointer select-none p-2 -ml-2 rounded-lg hover:bg-white/5"
          role="button"
          tabIndex={0}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mr-2"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Menu
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Icon Container - Now just showing static icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-32 h-32 rounded-3xl overflow-hidden relative bg-white/5 border border-white/10 flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(255,105,180,0.15) 0%, rgba(59,130,246,0.15) 40%, rgba(16,7,40,0.8) 100%)',
                  boxShadow: `
                    0 0 50px rgba(255,105,180,0.3),
                    0 0 100px rgba(59,130,246,0.2),
                    inset 0 0 50px rgba(0,0,0,0.2)
                  `,
                }}
              >
                <Image src={nocenix} alt="Nocenix Token" width={64} height={64} className="opacity-90" />

                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-3xl border border-white/10 animate-pulse"></div>
              </div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div
                  className="absolute w-1 h-1 bg-nocenaPink rounded-full animate-ping"
                  style={{ top: '20%', left: '15%', animationDelay: '0s' }}
                ></div>
                <div
                  className="absolute w-1 h-1 bg-nocenaBlue rounded-full animate-ping"
                  style={{ top: '70%', right: '20%', animationDelay: '1s' }}
                ></div>
                <div
                  className="absolute w-0.5 h-0.5 bg-white/50 rounded-full animate-ping"
                  style={{ top: '40%', right: '10%', animationDelay: '2s' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Nocenix</h1>
          <p className="text-white/60 text-lg mb-6">Your content, your profit</p>

          {/* Current Balance Display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h3 className="text-white/80 font-medium mb-3">Your Balance</h3>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-nocenaPink to-nocenaBlue bg-clip-text text-transparent">
                {tokenBalance.toLocaleString()}
              </div>
              <div className="text-2xl font-medium text-white">NCX</div>
            </div>
            <p className="text-white/50 text-sm">Beta tokens • No monetary value yet</p>
          </div>
        </div>

        {/* Beta Testing Notice */}
        <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/40 rounded-2xl p-5 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-orange-200 font-medium mb-2">Beta Testing Phase</h3>
              <p className="text-orange-300/80 text-sm leading-relaxed">
                Nocenix is currently a <strong>testnet token</strong> with no monetary value. These tokens are for
                testing purposes during our beta phase, but will carry over when we launch!
              </p>
            </div>
          </div>
        </div>

        {/* What is Nocenix */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Gift className="w-5 h-5 mr-3 text-nocenaPink" />
            What is Nocenix?
          </h3>
          <p className="text-white/80 leading-relaxed">
            Nocenix is Nocena's reward token that recognizes your participation and engagement. Think of it as your
            digital reputation score that will have real value after our beta launch.
          </p>
        </div>

        {/* How You Earn */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h3 className="text-white font-semibold mb-5 text-lg">How You Earn Nocenix</h3>
          <div className="space-y-4">
            {[
              {
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-nocenaBlue"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c-1.1 0-2.1-.4-2.8-1.2L12 4.8 5.8 10.8C5.1 11.6 4.1 12 3 12" />
                  </svg>
                ),
                bgColor: 'bg-nocenaBlue/20',
                title: 'Complete Challenges',
                desc: 'Earn tokens for each challenge you finish',
              },
              {
                icon: <Heart className="w-5 h-5 text-nocenaPink" />,
                bgColor: 'bg-nocenaPink/20',
                title: 'Give & Receive Likes',
                desc: 'Active engagement with the community',
              },
              {
                icon: <Users className="w-5 h-5 text-green-400" />,
                bgColor: 'bg-green-500/20',
                title: 'Invite Friends',
                desc: 'Both you and your friend earn 50 tokens',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
                bgColor: 'bg-purple-500/20',
                title: 'Platform Activity',
                desc: 'General participation and engagement',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                <div
                  className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center backdrop-blur-sm`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-white/60 text-sm">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Future Plans */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-5 flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-3 text-nocenaPink" />
            After Beta Launch
          </h3>
          <div className="space-y-4">
            {[
              {
                color: 'bg-nocenaPink',
                title: 'Real Token Launch',
                desc: 'Nocenix will become a tradeable token on major exchanges',
              },
              {
                color: 'bg-nocenaBlue',
                title: 'Monetary Value',
                desc: 'Your earned tokens will have real trading value',
              },
              {
                color: 'bg-nocenaPurple',
                title: 'Beta Rewards',
                desc: 'All tokens earned during beta will carry over to the real token',
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-3 h-3 ${item.color} rounded-full mt-2 flex-shrink-0 shadow-lg`}></div>
                <div>
                  <p className="text-white/90 leading-relaxed">
                    <strong className="text-white">{item.title}:</strong> {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom padding for scroll comfort */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default NocenixMenu;
