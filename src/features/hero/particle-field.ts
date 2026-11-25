// Particle field: imperative canvas animation, kept out of React's render path.
// Runs only while the canvas is on screen and the tab is visible, and draws a
// single static frame when the visitor prefers reduced motion.

const LINK_DISTANCE = 120;
const MOUSE_RADIUS = 150;

class Particle {
  x: number;
  y: number;
  vx = (Math.random() - 0.5) * 0.3;
  vy = (Math.random() - 0.5) * 0.3;
  size = Math.random() * 2 + 1;
  color = Math.random() > 0.8 ? '#ffffff' : '#00F0FF';

  constructor(
    private width: number,
    private height: number,
  ) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
  }

  update(mouse: { x: number | null; y: number | null }) {
    this.x += this.vx;
    this.y += this.vy;
    if (mouse.x != null && mouse.y != null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
        this.x -= (dx / distance) * force * 2;
        this.y -= (dy / distance) * force * 2;
      }
    }
    if (this.x < 0) this.x = this.width;
    if (this.x > this.width) this.x = 0;
    if (this.y < 0) this.y = this.height;
    if (this.y > this.height) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export interface ParticleFieldOptions {
  reducedMotion: boolean;
}

export function startParticleField(
  canvas: HTMLCanvasElement,
  { reducedMotion }: ParticleFieldOptions,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let particles: Particle[] = [];
  const mouse: { x: number | null; y: number | null } = { x: null, y: null };
  let frame = 0;
  let onScreen = true;
  let tabVisible = !document.hidden;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;

  const init = () => {
    // Fewer particles on small screens keeps the O(n^2) link pass cheap.
    const divisor = window.innerWidth < 768 ? 30000 : 15000;
    const count = Math.floor((canvas.width * canvas.height) / divisor);
    particles = Array.from({ length: count }, () => new Particle(canvas.width, canvas.height));
  };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
    if (reducedMotion) drawFrame(false);
  };

  const drawFrame = (advance: boolean) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let a = 0; a < particles.length; a++) {
      const pa = particles[a]!;
      for (let b = a + 1; b < particles.length; b++) {
        const pb = particles[b]!;
        const distance = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        if (distance < LINK_DISTANCE) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - distance / LINK_DISTANCE) * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }
    for (const p of particles) {
      if (advance) p.update(mouse);
      p.draw(ctx);
    }
  };

  const loop = () => {
    drawFrame(true);
    frame = requestAnimationFrame(loop);
  };

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!reducedMotion && onScreen && tabVisible) frame = requestAnimationFrame(loop);
  };

  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  };
  const onMouseMove = (e: MouseEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  const onVisibility = () => {
    tabVisible = !document.hidden;
    sync();
  };

  const observer = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    sync();
  });
  observer.observe(canvas);

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  if (!reducedMotion) window.addEventListener('mousemove', onMouseMove, { passive: true });

  resize();
  sync();

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(resizeTimer);
    observer.disconnect();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('mousemove', onMouseMove);
  };
}
