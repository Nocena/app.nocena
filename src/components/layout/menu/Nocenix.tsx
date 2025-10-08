import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Coins, AlertTriangle, Gift, TrendingUp, Users, Heart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAccount } from 'wagmi';
import { useDualTokens } from '../../../hooks/contracts/useDualTokens';
import { useIsRewardMinter } from '../../../hooks/contracts/useNocenite';
import { useChallengeRewards } from '../../../hooks/contracts/useChallengeRewards';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const nocenix = '/nocenix.ico';

interface NocenixMenuProps {
  onBack: () => void;
}

const NocenixMenu: React.FC<NocenixMenuProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { nctBalance, ncxBalance } = useDualTokens();
  const { data: isRewardMinter } = useIsRewardMinter(address as `0x${string}`);
  const { rewardDaily, rewardWeekly, rewardMonthly, isPending: rewardPending } = useChallengeRewards();

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
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Nocenix / Nocenite</h1>
          <p className="text-white/60 text-lg mb-6">Dual token ecosystem for creators</p>
        </div>

        {/* Test Functionality - Only show if wallet is connected and authorized */}
        {isConnected && isRewardMinter && (
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/40 rounded-2xl p-5 mb-6">
            <h3 className="text-blue-200 font-medium mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Test Token System
            </h3>

            {/* Challenge Reward Tests */}
            <div className="space-y-3 mb-4">
              <div className="text-blue-300/80 text-sm mb-2">Test Challenge Rewards:</div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Daily button clicked!');
                    console.log('Daily reward clicked', { address, rewardPending, isRewardMinter });
                    if (address) {
                      console.log('Calling rewardDaily with address:', address);
                      try {
                        rewardDaily(address as `0x${string}`);
                        console.log('rewardDaily called successfully');
                      } catch (error) {
                        console.error('Error calling rewardDaily:', error);
                      }
                    } else {
                      console.log('No address available');
                    }
                  }}
                  disabled={rewardPending}
                  className="flex-1 bg-green-500/20 border border-green-500/40 text-green-200 px-3 py-2 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {rewardPending ? 'Minting...' : 'Daily (100 NCT)'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Weekly reward clicked', { address, rewardPending, isRewardMinter });
                    if (address) {
                      console.log('Calling rewardWeekly with address:', address);
                      try {
                        rewardWeekly(address as `0x${string}`);
                      } catch (error) {
                        console.error('Error calling rewardWeekly:', error);
                      }
                    }
                  }}
                  disabled={rewardPending}
                  className="flex-1 bg-blue-500/20 border border-blue-500/40 text-blue-200 px-3 py-2 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {rewardPending ? 'Minting...' : 'Weekly (500 NCT)'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Monthly reward clicked', { address, rewardPending, isRewardMinter });
                    if (address) {
                      console.log('Calling rewardMonthly with address:', address);
                      try {
                        rewardMonthly(address as `0x${string}`);
                      } catch (error) {
                        console.error('Error calling rewardMonthly:', error);
                      }
                    }
                  }}
                  disabled={rewardPending}
                  className="flex-1 bg-purple-500/20 border border-purple-500/40 text-purple-200 px-3 py-2 rounded-lg text-sm disabled:opacity-50 cursor-pointer"
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {rewardPending ? 'Minting...' : 'Monthly (2500 NCT)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Beta Testing Notice */}
        <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/40 rounded-2xl p-5 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-orange-200 font-medium mb-2">Beta Testing Phase</h3>
              <p className="text-orange-300/80 text-sm leading-relaxed">
                Nocenix and Nocenite are currently <strong>Flow EVM testnet tokens</strong> with no monetary value. Earn
                NCT by interacting with the app - your percentage of total NCT determines your share of weekly NCX
                airdrops.
              </p>
            </div>
          </div>
        </div>

        {/* What is Nocenix */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
            <Gift className="w-5 h-5 mr-3 text-nocenaPink" />
            What is the Dual Token System?
          </h3>
          <p className="text-white/80 leading-relaxed">
            <strong>Nocenite (NCT)</strong> - Unlimited reward tokens earned through challenges.
            <br />
            <strong>Nocenix (NCX)</strong> - Capped value tokens (1B max) distributed weekly via airdrops based on your
            NCT holdings.
          </p>
        </div>

        {/* How You Earn */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <h3 className="text-white font-semibold mb-5 text-lg">How You Earn Tokens</h3>
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
                desc: 'Earn NCT tokens: Daily (100), Weekly (500), Monthly (2,500)',
              },
              {
                icon: <Heart className="w-5 h-5 text-nocenaPink" />,
                bgColor: 'bg-nocenaPink/20',
                title: 'Weekly Airdrops',
                desc: 'Receive NCX tokens proportional to your NCT holdings',
              },
              {
                icon: <Users className="w-5 h-5 text-green-400" />,
                bgColor: 'bg-green-500/20',
                title: 'Time-Based Rewards',
                desc: 'Earlier participation = higher airdrop percentages',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
                bgColor: 'bg-purple-500/20',
                title: 'Decentralized System',
                desc: 'Anyone can execute airdrops and earn 0.1% executor rewards',
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
                desc: 'NCX will become tradeable on select decentralized exchanges',
              },
              {
                color: 'bg-nocenaBlue',
                title: 'Monetary Value',
                desc: 'Your earned tokens will have real trading value',
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
