import { useEffect, useRef, memo } from 'react';

const InteractiveHeroCanvas = memo(function InteractiveHeroCanvas({ themeColor = '#4f46e5' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = canvas.parentElement.offsetWidth;
    let height = canvas.parentElement.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Mouse tracker state with velocity & trail history for fluid drag
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      speed: 0,
      radius: 180,
      isHovered: false,
      trail: [], // Array of recent points for fluid wake
    };

    // Expanding gravity wave ripples
    const shockwaves = [];

    // Particle grid resolution (fine Google Antigravity spacing)
    const gap = 26;
    let particles = [];

    function initParticles() {
      particles = [];
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const originX = i * gap;
          const originY = j * gap;
          particles.push({
            col: i,
            row: j,
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            baseRadius: 1.1,
            radius: 1.1,
            // Spring physics constants (elastic membrane)
            spring: 0.042,
            damping: 0.86,
          });
        }
      }
    }

    initParticles();

    // Event listeners
    const parent = canvas.parentElement;

    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (!mouse.isHovered) {
        mouse.x = currentX;
        mouse.y = currentY;
        mouse.prevX = currentX;
        mouse.prevY = currentY;
        mouse.targetX = currentX;
        mouse.targetY = currentY;
        mouse.trail = [];
      } else {
        mouse.targetX = currentX;
        mouse.targetY = currentY;
      }

      mouse.isHovered = true;
    };

    const handleMouseEnter = (e) => {
      const rect = parent.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      mouse.x = currentX;
      mouse.y = currentY;
      mouse.targetX = currentX;
      mouse.targetY = currentY;
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
      mouse.trail = [];
    };

    const handleClick = (e) => {
      const rect = parent.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      shockwaves.push({
        x: clickX,
        y: clickY,
        radius: 5,
        maxRadius: 320,
        power: 28,
        speed: 6.5,
        opacity: 1,
      });
    };

    parent.addEventListener('mousemove', handleMouseMove, { passive: true });
    parent.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    parent.addEventListener('mouseleave', handleMouseLeave);
    parent.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.offsetWidth;
      height = canvas.parentElement.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // 60FPS Physics Simulation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation & velocity calculation
      if (mouse.isHovered) {
        const mouseDx = mouse.targetX - mouse.x;
        const mouseDy = mouse.targetY - mouse.y;
        mouse.vx = mouse.vx * 0.6 + mouseDx * 0.18;
        mouse.vy = mouse.vy * 0.6 + mouseDy * 0.18;
        mouse.x += mouse.vx;
        mouse.y += mouse.vy;
        mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

        // Store trail for fluid wake
        mouse.trail.unshift({ x: mouse.x, y: mouse.y, vx: mouse.vx, vy: mouse.vy });
        if (mouse.trail.length > 8) mouse.trail.pop();
      } else {
        mouse.vx *= 0.8;
        mouse.vy *= 0.8;
        mouse.speed *= 0.8;
      }

      // 1. Dynamic Cursor Spotlight Glow
      if (mouse.isHovered && mouse.x > -100) {
        const glowRadius = mouse.radius * 1.3;
        const glow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius
        );
        glow.addColorStop(0, 'rgba(99, 102, 241, 0.14)');
        glow.addColorStop(0.4, 'rgba(56, 189, 248, 0.05)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Process Shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += sw.speed;
        sw.opacity -= 0.015;

        if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(s, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99, 102, 241, ${sw.opacity * 0.35})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. Update Grid Particles with Antigravity Physics
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction with Cursor & Fluid Wake
        if (mouse.isHovered) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0.001) {
            const norm = dist / mouse.radius;
            // Antigravity inverse-square / bell curve repulsion
            const force = Math.cos(norm * (Math.PI / 2)) * (24 + Math.min(mouse.speed * 0.7, 20));
            const angle = Math.atan2(dy, dx);

            // Radial repulsion + subtle tangential swirl along mouse velocity
            const swirlX = -mouse.vy * (1 - norm) * 0.15;
            const swirlY = mouse.vx * (1 - norm) * 0.15;

            p.vx += Math.cos(angle) * force * 0.18 + swirlX;
            p.vy += Math.sin(angle) * force * 0.18 + swirlY;
          }

          // Fluid wake from trailing mouse history
          for (let t = 1; t < mouse.trail.length; t++) {
            const tr = mouse.trail[t];
            const trDx = p.x - tr.x;
            const trDy = p.y - tr.y;
            const trDist = Math.sqrt(trDx * trDx + trDy * trDy);
            const wakeRadius = mouse.radius * 0.75;
            if (trDist < wakeRadius && trDist > 0.001) {
              const trNorm = trDist / wakeRadius;
              const wakeForce = (1 - trNorm) * (1 - t / mouse.trail.length) * 4;
              p.vx += (tr.vx * 0.08) + Math.cos(Math.atan2(trDy, trDx)) * wakeForce;
              p.vy += (tr.vy * 0.08) + Math.sin(Math.atan2(trDy, trDx)) * wakeForce;
            }
          }
        }

        // Interaction with Click Shockwaves
        for (let s = 0; s < shockwaves.length; s++) {
          const sw = shockwaves[s];
          const swDx = p.x - sw.x;
          const swDy = p.y - sw.y;
          const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
          const diff = Math.abs(swDist - sw.radius);

          if (diff < 40) {
            const wavePower = (1 - diff / 40) * sw.opacity * sw.power;
            const waveAngle = Math.atan2(swDy, swDx);
            p.vx += Math.cos(waveAngle) * wavePower * 0.35;
            p.vy += Math.sin(waveAngle) * wavePower * 0.35;
          }
        }

        // Elastic Spring Return to equilibrium origin (Verlet spring)
        const ax = (p.originX - p.x) * p.spring;
        const ay = (p.originY - p.y) * p.spring;

        p.vx = (p.vx + ax) * p.damping;
        p.vy = (p.vy + ay) * p.damping;

        // Velocity ceiling to prevent instability
        const vSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (vSpeed > 16) {
          p.vx = (p.vx / vSpeed) * 16;
          p.vy = (p.vy / vSpeed) * 16;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Calculate displacement distance from resting point
        const dispX = p.x - p.originX;
        const dispY = p.y - p.originY;
        const displacement = Math.sqrt(dispX * dispX + dispY * dispY);

        // 4. Draw Elastic Interconnecting Web Filaments between neighbors when displaced
        if (displacement > 1.2) {
          const lineAlpha = Math.min(displacement / 18, 0.45);
          // Right connection
          if (p.col < cols - 1) {
            const rightNeighbor = particles[i + rows];
            if (rightNeighbor) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(rightNeighbor.x, rightNeighbor.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
              ctx.lineWidth = 0.8 + lineAlpha * 0.8;
              ctx.stroke();
            }
          }
          // Bottom connection
          if (p.row < rows - 1) {
            const bottomNeighbor = particles[i + 1];
            if (bottomNeighbor) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(bottomNeighbor.x, bottomNeighbor.y);
              ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha * 0.9})`;
              ctx.lineWidth = 0.8 + lineAlpha * 0.8;
              ctx.stroke();
            }
          }
        }

        // 5. Draw Particle Dot with Dynamic Color & Scale
        // When resting: subtle micro-dot; when displaced: glowing vibrant indigo/cyan dot
        const dotRadius = p.baseRadius + Math.min(displacement * 0.08, 1.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);

        if (displacement > 2) {
          const glowIntensity = Math.min(displacement / 15, 1);
          ctx.fillStyle = `rgba(79, 70, 229, ${0.4 + glowIntensity * 0.55})`;
        } else if (displacement > 0.4) {
          ctx.fillStyle = `rgba(148, 163, 184, ${0.28 + displacement * 0.15})`;
        } else {
          // Subtle resting dot (Google Antigravity micro-grid)
          ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      parent.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [themeColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
});

export default InteractiveHeroCanvas;
