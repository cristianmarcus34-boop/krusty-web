'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

export default function KrustyParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (typeof globalThis !== 'undefined') {
        canvas.width = globalThis.innerWidth;
        canvas.height = globalThis.innerHeight;
      }
    };
    resizeCanvas();
    globalThis.addEventListener('resize', resizeCanvas);

    const foodEmojis = ['🍔', '🧀', '🥬', '🍅', '🧅', '⭐', '🍟', '🥤', '🌭', '🍩'];
    
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 25;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 0),
        y: Math.random() * (canvas.height || 0),
        size: 15 + Math.random() * 20,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.1,
        life: Math.random() * 100,
        maxLife: 150 + Math.random() * 150,
        emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life -= 0.2;
        particle.rotation += particle.rotationSpeed;

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }

        const opacity = Math.min(particle.life / 30, 0.4);
        ctx.globalAlpha = opacity;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.font = `${particle.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.emoji, 0, 0);
        ctx.restore();

        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width;
          particle.y = canvas.height + 50;
          particle.life = particle.maxLife;
          particle.speedX = (Math.random() - 0.5) * 0.4;
          particle.speedY = -Math.random() * 0.6 - 0.2;
          particle.emoji = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      globalThis.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'soft-light' }}
    />
  );
}