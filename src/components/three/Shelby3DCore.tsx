import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AssistantState } from '../../types';
import {
  createSunPlasmaTexture,
  createGlowSpriteTexture,
  createSparkleTexture,
} from './proceduralTextures';

interface Shelby3DCoreProps {
  state: AssistantState;
  audioLevel?: number; // 0 to 1 for live microphone / speech reactivity
  reducedMotion?: boolean;
  compactMode?: boolean;
  onCoreClick?: () => void;
}

// Module-level reusable math helpers to prevent GC in render loop
const _vec3 = new THREE.Vector3();
const _color = new THREE.Color();

export const Shelby3DCore: React.FC<Shelby3DCoreProps> = ({
  state,
  audioLevel = 0,
  reducedMotion = false,
  compactMode = false,
  onCoreClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  const stateRef = useRef<AssistantState>(state);
  const audioLevelRef = useRef<number>(audioLevel);
  const reducedMotionRef = useRef<boolean>(reducedMotion);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050608, 0.04);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, compactMode ? 6.2 : 5.4);

    // 2. Renderer with safe WebGL fallback
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL context unavailable, falling back to cybernetic SVG core:', err);
      setWebglError(true);
      return;
    }

    // 3. Studio Environment Map (PMREM)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (pmremErr) {
      console.warn('PMREM generator notice:', pmremErr);
    }

    // 4. Lighting Rig (Warm golden Key + Cool fill + Pedestal up-spot)
    const ambientLight = new THREE.AmbientLight(0x221105, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xffa500, 4.5, 20);
    keyLight.position.set(0, 0.5, 0); // inside the core
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    rimLight.position.set(0, 5, 4);
    scene.add(rimLight);

    // Master Group
    const coreRoot = new THREE.Group();
    coreRoot.position.set(0, 0.25, 0);
    scene.add(coreRoot);

    // --- Part A: Inner Fiery Plasma Sphere ---
    const sunTexture = createSunPlasmaTexture();
    const plasmaGeo = new THREE.SphereGeometry(1.0, 48, 48);
    const plasmaMat = new THREE.MeshStandardMaterial({
      map: sunTexture,
      emissive: new THREE.Color(0xff7700),
      emissiveMap: sunTexture,
      emissiveIntensity: 1.8,
      roughness: 0.35,
      metalness: 0.2,
    });
    const plasmaSphere = new THREE.Mesh(plasmaGeo, plasmaMat);
    coreRoot.add(plasmaSphere);

    // Outer Coronal Flame Shell (Parallax Layer)
    const coronaGeo = new THREE.SphereGeometry(1.035, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xffaa33,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const coronaSphere = new THREE.Mesh(coronaGeo, coronaMat);
    coreRoot.add(coronaSphere);

    // Radial Core Glow Sprite
    const glowTex = createGlowSpriteTexture();
    const glowSpriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xff8811,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowSpriteMat);
    glowSprite.scale.set(3.8, 3.8, 1);
    coreRoot.add(glowSprite);

    // --- Part B: Nested Golden Orbital Rings & Satellite Nodes ---
    interface RingData {
      group: THREE.Group;
      mesh: THREE.Mesh;
      beads: THREE.Mesh[];
      speedX: number;
      speedY: number;
      speedZ: number;
      radius: number;
    }
    const orbitalRings: RingData[] = [];

    const goldRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0x854d0e,
      emissiveIntensity: 0.3,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });

    const beadMat = new THREE.MeshPhysicalMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      metalness: 0.9,
      roughness: 0.1,
    });

    const ringConfigs = [
      { radius: 1.45, tube: 0.014, tiltX: 0.25, tiltZ: 0.1, speedY: 0.35, beads: 2 },
      { radius: 1.7, tube: 0.012, tiltX: -0.4, tiltZ: 0.35, speedY: -0.28, beads: 3 },
      { radius: 1.95, tube: 0.016, tiltX: 0.7, tiltZ: -0.25, speedY: 0.22, beads: 2 },
      { radius: 2.2, tube: 0.01, tiltX: -0.85, tiltZ: -0.45, speedY: -0.18, beads: 3 },
      { radius: 1.35, tube: 0.018, tiltX: 1.57, tiltZ: 0, speedY: 0.45, beads: 1 }, // vertical polar
    ];

    ringConfigs.forEach((cfg) => {
      const ringGroup = new THREE.Group();
      ringGroup.rotation.set(cfg.tiltX, 0, cfg.tiltZ);

      const torusGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100);
      const ringMesh = new THREE.Mesh(torusGeo, goldRingMat);
      ringGroup.add(ringMesh);

      // Satellite Beads
      const beads: THREE.Mesh[] = [];
      for (let b = 0; b < cfg.beads; b++) {
        const beadGeo = new THREE.SphereGeometry(0.045 + Math.random() * 0.03, 16, 16);
        const bead = new THREE.Mesh(beadGeo, beadMat);
        ringGroup.add(bead);
        beads.push(bead);
      }

      coreRoot.add(ringGroup);
      orbitalRings.push({
        group: ringGroup,
        mesh: ringMesh,
        beads,
        speedX: cfg.tiltX * 0.05,
        speedY: cfg.speedY,
        speedZ: cfg.tiltZ * 0.05,
        radius: cfg.radius,
      });
    });

    // Outer Graduated Reticle Ring (Segmented & Dotted)
    const reticleGroup = new THREE.Group();
    reticleGroup.rotation.x = Math.PI / 2;
    const reticleGeo = new THREE.RingGeometry(2.35, 2.38, 72);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const reticleRing = new THREE.Mesh(reticleGeo, reticleMat);
    reticleGroup.add(reticleRing);
    coreRoot.add(reticleGroup);

    // --- Part C: Laser Reticle & Crosshairs ---
    // Fine vertical laser line extending through top and bottom
    const laserLineMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const vLinePoints = [new THREE.Vector3(0, -2.4, 0), new THREE.Vector3(0, 2.4, 0)];
    const vLineGeo = new THREE.BufferGeometry().setFromPoints(vLinePoints);
    const verticalLaser = new THREE.Line(vLineGeo, laserLineMat);
    coreRoot.add(verticalLaser);

    // Horizontal crosshair line
    const hLinePoints = [new THREE.Vector3(-2.4, 0, 0), new THREE.Vector3(2.4, 0, 0)];
    const hLineGeo = new THREE.BufferGeometry().setFromPoints(hLinePoints);
    const horizontalLaser = new THREE.Line(hLineGeo, laserLineMat);
    coreRoot.add(horizontalLaser);

    // Reticle tick markers along vertical laser
    const tickPoints: THREE.Vector3[] = [];
    [-1.8, -1.2, -0.6, 0.6, 1.2, 1.8].forEach((y) => {
      tickPoints.push(new THREE.Vector3(-0.08, y, 0), new THREE.Vector3(0.08, y, 0));
    });
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPoints);
    const tickLines = new THREE.LineSegments(tickGeo, laserLineMat);
    coreRoot.add(tickLines);

    // --- Part D: Grounded Machined Pedestal Base ---
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.8, 0);
    scene.add(pedestalGroup);

    // Multi-tier dark metallic base cylinders
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x111317,
      metalness: 0.92,
      roughness: 0.25,
      clearcoat: 0.5,
    });

    const trenchGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    // Tier 1 (Bottom wide ring)
    const tier1Geo = new THREE.CylinderGeometry(2.1, 2.2, 0.12, 48);
    const tier1 = new THREE.Mesh(tier1Geo, baseMat);
    tier1.position.y = -0.06;
    pedestalGroup.add(tier1);

    // Glow Ring 1
    const glowRing1Geo = new THREE.TorusGeometry(2.15, 0.016, 12, 64);
    glowRing1Geo.rotateX(Math.PI / 2);
    const glowRing1 = new THREE.Mesh(glowRing1Geo, trenchGlowMat);
    glowRing1.position.y = -0.01;
    pedestalGroup.add(glowRing1);

    // Tier 2 (Middle stepped disc)
    const tier2Geo = new THREE.CylinderGeometry(1.7, 1.85, 0.14, 48);
    const tier2 = new THREE.Mesh(tier2Geo, baseMat);
    tier2.position.y = 0.06;
    pedestalGroup.add(tier2);

    // Glow Ring 2
    const glowRing2Geo = new THREE.TorusGeometry(1.68, 0.02, 12, 64);
    glowRing2Geo.rotateX(Math.PI / 2);
    const glowRing2 = new THREE.Mesh(glowRing2Geo, trenchGlowMat);
    glowRing2.position.y = 0.13;
    pedestalGroup.add(glowRing2);

    // Tier 3 (Center emitter mount)
    const tier3Geo = new THREE.CylinderGeometry(1.1, 1.3, 0.15, 36);
    const tier3 = new THREE.Mesh(tier3Geo, baseMat);
    tier3.position.y = 0.2;
    pedestalGroup.add(tier3);

    // Upward Golden Projection Laser Cone
    const coneGeo = new THREE.ConeGeometry(1.0, 1.4, 32, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.set(0, 0.9, 0);
    pedestalGroup.add(lightCone);

    // Radial Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0x000000,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.14;
    pedestalGroup.add(shadowPlane);

    // --- Part E: Ambient Ember Particles ---
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      particleVelocities.push((Math.random() - 0.5) * 0.005);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const sparkTex = createSparkleTexture();
    const particleMat = new THREE.PointsMaterial({
      map: sparkTex,
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Part F: Audio Reactive Acoustic Shockwave Rings (for Speaking / Listening) ---
    const pulseRingGeo = new THREE.RingGeometry(1.1, 1.15, 64);
    pulseRingGeo.rotateX(Math.PI / 2);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
    coreRoot.add(pulseRing);

    // 5. Mouse Parallax & Gentle Inspection
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        targetRotY += deltaX * 0.008;
        targetRotX = Math.max(-0.4, Math.min(0.4, targetRotX + deltaY * 0.005));
      } else {
        const rect = container.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotY = nx * 0.4;
        targetRotX = ny * 0.2;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let pulseScale = 1.0;
    let pulseOpacity = 0.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const currentState = stateRef.current;
      const currentAudio = audioLevelRef.current;
      const isReduced = reducedMotionRef.current;

      // State-specific behavior parameters
      let speedMult = 1.0;
      let targetEmissive = 0xff7700;
      let targetCoronaColor = 0xffaa33;
      let coreScaleTarget = 1.0;
      let flareFlicker = 0.0;

      switch (currentState) {
        case 'standby':
          speedMult = 0.7;
          targetEmissive = 0xff7700;
          targetCoronaColor = 0xffaa33;
          coreScaleTarget = 1.0 + Math.sin(elapsedTime * 1.5) * 0.02;
          break;
        case 'listening':
          speedMult = 1.8;
          targetEmissive = 0xff9900;
          targetCoronaColor = 0xffdd44;
          coreScaleTarget = 1.04 + currentAudio * 0.15;
          flareFlicker = Math.sin(elapsedTime * 12) * 0.2;
          break;
        case 'thinking':
          speedMult = 2.8;
          targetEmissive = 0xffaa11;
          targetCoronaColor = 0xffeedd;
          coreScaleTarget = 0.98 + Math.sin(elapsedTime * 6) * 0.05;
          flareFlicker = Math.sin(elapsedTime * 20) * 0.35;
          break;
        case 'speaking':
          speedMult = 1.4;
          targetEmissive = 0xff8800;
          targetCoronaColor = 0xffbb33;
          coreScaleTarget = 1.02 + currentAudio * 0.18;
          // Trigger acoustic shockwave expansion
          pulseScale += delta * 2.2;
          pulseOpacity = Math.max(0, 0.75 - (pulseScale - 1.0) / 1.8);
          if (pulseScale > 2.8) {
            pulseScale = 1.0;
            pulseOpacity = 0.75;
          }
          break;
        case 'executing':
          speedMult = 2.2;
          targetEmissive = 0xffb703;
          targetCoronaColor = 0xffd166;
          coreScaleTarget = 1.06 + Math.sin(elapsedTime * 8) * 0.03;
          break;
        case 'error':
          speedMult = 1.6;
          targetEmissive = 0xd90429;
          targetCoronaColor = 0xef233c;
          coreScaleTarget = 1.0 + (Math.sin(elapsedTime * 15) > 0 ? 0.06 : -0.03);
          flareFlicker = Math.sin(elapsedTime * 30) * 0.5;
          break;
      }

      if (isReduced) {
        speedMult *= 0.35;
      }

      // Smooth state transitions via damping
      plasmaSphere.scale.lerp(_vec3.set(coreScaleTarget, coreScaleTarget, coreScaleTarget), 0.1);
      coronaSphere.scale.lerp(
        _vec3.set(coreScaleTarget * 1.035, coreScaleTarget * 1.035, coreScaleTarget * 1.035),
        0.1
      );

      _color.setHex(targetEmissive);
      plasmaMat.emissive.lerp(_color, 0.08);
      plasmaMat.emissiveIntensity = 1.8 + flareFlicker;

      _color.setHex(targetCoronaColor);
      coronaMat.color.lerp(_color, 0.08);

      // Core rotation (fiery parallax)
      plasmaSphere.rotation.y += delta * 0.35 * speedMult;
      coronaSphere.rotation.y -= delta * 0.25 * speedMult;
      coronaSphere.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;

      // Reticle rotation & crosshair sync
      reticleGroup.rotation.z += delta * 0.08 * speedMult;

      // Nested orbital rings & beads animation
      orbitalRings.forEach((ring, idx) => {
        ring.group.rotation.y += delta * ring.speedY * speedMult;
        ring.group.rotation.x += delta * ring.speedX * speedMult;

        // Animate beads along the perimeter
        ring.beads.forEach((bead, bIdx) => {
          const angle =
            elapsedTime * ring.speedY * 1.5 * speedMult + (bIdx * Math.PI * 2) / ring.beads.length;
          bead.position.x = Math.cos(angle) * ring.radius;
          bead.position.y = Math.sin(angle) * ring.radius;
          bead.position.z = 0;
        });
      });

      // Pulse ring expansion
      if (currentState === 'speaking') {
        pulseRing.scale.set(pulseScale, pulseScale, pulseScale);
        pulseRingMat.opacity = pulseOpacity;
      } else {
        pulseRingMat.opacity = 0;
      }

      // Ambient particles slow drift
      const posAttr = particleGeo.attributes.position;
      const positions = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleVelocities[i] * speedMult;
        if (positions[i * 3 + 1] > 3) positions[i * 3 + 1] = -3;
        if (positions[i * 3 + 1] < -3) positions[i * 3 + 1] = 3;
      }
      posAttr.needsUpdate = true;

      // Pedestal cone pulsing
      coneMat.opacity = 0.22 + Math.sin(elapsedTime * 2) * 0.08 + currentAudio * 0.15;

      // Smooth camera / root parallax
      coreRoot.rotation.y = THREE.MathUtils.damp(coreRoot.rotation.y, targetRotY, 4.0, delta);
      coreRoot.rotation.x = THREE.MathUtils.damp(coreRoot.rotation.x, targetRotX, 4.0, delta);

      renderer.render(scene, camera);
    };

    // Pre-warm shaders
    renderer.compile(scene, camera);
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Clean disposal
      renderer.dispose();
      sunTexture.dispose();
      glowTex.dispose();
      sparkTex.dispose();
      plasmaGeo.dispose();
      plasmaMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      glowSpriteMat.dispose();
      goldRingMat.dispose();
      beadMat.dispose();
      laserLineMat.dispose();
      baseMat.dispose();
      trenchGlowMat.dispose();
      coneMat.dispose();
      shadowMat.dispose();
      particleMat.dispose();
      particleGeo.dispose();
      pulseRingMat.dispose();
      pulseRingGeo.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [compactMode]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onClick={onCoreClick}
    >
      {/* Three.js Isolated Canvas Mount or Procedural Fallback */}
      {webglError ? (
        <div className="relative w-72 h-72 rounded-full flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="absolute inset-6 rounded-full border border-amber-400/30 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }} />
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-300 shadow-[0_0_60px_#f59e0b] animate-pulse" />
        </div>
      ) : (
        <div ref={mountRef} className="w-full h-full" />
      )}

      {/* Cybernetic HUD Reticle Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Subtle crosshair brackets */}
        <div className="relative w-72 h-72 border border-amber-500/15 rounded-full pointer-events-none">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-400/60" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-400/60" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 h-4 w-[2px] bg-amber-400/60" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-4 w-[2px] bg-amber-400/60" />
        </div>

        {/* State Tag Overlay at bottom center of core */}
        <div className="absolute bottom-6 flex items-center space-x-2 px-3 py-1 bg-black/70 border border-amber-500/30 rounded-md font-mono-code text-[11px] tracking-wider uppercase text-amber-300 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'error'
                ? 'bg-rose-500'
                : state === 'listening'
                  ? 'bg-amber-400 ring-2 ring-amber-400/40'
                  : state === 'thinking'
                    ? 'bg-yellow-300'
                    : state === 'speaking'
                      ? 'bg-amber-500 ring-2 ring-amber-500/50'
                      : state === 'executing'
                        ? 'bg-emerald-400'
                        : 'bg-amber-500/70'
            }`}
          />
          <span>CORE // {state}</span>
        </div>
      </div>
    </div>
  );
};
