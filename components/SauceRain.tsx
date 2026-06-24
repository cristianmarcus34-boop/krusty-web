'use client';

import { useEffect, useRef } from 'react';

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  width: number;
}

export default function SauceRain() {
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

    const drops: Drop[] = [];
    const DROP_COUNT = 60;

    for (let i = 0; i < DROP_COUNT; i++) {
      drops.push({
        x: Math.random() * (canvas.width || 0),
        y: Math.random() * (canvas.height || 0),
        speed: 1 + Math.random() * 3,
        length: 10 + Math.random() * 30,
        opacity: 0.03 + Math.random() * 0.08,
        width: 1 + Math.random() * 2,
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drops.forEach(drop => {
        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
          drop.speed = 1 + Math.random() * 3;
        }

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.width, drop.y + drop.length);
        
        ctx.strokeStyle = `rgba(226, 27, 34, ${drop.opacity})`;
        ctx.lineWidth = drop.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (drop.y < canvas.height - 50) {
          ctx.beginPath();
          ctx.arc(drop.x + drop.width/2, drop.y + 5, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(226, 27, 34, ${drop.opacity * 0.5})`;
          ctx.fill();
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
    />
  );
}