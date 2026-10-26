// Qaieo particle interference field. Inspired by the Higgsfield direction study.
// One live surface, driven only by the cursor. No film layer or playback controls.
const canvas = document.querySelector('.ripple-field');
const context = canvas?.getContext('2d');
const hero = canvas?.closest('.hero');

if (context && hero) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  let width = 0, height = 0, frame = 0, last = 0;
  let visible = true, particles = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0,
    focusX: 0, focusY: 0, targetFocusX: 0, targetFocusY: 0,
    strength: 0, targetStrength: 0, phase: 0, targetPhase: 0 };
  // Opacity buckets avoid changing paint state for every particle.
  const buckets = Array.from({ length: 24 }, () => []);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function prepare() {
    particles = [];
    const columns = width < 650 ? 88 : 142;
    const rows = width < 650 ? 34 : 52;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const u = column / (columns - 1) * 2 - 1;
        const v = row / (rows - 1) * 2 - 1;
        // Fixed tiny jitter keeps discrete particles from looking like a wire mesh.
        const seed = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
        const noise = seed - Math.floor(seed);
        particles.push({ u: u + (noise - .5) * .006, v,
          edge: Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), .45),
          gold: row % 17 === 4 && noise > .36, noise });
      }
    }
  }

  function draw() {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    for (const bucket of buckets) bucket.length = 0;
    const mobile = width < 650;
    const phase = pointer.phase;
    const centerX = width * (mobile ? .86 : .78) + pointer.x;
    const centerY = height * (mobile ? .45 : .49) + pointer.y;
    const extentX = width * (mobile ? .87 : .56);
    const amplitude = Math.min(height * .30, width * .20);
    for (const p of particles) {
      // Two traveling waves interfere across a Gaussian envelope. All points
      // belong to one continuous surface; brightness follows its local amplitude.
      const a = Math.sin(p.u * 5.5 + p.v * 2.4 - phase);
      const b = Math.sin(p.u * 3.2 - p.v * 3.6 + phase * .72);
      const envelope = Math.exp(-p.u * p.u * .65);
      const wave = (a * .70 + b * .30) * envelope;
      const perspective = 1 + p.v * .17;
      let x = centerX + (p.u * extentX + p.v * width * .13) * perspective;
      let y = centerY + p.v * height * .235 - wave * amplitude + p.u * height * .065;
      if (x < -5 || x > width + 5 || y < -5 || y > height + 5) continue;
      const dx = x - pointer.focusX, dy = y - pointer.focusY;
      const distance = Math.hypot(dx, dy);
      const influence = Math.exp(-distance * distance / 46000) * pointer.strength;
      // A local wave packet bends the actual particle coordinates beneath the
      // pointer. It eases toward the cursor and disperses when the cursor leaves.
      const displacement = Math.sin(distance * .018 - phase * 2) * influence * 34;
      x += dx / (distance || 1) * displacement;
      y += dy / (distance || 1) * displacement - influence * 22;
      const crest = (wave + 1) * .5;
      const alpha = clamp(p.edge * (.30 + crest * .64 + influence * .22) * (.82 + p.v * .17), 0, .95);
      const level = clamp(Math.floor(alpha * 12), 0, 11);
      if (level === 0) continue;
      const radius = (.50 + (p.v + 1) * .29 + crest * .30) * (mobile ? .85 : 1);
      buckets[level + (p.gold ? 12 : 0)].push(x, y, radius);
    }
    context.globalCompositeOperation = 'lighter';
    for (let index = 1; index < buckets.length; index++) {
      const points = buckets[index];
      if (!points.length) continue;
      const alpha = (index % 12) / 12;
      context.fillStyle = index < 12 ? `rgba(91,155,224,${alpha})` : `rgba(216,183,122,${alpha * .95})`;
      context.beginPath();
      for (let i = 0; i < points.length; i += 3) {
        context.moveTo(points[i] + points[i + 2], points[i + 1]);
        context.arc(points[i], points[i + 1], points[i + 2], 0, tau);
      }
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';
  }

  function writePointer() {
    hero.style.setProperty('--field-x', `${pointer.x * .5}px`);
    hero.style.setProperty('--field-y', `${pointer.y * .5}px`);
    hero.style.setProperty('--cursor-x', `${pointer.focusX}px`);
    hero.style.setProperty('--cursor-y', `${pointer.focusY}px`);
  }

  // The field comes to rest even while the cursor stays over it. There is no
  // autonomous timeline: movement follows input, then a short spring-like ease.
  const axes = [
    ['x', 'targetX', .02], ['y', 'targetY', .02],
    ['focusX', 'targetFocusX', .02], ['focusY', 'targetFocusY', .02],
    ['strength', 'targetStrength', .0005], ['phase', 'targetPhase', .0005],
  ];
  function needsFrames() {
    return axes.some(([value, target, tolerance]) => Math.abs(pointer[value] - pointer[target]) > tolerance);
  }
  function canMove() {
    return !reduced.matches && visible && !document.hidden;
  }
  function tick(time) {
    frame = 0;
    if (!canMove()) return;
    const elapsed = last ? clamp(time - last, 0, 48) : 16.67;
    last = time;
    const ease = 1 - Math.exp(-elapsed / 115);
    for (const [value, target] of axes) pointer[value] += (pointer[target] - pointer[value]) * ease;
    const moving = needsFrames();
    if (!moving) for (const [value, target] of axes) pointer[value] = pointer[target];
    writePointer();
    draw();
    if (moving) frame = requestAnimationFrame(tick);
    else last = 0; // Retain the complete surface; never clear it when it settles.
  }
  function start() {
    if (!frame && canMove() && needsFrames()) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = last = 0;
    hero.classList.toggle('motion-reduced', reduced.matches);
    // A returning tab starts still, not from a stale cursor interaction.
    for (const [value, target] of axes) pointer[value] = pointer[target] = 0;
    hero.classList.remove('field-active');
    writePointer();
    draw();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    prepare();
    draw();
    hero.classList.add('field-ready');
  }

  hero.addEventListener('pointermove', event => {
    if (!canMove() || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    const u = clamp(x / bounds.width, 0, 1) - .5;
    const v = clamp(y / bounds.height, 0, 1) - .5;
    pointer.targetX = u * 64;
    pointer.targetY = v * 42;
    pointer.targetPhase = u * 1.15 + v * .55;
    pointer.targetFocusX = x;
    pointer.targetFocusY = y;
    if (!pointer.targetStrength && pointer.strength < .003) {
      pointer.focusX = x;
      pointer.focusY = y;
    }
    pointer.targetStrength = 1;
    hero.classList.add('field-active');
    start();
  }, { passive: true });
  function release() {
    pointer.targetX = pointer.targetY = pointer.targetPhase = pointer.targetStrength = 0;
    hero.classList.remove('field-active');
    start();
  }
  hero.addEventListener('pointerleave', release);
  hero.addEventListener('pointercancel', release);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
  resize();
  sync();
}
