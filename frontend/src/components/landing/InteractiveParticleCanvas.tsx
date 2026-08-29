import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface InteractiveParticleCanvasProps {
  className?: string;
  dotSpacing?: number;
  repelRadius?: number;
  repelStrength?: number;
  maxDotSize?: number;
}

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  activeAlpha: number;
}

export function InteractiveParticleCanvas({
  className = "",
  dotSpacing = 28,
  repelRadius = 160,
  repelStrength = 14,
  maxDotSize = 2.4,
}: InteractiveParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      isHovered: false,
    };

    // Calculate dimensions & create grid of particles
    const initParticles = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      particles = [];
      const cols = Math.floor(width / dotSpacing);
      const rows = Math.floor(height / dotSpacing);
      const offsetX = (width - cols * dotSpacing) / 2;
      const offsetY = (height - rows * dotSpacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const originX = offsetX + i * dotSpacing;
          const originY = offsetY + j * dotSpacing;

          particles.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            size: 1.4 + Math.random() * (maxDotSize - 1.4),
            baseAlpha: 0.22 + Math.random() * 0.18,
            activeAlpha: 0.22,
          });
        }
      }
    };

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = resolvedTheme !== "light";
      const baseColor = isDark ? "148, 163, 184" : "99, 102, 241"; // Slate or Indigo
      const glowColor = isDark ? "56, 189, 248" : "37, 99, 235"; // Cyan / Royal Blue

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Calculate distance to mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < repelRadius && mouse.isHovered) {
          // Repulsion force: inversely proportional to distance
          const force = (1 - dist / repelRadius) * repelStrength;
          const angle = Math.atan2(dy, dx);

          p.vx -= Math.cos(angle) * force;
          p.vy -= Math.sin(angle) * force;

          // Increase brightness/glow near cursor
          p.activeAlpha = Math.min(p.baseAlpha + (1 - dist / repelRadius) * 0.9, 1);
        } else {
          // Fade back to base alpha
          p.activeAlpha += (p.baseAlpha - p.activeAlpha) * 0.08;
        }

        // Spring force returning particle to origin
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;
        p.vx += homeDx * 0.08;
        p.vy += homeDy * 0.08;

        // Damping / friction
        p.vx *= 0.82;
        p.vy *= 0.82;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        const currentSize = p.activeAlpha > p.baseAlpha + 0.15 ? p.size * 1.8 : p.size;
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

        if (p.activeAlpha > p.baseAlpha + 0.2) {
          ctx.fillStyle = `rgba(${glowColor}, ${p.activeAlpha})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${glowColor}, 0.8)`;
        } else {
          ctx.fillStyle = `rgba(${baseColor}, ${p.activeAlpha})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    initParticles();
    render();

    // Global mouse event handlers - tracks mouse over entire viewport and checks bounds of container
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        mouse.x = clientX - rect.left;
        mouse.y = clientY - rect.top;
        mouse.isHovered = true;
      } else {
        mouse.isHovered = false;
        mouse.x = -1000;
        mouse.y = -1000;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          mouse.x = clientX - rect.left;
          mouse.y = clientY - rect.top;
          mouse.isHovered = true;
        } else {
          mouse.isHovered = false;
        }
      }
    };

    const handleTouchEnd = () => {
      mouse.isHovered = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      initParticles();
    });
    resizeObserver.observe(container);

    // Attach listeners to window so hovering over any child H1, P, Button still triggers particle repulsion
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dotSpacing, repelRadius, repelStrength, maxDotSize, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full pointer-events-none" />
    </div>
  );
}
