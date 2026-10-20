import React, { useEffect, useRef } from 'react';

export type HoloAssistantState = 'IDLE' | 'LISTENING' | 'THINKING' | 'PROCESSING' | 'SPEAKING' | 'SLEEPING';

export interface HoloAvatarProps {
  /** Primary neon wireframe color (default: #f59e0b) */
  primaryColor?: string;
  /** Secondary accent color for eyes and glow (default: #ffaa00) */
  accentColor?: string;
  /** Background color (default: transparent) */
  backgroundColor?: string;
  /** Current state of the avatar */
  state?: HoloAssistantState | string;
  /** Whether the avatar is currently speaking */
  isSpeaking?: boolean;
  /** Whether microphone/audio is muted */
  isMuted?: boolean;
  /** Microphone or audio volume level (0.0 to 1.0) for dynamic mouth movement */
  audioLevel?: number;
  /** Optional custom CSS class name */
  className?: string;
  /** Optional click handler (e.g. click to speak / activate) */
  onClick?: () => void;
}

export const HoloAvatar: React.FC<HoloAvatarProps> = ({
  primaryColor = '#f59e0b',
  accentColor = '#fef08a',
  backgroundColor = 'transparent',
  state = 'IDLE',
  isSpeaking = false,
  isMuted = false,
  audioLevel = 0,
  className = 'w-full h-full min-h-[400px]',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(0);

  // Normalize state from uppercase or lowercase
  const normalizedState = (typeof state === 'string' ? state.toUpperCase() : 'IDLE');
  const effectiveState: HoloAssistantState = 
    normalizedState === 'STANDBY' ? 'IDLE' :
    normalizedState === 'SPEAKING' ? 'SPEAKING' :
    normalizedState === 'LISTENING' ? 'LISTENING' :
    normalizedState === 'THINKING' ? 'THINKING' :
    normalizedState === 'EXECUTING' || normalizedState === 'PROCESSING' ? 'PROCESSING' :
    normalizedState === 'SLEEPING' ? 'SLEEPING' : 'IDLE';

  // Blinking cycle controller
  const blinkStateRef = useRef<{ isBlinking: boolean; blinkProgress: number; nextBlink: number }>({
    isBlinking: false,
    blinkProgress: 0,
    nextBlink: 2.5,
  });

  // Eye gaze saccades & tracking
  const gazeRef = useRef<{ x: number; y: number; targetX: number; targetY: number; nextShift: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    nextShift: 3.0,
  });

  // Audio amplitude smoothing
  const ampRef = useRef<number>(0);

  useEffect(() => {
    let lastTime = performance.now();
    let animId = 0;

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      // Smooth audio responsiveness
      ampRef.current += (audioLevel - ampRef.current) * 0.45;
      const amp = ampRef.current;

      // 1. Natural eye blinking
      const b = blinkStateRef.current;
      if (!b.isBlinking && t > b.nextBlink) {
        b.isBlinking = true;
        b.blinkProgress = 0;
        b.nextBlink = t + Math.random() * 4 + 2;
      }
      if (b.isBlinking) {
        b.blinkProgress += dt * 7;
        if (b.blinkProgress >= 1) {
          b.isBlinking = false;
          b.blinkProgress = 0;
        }
      }

      // 2. Eye saccades & idle look-around
      const g = gazeRef.current;
      if (effectiveState === 'THINKING' || effectiveState === 'PROCESSING') {
        g.targetX = 0.35 * Math.sin(t * 1.5);
        g.targetY = -0.4; // Look up thoughtfully
      } else if (effectiveState === 'SLEEPING') {
        g.targetX = 0;
        g.targetY = 0.5; // Eyes down
      } else if (t > g.nextShift) {
        g.targetX = (Math.random() - 0.5) * 0.4;
        g.targetY = (Math.random() - 0.5) * 0.3;
        g.nextShift = t + Math.random() * 3 + 1.5;
      }
      g.x += (g.targetX - g.x) * (dt * 6);
      g.y += (g.targetY - g.y) * (dt * 6);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle Retina / HiDPI screens
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 400;
      const height = canvas.clientHeight || 400;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background fill
      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // Cyber Matrix Dot Grid
      ctx.fillStyle = primaryColor + '15';
      for (let x = 24; x < width; x += 48) {
        for (let y = 24; y < height; y += 48) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const cx = width / 2;
      const cy = height * 0.44;
      const scale = Math.min(width, height) * 0.4;

      // Dynamic color switching by state
      let pri = primaryColor;
      let acc = accentColor;
      if (isMuted) {
        pri = '#ff3366';
        acc = '#ff3366';
      } else if (effectiveState === 'THINKING' || effectiveState === 'PROCESSING') {
        acc = '#ffcc00';
      } else if (effectiveState === 'LISTENING') {
        acc = '#00ff88';
      }

      // Head sway / breathing motion
      const swayX = Math.sin(t * 0.7) * 4;
      const swayY = Math.sin(t * 1.4) * 3 + (isSpeaking ? amp * 4 : 0);
      const headX = cx + swayX;
      const headY = cy + swayY;

      // Hologram glow field behind the avatar
      const headGlow = ctx.createRadialGradient(headX, headY, scale * 0.1, headX, headY, scale * 0.9);
      headGlow.addColorStop(0, (isSpeaking ? acc : pri) + '33');
      headGlow.addColorStop(0.6, pri + '11');
      headGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(headX, headY, scale * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Scanline overlay
      ctx.save();
      ctx.strokeStyle = pri;
      ctx.globalAlpha = 0.04;
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3D Perspective Projection
      const yaw = swayX * 0.03 + g.x * 0.2;
      const pitch = swayY * 0.03 + g.y * 0.2 + (effectiveState === 'SLEEPING' ? 0.3 : 0);

      const project = (x3: number, y3: number, z3: number): [number, number] => {
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const x_ = x3 * cosY - z3 * sinY;
        const z_ = x3 * sinY + z3 * cosY;

        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const y_ = y3 * cosP - z_ * sinP;
        const depth = 2.4 / (2.4 + (y3 * sinP + z_ * cosP));

        return [headX + x_ * scale * depth, headY + y_ * scale * depth];
      };

      // 1. Neck and Collar vectors
      ctx.strokeStyle = pri;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.25;
      const neckNodes = [
        [-0.2, 0.65, 0.0],
        [-0.25, 0.95, 0.1],
        [0.2, 0.65, 0.0],
        [0.25, 0.95, 0.1],
        [0.0, 0.7, 0.15],
        [0.0, 1.0, 0.25],
      ];
      for (let i = 0; i < neckNodes.length; i += 2) {
        const [nx1, ny1] = project(neckNodes[i][0], neckNodes[i][1], neckNodes[i][2]);
        const [nx2, ny2] = project(neckNodes[i + 1][0], neckNodes[i + 1][1], neckNodes[i + 1][2]);
        ctx.beginPath();
        ctx.moveTo(nx1, ny1);
        ctx.lineTo(nx2, ny2);
        ctx.stroke();
      }

      // 2. Cranium / Outer Head Wireframe Contour
      const headPoints3D: [number, number, number][] = [
        [0.0, -0.75, 0.0],    // Top
        [0.28, -0.68, 0.1],
        [0.46, -0.42, 0.15],  // Temple
        [0.52, -0.1, 0.15],   // Ear top
        [0.48, 0.2, 0.12],    // Jaw corner
        [0.32, 0.48, 0.1],
        [0.15, 0.66, 0.08],   // Chin side
        [0.0, 0.72, 0.05],    // Chin center
        [-0.15, 0.66, 0.08],
        [-0.32, 0.48, 0.1],
        [-0.48, 0.2, 0.12],
        [-0.52, -0.1, 0.15],
        [-0.46, -0.42, 0.15],
        [-0.28, -0.68, 0.1],
      ];

      ctx.strokeStyle = pri;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      headPoints3D.forEach(([hx, hy, hz], i) => {
        const [px, py] = project(hx, hy, hz);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();

      // 3. Facial Wireframe Arcs (Forehead, Brow, Cheekbones)
      const rings: [number, number, number][][] = [
        [
          [-0.35, -0.45, 0.18],
          [-0.18, -0.5, 0.24],
          [0.0, -0.52, 0.26],
          [0.18, -0.5, 0.24],
          [0.35, -0.45, 0.18],
        ],
        [
          [-0.36, -0.22, 0.22],
          [-0.16, -0.25, 0.28],
          [0.0, -0.22, 0.26],
          [0.16, -0.25, 0.28],
          [0.36, -0.22, 0.22],
        ],
        [
          [-0.42, 0.02, 0.18],
          [-0.25, 0.05, 0.26],
          [0.0, 0.1, 0.25],
          [0.25, 0.05, 0.26],
          [0.42, 0.02, 0.18],
        ],
      ];

      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.0;
      rings.forEach((ring) => {
        ctx.beginPath();
        ring.forEach(([rx, ry, rz], idx) => {
          const [px, py] = project(rx, ry, rz);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });

      // 4. Nose Bridge & Tip
      ctx.strokeStyle = pri;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.4;
      const nosePoints: [number, number, number][] = [
        [0.0, -0.22, 0.26],
        [0.0, 0.02, 0.36],
        [-0.07, 0.15, 0.31],
        [0.0, 0.16, 0.34],
        [0.07, 0.15, 0.31],
        [0.0, 0.02, 0.36],
      ];
      ctx.beginPath();
      nosePoints.forEach(([nx, ny, nz], idx) => {
        const [px, py] = project(nx, ny, nz);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // 5. Eyes with Blinking & Hologram Iris
      const eyeL = [-0.19, -0.12, 0.25] as [number, number, number];
      const eyeR = [0.19, -0.12, 0.25] as [number, number, number];
      const blinkFactor =
        effectiveState === 'SLEEPING'
          ? 0.08
          : b.isBlinking
          ? Math.max(0.08, 1 - Math.sin(b.blinkProgress * Math.PI))
          : 1;

      [eyeL, eyeR].forEach(([ex, ey, ez]) => {
        const [epx, epy] = project(ex, ey, ez);
        const eyeW = scale * 0.075;
        const eyeH = scale * 0.045 * blinkFactor;

        // Eye socket contour
        ctx.strokeStyle = pri;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(epx, epy, eyeW, Math.max(1, eyeH), 0, 0, Math.PI * 2);
        ctx.stroke();

        // Eye Pupil
        if (blinkFactor > 0.3) {
          const pupilX = epx + g.x * (eyeW * 0.4);
          const pupilY = epy + g.y * (eyeH * 0.4);

          ctx.fillStyle = acc;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(pupilX, pupilY, Math.max(1.5, eyeW * 0.28), 0, Math.PI * 2);
          ctx.fill();

          // Catchlight reflection
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(pupilX - 1.5, pupilY - 1.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Dynamic Mouth (Audio/Speech Lip-Sync)
      const jawDrop = isSpeaking ? amp * 0.14 : 0.02;
      const mouthWidth = 0.14 + (isSpeaking ? amp * 0.05 : 0);

      const mouthUpper: [number, number, number][] = [
        [-mouthWidth, 0.34, 0.22],
        [-0.05, 0.32, 0.27],
        [0.0, 0.33, 0.28],
        [0.05, 0.32, 0.27],
        [mouthWidth, 0.34, 0.22],
      ];

      const mouthLower: [number, number, number][] = [
        [-mouthWidth, 0.34, 0.22],
        [-0.06, 0.37 + jawDrop, 0.26],
        [0.0, 0.38 + jawDrop, 0.27],
        [0.06, 0.37 + jawDrop, 0.26],
        [mouthWidth, 0.34, 0.22],
      ];

      ctx.strokeStyle = isSpeaking ? acc : pri;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      mouthUpper.forEach(([mx, my, mz], idx) => {
        const [px, py] = project(mx, my, mz);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      mouthLower.forEach(([mx, my, mz]) => {
        const [px, py] = project(mx, my, mz);
        ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();

      // 7. Hologram Node Vertex Anchor Points
      ctx.fillStyle = acc;
      ctx.globalAlpha = 0.7;
      [
        [0, -0.75, 0],
        [-0.19, -0.12, 0.25],
        [0.19, -0.12, 0.25],
        [0.0, 0.16, 0.34],
        [0.0, 0.72, 0.05],
      ].forEach(([vx, vy, vz]) => {
        const [px, py] = project(vx, vy, vz);
        ctx.beginPath();
        ctx.arc(px, py, 2.0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [primaryColor, accentColor, backgroundColor, effectiveState, isSpeaking, isMuted, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onClick={onClick}
      style={{ background: backgroundColor }}
    />
  );
};
