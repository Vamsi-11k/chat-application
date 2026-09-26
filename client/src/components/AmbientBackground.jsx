import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ElementsCollection } from '../shaders/elements/ElementsBackground';
import '../shaders/threeui.css';

export const AmbientBackground = () => {
  const { effectsEnabled, ambientVariant, theme, isDark } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!effectsEnabled || ambientVariant !== 'aurora') return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Do not animate if user requested reduced motion
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let isVisible = !document.hidden;
    let width = 0;
    let height = 0;

    // Theme Color Palettes (Calibrated for visible, pleasant ambiance)
    const getPalette = () => {
      switch (theme) {
        case 'anime':
          return {
            orbs: [
              { r: 236, g: 72, b: 153, a: 0.22 }, // Sakura Pink
              { r: 168, g: 85, b: 247, a: 0.20 }, // Lavender
              { r: 244, g: 114, b: 182, a: 0.18 }, // Soft Rose
              { r: 192, g: 132, b: 252, a: 0.20 }  // Magical Lilac
            ],
            particleColor: { r: 244, g: 114, b: 182 },
            glowColor: 'rgba(236, 72, 153, 0.8)'
          };
        case 'nostalgic':
          return {
            orbs: [
              { r: 6, g: 182, b: 212, a: 0.22 },   // Cyber Cyan
              { r: 245, g: 158, b: 11, a: 0.18 },  // Sunset Amber
              { r: 236, g: 72, b: 153, a: 0.20 },  // Neon Magenta
              { r: 139, g: 92, b: 246, a: 0.18 }   // Retro Purple
            ],
            particleColor: { r: 6, g: 182, b: 212 },
            glowColor: 'rgba(6, 182, 212, 0.8)'
          };
        case 'dark':
          return {
            orbs: [
              { r: 13, g: 148, b: 136, a: 0.22 },  // Pine Teal
              { r: 16, g: 185, b: 129, a: 0.18 },  // Emerald
              { r: 5, g: 150, b: 105, a: 0.16 },   // Deep Jade
              { r: 45, g: 212, b: 191, a: 0.18 }   // Mint Glow
            ],
            particleColor: { r: 45, g: 212, b: 191 },
            glowColor: 'rgba(45, 212, 191, 0.8)'
          };
        default: // Light
          return {
            orbs: [
              { r: 13, g: 148, b: 136, a: 0.14 },
              { r: 56, g: 189, b: 248, a: 0.12 },
              { r: 52, g: 211, b: 153, a: 0.12 },
              { r: 45, g: 212, b: 191, a: 0.14 }
            ],
            particleColor: { r: 13, g: 148, b: 136 },
            glowColor: 'rgba(13, 148, 136, 0.5)'
          };
      }
    };

    let { orbs: orbColors, particleColor, glowColor } = getPalette();

    // Resize handling with DPR capping for battery/performance
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Aurora Orbs (4 gentle ambient floating gradients)
    const orbs = [
      { x: width * 0.2, y: height * 0.25, vx: 0.18, vy: 0.14, radius: 340, colorIdx: 0 },
      { x: width * 0.8, y: height * 0.35, vx: -0.15, vy: 0.18, radius: 380, colorIdx: 1 },
      { x: width * 0.3, y: height * 0.8, vx: 0.16, vy: -0.16, radius: 360, colorIdx: 2 },
      { x: width * 0.75, y: height * 0.75, vx: -0.18, vy: -0.14, radius: 400, colorIdx: 3 }
    ];

    // Ambient Micro Dust Particles (32 particles with gentle bobbing)
    const particleCount = 32;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulseAngle: Math.random() * Math.PI * 2
    }));

    // Main Animation Loop
    let lastTime = performance.now();

    const render = (now) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Aurora Orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx * delta * 60;
        orb.y += orb.vy * delta * 60;

        // Bounce gently inside viewport bounds
        if (orb.x < -80 || orb.x > width + 80) orb.vx *= -1;
        if (orb.y < -80 || orb.y > height + 80) orb.vy *= -1;

        const col = orbColors[orb.colorIdx % orbColors.length];
        const grad = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );

        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a})`);
        grad.addColorStop(0.5, `rgba(${col.r}, ${col.g}, ${col.b}, ${col.a * 0.45})`);
        grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Subtle Floating Particles with Soft Glow
      ctx.shadowBlur = 6;
      ctx.shadowColor = glowColor;

      particles.forEach((p) => {
        p.x += p.vx * delta * 60;
        p.y += p.vy * delta * 60;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseAngle) * 0.2;

        ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${Math.max(0.1, Math.min(1, currentAlpha))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Page Visibility API handler to pause when tab is hidden
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectsEnabled, ambientVariant, theme, isDark]);

  if (!effectsEnabled) return null;

  // Render ThreeUI ElementsCollection (Water variant)
  if (ambientVariant === 'water') {
    return (
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[1] w-full h-full overflow-hidden select-none opacity-60 dark:opacity-85 transition-opacity duration-700"
      >
        <ElementsCollection
          variant="water"
          speed={1.00}
          size={1.00}
          particleAmount={1.00}
          hue={theme === 'anime' ? 140 : theme === 'nostalgic' ? -35 : 0}
          saturation={1.00}
          brightness={isDark ? 0.95 : 1.15}
          opacity={0.85}
          className="w-full h-full pointer-events-none"
        />
      </div>
    );
  }

  // Render Aurora Orbs Canvas
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full overflow-hidden transition-opacity duration-700 select-none"
    />
  );
};
