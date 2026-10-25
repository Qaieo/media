// Decorative contour field: local rendering only, no media or network requests.
const canvas = document.querySelector('.ripple-field');
const context = canvas?.getContext('2d');
const hero = canvas?.closest('.hero');
const control = hero?.querySelector('.motion-control');

if (context && hero && control) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, frame = 0, last = 0, phase = 0;
  let visible = true, paused = false;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function draw() {
    context.clearRect(0, 0, width, height);
    const mobile = width < 650;
    const rings = mobile ? 25 : 38;
    const radius = Math.max(width * .49, height * .7);
    const centerX = width * (mobile ? .95 : .77) + pointer.x;
    const centerY = height * .67 + pointer.y;
    for (let ring = 0; ring < rings; ring++) {
      const spread = .14 + ring / rings;
      context.beginPath();
      for (let point = 0; point <= 120; point++) {
        const angle = point / 120 * Math.PI * 2;
        const wave = Math.sin(angle * 3 + phase - spread * 5) * .035
          + Math.sin(angle * 5 - phase * .6 + spread * 3) * .018;
        const r = radius * (spread + wave);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r * .48
          + Math.cos(angle * 2 + phase * .4) * 16 * spread;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      const opacity = .12 + Math.sin(ring / rings * Math.PI) * .09;
      context.strokeStyle = ring === 16 ? 'rgba(241,107,61,.2)' : `rgba(164,177,184,${opacity})`;
      context.lineWidth = .75;
      context.stroke();
    }
  }

  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (time - last < 33) return; // At most 30 rendered frames per second.
    phase += Math.min(time - (last || time), 66) * .00018;
    last = time;
    pointer.x += (pointer.targetX - pointer.x) * .025;
    pointer.y += (pointer.targetY - pointer.y) * .025;
    draw();
  }

  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    control.hidden = reduced.matches;
    control.setAttribute('aria-label', paused ? 'Resume background motion' : 'Pause background motion');
    control.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    if (reduced.matches) {
      pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
      phase = 0;
      draw();
    } else if (!paused && visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }

  hero.addEventListener('pointermove', event => {
    if (reduced.matches || paused || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 20;
    pointer.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 14;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.targetX = pointer.targetY = 0; });
  control.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
  resize();
  sync();
}
