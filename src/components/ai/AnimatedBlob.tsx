// src/components/ai/AnimatedBlob.tsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// SimplexNoise implementation
class SimplexNoise {
  private grad3: number[][];
  private p: number[];
  private perm: number[];
  private gradP: number[][];

  constructor() {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    this.p = [151, 160, 137, 91, 90, 15,
      131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
      190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
      88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
      77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
      102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
      135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
      5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
      223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
      129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
      251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
      49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
      138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

    this.perm = new Array(512);
    this.gradP = new Array(512);
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 12];
    }
  }

  private dot(g: number[], x: number, y: number, z: number): number {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin: number, yin: number, zin: number): number {
    let n0, n1, n2, n3;
    const F3 = 1 / 3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1 / 6;
    const t = (i + j + k) * G3;
    const x0 = xin - i + t;
    const y0 = yin - j + t;
    const z0 = zin - k + t;
    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.gradP[ii + this.perm[jj + this.perm[kk]]], x0, y0, z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.gradP[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]], x1, y1, z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.gradP[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]], x2, y2, z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(this.gradP[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]], x3, y3, z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  }
}

interface AnimatedBlobProps {
  size?: number;
  mode: 'speaking' | 'listening' | 'inactive';
}

const AnimatedBlob: React.FC<AnimatedBlobProps> = ({ size = 400, mode }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(20);
  const [spikes, setSpikes] = useState(0.6);
  const [processing, setProcessing] = useState(1.0);

  // Smooth transitions between states
  useEffect(() => {
    const targetValues = mode === 'speaking' 
    ? { speed: 61, spikes: 1.1, processing: 1.21 }
    : mode === 'listening'
    ? { speed: 20, spikes: 0.6, processing: 1.0 }
    : { speed: 12, spikes: 0.3, processing: 0.7 }; // inactive (default)

    const animateValue = (current: number, target: number, setter: (value: number) => void, duration: number = 1000) => {
      const startTime = performance.now();
      const startValue = current;
      const difference = target - startValue;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const newValue = startValue + (difference * easeInOutCubic);
        setter(newValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    };

    animateValue(speed, targetValues.speed, setSpeed, 800);
    animateValue(spikes, targetValues.spikes, setSpikes, 800);
    animateValue(processing, targetValues.processing, setProcessing, 800);
  }, [mode, speed, spikes, processing]);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    sphere: THREE.Mesh;
    geometry: THREE.SphereGeometry;
    material: THREE.MeshPhongMaterial;
    simplex: SimplexNoise;
    time: number;
    animationId: number | null;
    originalVertices: THREE.Vector3[];
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;
  
    const container = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, size / size, 0.1, 1000);
    camera.position.z = 5;
  
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);
  
    // Sphere geometry - using 128x128 like in the original
    const geometry = new THREE.SphereGeometry(0.8, 128, 128);
    
    // Store original vertices for noise calculation
    const originalVertices: THREE.Vector3[] = [];
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      originalVertices.push(new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      ));
    }
  
    // Nocena colors
    const nocenaBlue = 0x4F9EFF;
    const nocenaPurple = 0xA855F7;
    const nocenaPink = 0xFF3D9A;
  
    // HOLOGRAPHIC MATERIAL
    const material = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF, // White base for iridescence
      shininess: 300,
      transparent: true,
      opacity: 0.9,
      emissive: nocenaBlue,
      emissiveIntensity: 0.2,
      specular: nocenaPink,
      reflectivity: 1.0,
    });
  
    // HOLOGRAPHIC LIGHTING
    const rimLight1 = new THREE.DirectionalLight(nocenaPink, 0.8);
    rimLight1.position.set(2, 2, 2);
    scene.add(rimLight1);
    
    const rimLight2 = new THREE.DirectionalLight(nocenaBlue, 0.6);
    rimLight2.position.set(-2, -1, 2);
    scene.add(rimLight2);
    
    const rimLight3 = new THREE.DirectionalLight(nocenaPurple, 0.4);
    rimLight3.position.set(0, -2, 1);
    scene.add(rimLight3);
    
    const ambientLight = new THREE.AmbientLight(0x6666FF, 0.3);
    scene.add(ambientLight);
  
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  
    const simplex = new SimplexNoise();
  
    sceneRef.current = {
      scene,
      camera,
      renderer,
      sphere,
      geometry,
      material,
      simplex,
      time: 0,
      animationId: null,
      originalVertices
    };
  
    return () => {
      if (sceneRef.current) {
        if (sceneRef.current.animationId) {
          cancelAnimationFrame(sceneRef.current.animationId);
        }
        container.removeChild(renderer.domElement);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, [size]);

  useEffect(() => {
    if (!sceneRef.current) return;

    let lastTimestamp = performance.now();

    const update = (timestamp: number) => {
      if (!sceneRef.current) return;

      const timeDiff = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      sceneRef.current.time += timeDiff * 0.00005 * speed;

      const spikeIntensity = spikes * processing;
      const positions = sceneRef.current.geometry.attributes.position;
      
      // Update vertices using noise - exactly like CodePen
      for (let i = 0; i < sceneRef.current.originalVertices.length; i++) {
        const originalVertex = sceneRef.current.originalVertices[i].clone();
        originalVertex.normalize();
        
        const noiseValue = sceneRef.current.simplex.noise3D(
          originalVertex.x * spikeIntensity,
          originalVertex.y * spikeIntensity,
          originalVertex.z * spikeIntensity + sceneRef.current.time
        );
        
        originalVertex.multiplyScalar(1 + 0.3 * noiseValue);
        positions.setXYZ(i, originalVertex.x, originalVertex.y, originalVertex.z);
      }
      
      sceneRef.current.geometry.computeVertexNormals();
      positions.needsUpdate = true;
    };

    const animate = (timestamp: number) => {
      if (!sceneRef.current) return;
      
      update(timestamp);
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    if (sceneRef.current.animationId) {
      cancelAnimationFrame(sceneRef.current.animationId);
    }
    sceneRef.current.animationId = requestAnimationFrame(animate);

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
        sceneRef.current.animationId = null;
      }
    };
  }, [speed, spikes, processing]);

  return (
    <div 
      ref={mountRef}
      className="relative flex items-center justify-center mx-auto"
      style={{ width: size, height: size }}
    />
  );
};

export default AnimatedBlob;