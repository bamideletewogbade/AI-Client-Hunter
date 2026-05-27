import { useRef, useEffect, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  radius: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
  targetX: number;
  targetY: number;
  hueShift: number; // for color cycling
}

interface Burst {
  x: number;
  y: number;
  phase: number;
  speed: number;
  color: string;
  label: string;
}

const NODE_DEFS = [
  { label: 'NGX', color: '#10B981' },
  { label: 'CRYPTO', color: '#FFA133' },
  { label: 'AI', color: '#818CF8' },
  { label: 'MACRO', color: '#38BDF8' },
  { label: 'COMM', color: '#EC4899' },
  { label: 'FX', color: '#F59E0B' },
  { label: 'OTC', color: '#8B5CF6' },
  { label: 'BTC', color: '#F7931A' },
];

const CONNECTION_DISTANCE = 200;
const NODE_RADIUS = 6;
const EDGE_OPACITY_MAX = 0.4;
const MOUSE_RADIUS = 140;

// Mobile detection — shallower radius, fewer particles
function isMobileDevice() {
  return typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
}

export default function IntelligenceMesh({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const dimsRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number>(0);
  const burstRef = useRef<Burst[]>([]);
  const timeRef = useRef(0);
  const scaleRef = useRef(1); // mobile scale factor

  const initNodes = useCallback((w: number, h: number) => {
    const isMobile = isMobileDevice();
    const scale = isMobile ? 0.6 : 1;
    scaleRef.current = scale;
    
    const nodes: Node[] = [];
    const particleCount = isMobile ? 12 : 35;
    
    NODE_DEFS.forEach((def, i) => {
      const angle = (i / NODE_DEFS.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(w, h) * 0.28;
      const cx = w / 2;
      const cy = h / 2;
      nodes.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        label: def.label,
        radius: NODE_RADIUS,
        color: def.color,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.006,
        targetX: cx + Math.cos(angle) * radius,
        targetY: cy + Math.sin(angle) * radius,
        hueShift: Math.random() * 30 - 15,
      });
    });

    // Floating particles between nodes
    for (let i = 0; i < particleCount; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        label: '',
        radius: 1.2 + Math.random() * 1.8,
        color: '#ffffff',
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        targetX: Math.random() * w,
        targetY: Math.random() * h,
        hueShift: Math.random() * 360,
      });
    }
    nodesRef.current = nodes;
  }, []);

  // Spawn a data burst animation from a random labeled node
  const spawnBurst = useCallback(() => {
    const nodes = nodesRef.current;
    const labeled = nodes.filter(n => n.label !== '');
    if (labeled.length === 0) return;
    
    const src = labeled[Math.floor(Math.random() * labeled.length)];
    const dst = labeled[Math.floor(Math.random() * labeled.length)];
    if (src === dst) return;
    
    burstRef.current.push({
      x: src.x,
      y: src.y,
      phase: 0,
      speed: 0.02 + Math.random() * 0.015,
      color: src.color,
      label: src.label,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      dimsRef.current = { w, h };
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) {
        initNodes(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Periodic burst spawner (every 2-4 seconds)
    let burstTimer = setInterval(spawnBurst, 2500 + Math.random() * 2000);

    // Listen on window so pointer-events: none on canvas doesn't block interaction
    const getCanvasPos = (clientX: number, clientY: number) => {
      const rect = canvas!.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleMouse = (e: MouseEvent) => {
      if (isMobileDevice()) return; // no mouse tracking on mobile
      const pos = getCanvasPos(e.clientX, e.clientY);
      const rect = canvas!.getBoundingClientRect();
      if (pos.x >= 0 && pos.x <= rect.width && pos.y >= 0 && pos.y <= rect.height) {
        mouseRef.current = { x: pos.x, y: pos.y, active: true };
      }
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
        const rect = canvas!.getBoundingClientRect();
        if (pos.x >= 0 && pos.x <= rect.width && pos.y >= 0 && pos.y <= rect.height) {
          mouseRef.current = { x: pos.x, y: pos.y, active: true };
        }
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, active: false };
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      if (!running) return;
      const { w, h } = dimsRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      timeRef.current += 0.01;
      ctx!.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulsePhase += n.pulseSpeed;

        if (n.label) {
          n.vx += (n.targetX - n.x) * 0.001;
          n.vy += (n.targetY - n.y) * 0.001;
          n.targetX += (Math.random() - 0.5) * 0.15;
          n.targetY += (Math.random() - 0.5) * 0.15;
          n.targetX = Math.max(w * 0.08, Math.min(w * 0.92, n.targetX));
          n.targetY = Math.max(h * 0.08, Math.min(h * 0.92, n.targetY));
        }

        // Mouse repulsion
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.6;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        n.vx *= 0.96;
        n.vy *= 0.96;
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      // Draw connections
      const allNodes = nodes;
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const a = allNodes[i];
          const b = allNodes[j];
          if (a.label === '' && b.label === '') continue;

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * EDGE_OPACITY_MAX;
            const pulse = Math.sin(a.pulsePhase + b.pulsePhase + timeRef.current) * 0.3 + 0.7;
            
            // Color cycling: slowly shift hue over time
            const baseColor = a.label ? a.color : b.color;
            // Create gradient rather than solid stroke
            const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y);
            const ca = a.label || 'unknown';
            const cb = b.label || 'unknown';
            grad.addColorStop(0, baseColor);
            grad.addColorStop(0.5, hexToRgba(baseColor, 0.6));
            grad.addColorStop(1, b.label ? b.color : a.color);
            
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = grad;
            ctx!.globalAlpha = opacity * pulse;
            ctx!.lineWidth = 0.5 + (1 - dist / CONNECTION_DISTANCE) * 1.5;
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
      }

      // Update & draw data bursts
      const bursts = burstRef.current;
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        burst.phase += burst.speed;
        
        // Find nearest labeled node to travel toward
        let target = nodes.find(n => n.label !== '' && n.label !== burst.label);
        if (target) {
          const tx = target.x;
          const ty = target.y;
          const t = Math.min(burst.phase, 1);
          const sx = burst.x;
          const sy = burst.y;
          const cx = sx + (tx - sx) * t;
          const cy = sy + (ty - sy) * t;
          
          // Draw burst particle
          const burstAlpha = 1 - t;
          const burstSize = 3 * (1 - t * 0.7);
          
          // Glow
          const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, burstSize * 4);
          g.addColorStop(0, burst.color + '80');
          g.addColorStop(1, burst.color + '00');
          ctx!.beginPath();
          ctx!.arc(cx, cy, burstSize * 4, 0, Math.PI * 2);
          ctx!.fillStyle = g;
          ctx!.fill();
          
          // Core
          ctx!.beginPath();
          ctx!.arc(cx, cy, burstSize, 0, Math.PI * 2);
          ctx!.fillStyle = burst.color;
          ctx!.globalAlpha = burstAlpha * 0.9;
          ctx!.fill();
          ctx!.globalAlpha = 1;
          
          // Trail
          if (t > 0.05) {
            ctx!.beginPath();
            ctx!.moveTo(sx, sy);
            ctx!.lineTo(cx, cy);
            ctx!.strokeStyle = burst.color;
            ctx!.globalAlpha = burstAlpha * 0.3;
            ctx!.lineWidth = 1.5;
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
        
        if (burst.phase >= 1) {
          bursts.splice(b, 1);
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = Math.sin(n.pulsePhase) * 0.2 + 0.8;

        if (n.label) {
          const glowRadius = n.radius * 2.5 * pulse;

          const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          grad.addColorStop(0, n.color + '40');
          grad.addColorStop(1, n.color + '00');
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();

          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2);
          ctx!.fillStyle = n.color;
          ctx!.fill();

          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius * 0.35, 0, Math.PI * 2);
          ctx!.fillStyle = '#ffffff';
          ctx!.fill();

          ctx!.fillStyle = '#a1a1aa';
          ctx!.font = 'bold 9px "JetBrains Mono", monospace';
          ctx!.textAlign = 'center';
          ctx!.textBaseline = 'top';
          ctx!.fillText(n.label, n.x, n.y + n.radius * pulse + 5);
        } else {
          const alpha = 0.3 + Math.sin(n.pulsePhase + timeRef.current * 2) * 0.2;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.radius * pulse, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx!.fill();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(burstTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initNodes, spawnBurst]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1, opacity: 0.7 }}
    />
  );
}

// Helper: parse hex color and return rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
