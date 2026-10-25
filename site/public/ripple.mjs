// Qaieo particle interference field. Inspired by the Higgsfield direction study.
// A local Higgsfield loop enhances a live canvas fallback; no external runtime requests.
const canvas = document.querySelector('.ripple-field');
const context = canvas?.getContext('2d');
const hero = canvas?.closest('.hero');
const control = hero?.querySelector('.motion-control');
const film = hero?.querySelector('.wave-film');

if (context && hero && control) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  let width = 0, height = 0, frame = 0, last = 0, phase = 0;
  let visible = true, paused = false, particles = [];
  let filmReady = false, filmFailed = false, filmRequested = false, stalledAt = -1;
  const saveData = typeof navigator !== 'undefined' && navigator.connection?.saveData;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  // Opacity buckets avoid changing paint state for every particle.
  const buckets = Array.from({ length: 24 }, () => []);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function prepare() {
    particles = [];
    const columns = width < 650 ? 92 : 148;
    const rows = width < 650 ? 35 : 57;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const u = column / (columns - 1) * 2 - 1;
        const v = row / (rows - 1) * 2 - 1;
        // Fixed tiny jitter keeps discrete particles from looking like a wire mesh.
        const seed = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
        const noise = seed - Math.floor(seed);
        particles.push({ u: u + (noise - .5) * .006, v,
          edge: Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), .45),
          ember: row % 17 === 4 && noise > .36, noise });
      }
    }
  }

  function draw() {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    for (const bucket of buckets) bucket.length = 0;
    const mobile = width < 650;
    const centerX = width * (mobile ? .86 : .79) + pointer.x;
    const centerY = height * (mobile ? .45 : .49) + pointer.y;
    const extentX = width * (mobile ? .87 : .56);
    const amplitude = Math.min(height * .27, width * .19);
    for (const p of particles) {
      // Two traveling waves interfere across a Gaussian envelope. All points
      // belong to one continuous surface; brightness follows its local amplitude.
      const a = Math.sin(p.u * 5.5 + p.v * 2.4 - phase);
      const b = Math.sin(p.u * 3.2 - p.v * 3.6 + phase * .72);
      const envelope = Math.exp(-p.u * p.u * .65);
      const wave = (a * .70 + b * .30) * envelope;
      const perspective = 1 + p.v * .17;
      const x = centerX + (p.u * extentX + p.v * width * .13) * perspective;
      const y = centerY + p.v * height * .235 - wave * amplitude + p.u * height * .065;
      if (x < -5 || x > width + 5 || y < -5 || y > height + 5) continue;
      const crest = (wave + 1) * .5;
      const alpha = clamp(p.edge * (.20 + crest * .65) * (.72 + p.v * .17), 0, .9);
      const level = clamp(Math.floor(alpha * 12), 0, 11);
      if (level === 0) continue;
      const radius = (.50 + (p.v + 1) * .29 + crest * .30) * (mobile ? .85 : 1);
      buckets[level + (p.ember ? 12 : 0)].push(x, y, radius);
    }
    context.globalCompositeOperation = 'lighter';
    for (let index = 1; index < buckets.length; index++) {
      const points = buckets[index];
      if (!points.length) continue;
      const alpha = (index % 12) / 12;
      context.fillStyle = index < 12 ? `rgba(218,226,230,${alpha})` : `rgba(241,107,61,${alpha * .88})`;
      context.beginPath();
      for (let i = 0; i < points.length; i += 3) {
        context.moveTo(points[i] + points[i + 2], points[i + 1]);
        context.arc(points[i], points[i + 1], points[i + 2], 0, tau);
      }
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';
  }

  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (time - last < 33) return;
    phase += Math.min(time - (last || time), 66) * .00028;
    last = time;
    pointer.x += (pointer.targetX - pointer.x) * .04;
    pointer.y += (pointer.targetY - pointer.y) * .04;
    draw();
  }

  function mediaFallback() {
    filmFailed = true;
    filmReady = false;
    hero.classList.remove('film-playing');
    film?.pause();
    draw();
    sync();
  }

  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    control.hidden = reduced.matches;
    control.setAttribute('aria-label', paused ? 'Resume background motion' : 'Pause background motion');
    control.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    hero.classList.toggle('motion-reduced', reduced.matches);
    if (reduced.matches) {
      film?.pause();
      filmReady = false;
      hero.classList.remove('film-playing');
      pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
      phase = 0;
      hero.style.setProperty('--field-x', '0px');
      hero.style.setProperty('--field-y', '0px');
      draw();
    } else if (!paused && visible && !document.hidden) {
      if (film && !filmFailed && !saveData) {
        if (!filmRequested) {
          filmRequested = true;
          film.muted = true;
          film.src = film.dataset.src;
        }
        if (film.paused) film.play().catch(mediaFallback);
      }
      if (!filmReady) frame = requestAnimationFrame(tick);
    } else {
      film?.pause();
    }
  }

  film?.addEventListener('timeupdate', () => {
    if (filmReady || filmFailed || reduced.matches || paused || !visible || document.hidden) return;
    // Reveal only once actual playback has advanced, not on a load promise.
    if (film.currentTime > .05 && film.readyState >= 2 && Math.abs(film.currentTime - stalledAt) > .02) {
      filmReady = true;
      hero.classList.add('film-playing');
      cancelAnimationFrame(frame);
    }
  });
  film?.addEventListener('error', mediaFallback);
  for (const event of ['stalled', 'waiting']) film?.addEventListener(event, () => {
    if (!filmReady) return;
    filmReady = false;
    stalledAt = film.currentTime;
    hero.classList.remove('film-playing');
    draw();
    sync();
  });

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
    if (reduced.matches || paused || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 26;
    pointer.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 18;
    hero.style.setProperty('--field-x', `${pointer.targetX * .5}px`);
    hero.style.setProperty('--field-y', `${pointer.targetY * .5}px`);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.targetX = pointer.targetY = 0;
    hero.style.setProperty('--field-x', '0px');
    hero.style.setProperty('--field-y', '0px');
  });
  control.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
  resize();
  sync();
}
