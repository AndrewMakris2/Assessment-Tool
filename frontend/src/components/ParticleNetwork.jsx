import { useEffect, useRef } from 'react';

export default function ParticleNetwork() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouse = { x: -1000, y: -1000 };

    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 160;
    const MOUSE_RADIUS = 200;

    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      hue: Math.random() > 0.5 ? 270 : 250,
    }));

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx -= (dx / dist) * force * 0.02;
          p.vy -= (dy / dist) * force * 0.02;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(270, 60%, 65%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      const mouseDist = (p) => Math.sqrt((mouse.x - p.x) ** 2 + (mouse.y - p.y) ** 2);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const md = mouseDist(p);
        const nearMouse = md < MOUSE_RADIUS;
        const glow = nearMouse ? (1 - md / MOUSE_RADIUS) * 0.6 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + (nearMouse ? glow * 2 : 0), 0, Math.PI * 2);
        ctx.fillStyle = nearMouse
          ? `hsla(${p.hue}, 80%, 70%, ${0.5 + glow})`
          : `hsla(${p.hue}, 50%, 60%, 0.3)`;
        ctx.fill();

        if (nearMouse) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `hsla(270, 70%, 65%, ${glow * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
