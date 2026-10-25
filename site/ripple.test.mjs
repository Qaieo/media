import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./ripple.mjs', import.meta.url), 'utf8');

function mount({ reduce = false, canvasSupported = true, withFilm = true, rejectPlay = false, saveData = false } = {}) {
  const frames = new Map(), events = new Map(), mediaEvents = new Map();
  const classes = new Set(), properties = new Map();
  let frameId = 0, fills = 0, intersects, arcCount = 0;
  const arcSamples = [];
  const motion = { matches: reduce, addEventListener: (_, fn) => events.set('preference', fn) };
  const control = { hidden: true, labels: {}, setAttribute(k, v) { this.labels[k] = v; }, addEventListener: (_, fn) => events.set('click', fn) };
  const film = withFilm ? {
    paused: true, currentTime: 0, readyState: 0, playCalls: 0, pauseCalls: 0,
    dataset: { src: '/media/test-quantum-wave.mp4' },
    addEventListener: (name, fn) => mediaEvents.set(name, fn),
    play() { this.playCalls++; if (rejectPlay) return Promise.reject(new Error('autoplay denied')); this.paused = false; return Promise.resolve(); },
    pause() { this.pauseCalls++; this.paused = true; },
  } : null;
  const bounds = { width: 1100, height: 650, left: 0, top: 0 };
  const hero = {
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
    },
    style: { setProperty: (name, value) => properties.set(name, value) },
    querySelector: selector => selector === '.wave-film' ? film : selector === '.motion-control' ? control : null,
    getBoundingClientRect: () => bounds, addEventListener: (name, fn) => events.set(name, fn),
  };
  const context = {
    // Retain only sparse samples from the current paint, never a frame history.
    clearRect() { arcSamples.length = 0; arcCount = 0; },
    setTransform() {}, beginPath() {}, moveTo() {},
    arc(x, y, radius) { if (arcCount++ % 17 === 0 && arcSamples.length < 512) arcSamples.push([x, y, radius]); },
    fill() { fills++; },
  };
  const canvas = { getContext: () => canvasSupported ? context : null, closest: () => hero, getBoundingClientRect: () => bounds };
  const document = { hidden: false, querySelector: () => canvas, addEventListener: (name, fn) => events.set(name, fn) };
  runInNewContext(source, {
    document, navigator: { connection: { saveData } }, matchMedia: () => motion, devicePixelRatio: 2,
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(fn) { intersects = fn; } observe() {} },
  });
  return {
    frames, control, motion, document, events, canvas, film, classes, properties,
    get fills() { return fills; },
    get arcCount() { return arcCount; },
    get arcSamples() { return arcSamples.map(point => [...point]); },
    intersect(value) { intersects([{ isIntersecting: value }]); },
    media(name) { mediaEvents.get(name)(); },
    advance() { film.currentTime = .1; film.readyState = 2; mediaEvents.get('timeupdate')(); },
    tick(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); },
  };
}

test('canvas fallback renders immediately, pauses and resumes with one bounded frame loop', () => {
  const view = mount({ withFilm: false });
  assert.ok(view.fills > 0);
  assert.ok(view.classes.has('field-ready'));
  assert.equal(view.frames.size, 1);
  const initial = view.fills;
  view.tick(100);
  assert.ok(view.fills > initial);
  assert.equal(view.frames.size, 1);
  view.events.get('click')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.labels['aria-label'], 'Resume background motion');
  view.events.get('click')();
  assert.equal(view.frames.size, 1);
  assert.equal(view.control.labels['aria-label'], 'Pause background motion');
  assert.equal(view.canvas.width, 1650);
});

test('film is revealed only after decoded playback advances, not when play resolves', async () => {
  const view = mount();
  await Promise.resolve();
  assert.equal(view.film.src, view.film.dataset.src);
  assert.equal(view.film.muted, true);
  assert.equal(view.film.playCalls, 1);
  assert.equal(view.classes.has('film-playing'), false);
  assert.equal(view.frames.size, 1);
  view.media('timeupdate');
  assert.equal(view.classes.has('film-playing'), false);
  view.film.currentTime = .1;
  view.media('timeupdate'); // Time without decoded data is insufficient.
  assert.equal(view.classes.has('film-playing'), false);
  view.advance();
  assert.equal(view.classes.has('film-playing'), true);
  assert.equal(view.frames.size, 0);
  view.events.get('click')();
  assert.equal(view.film.paused, true);
  assert.equal(view.control.labels['aria-label'], 'Resume background motion');
  view.events.get('click')();
  assert.equal(view.film.paused, false);
  assert.equal(view.film.playCalls, 2);
  assert.equal(view.frames.size, 0);
});

test('failed autoplay or a media error permanently restores the live fallback', async () => {
  const rejected = mount({ rejectPlay: true });
  await Promise.resolve();
  assert.equal(rejected.classes.has('film-playing'), false);
  assert.equal(rejected.frames.size, 1);
  rejected.advance();
  assert.equal(rejected.classes.has('film-playing'), false);
  rejected.events.get('click')();
  rejected.events.get('click')();
  assert.equal(rejected.film.playCalls, 1);
  assert.equal(rejected.frames.size, 1);

  const failed = mount();
  failed.advance();
  failed.media('error');
  assert.equal(failed.classes.has('film-playing'), false);
  assert.equal(failed.film.paused, true);
  assert.equal(failed.frames.size, 1);
  failed.advance();
  assert.equal(failed.classes.has('film-playing'), false);
});

test('waiting and stalled playback switch to canvas and recover after real advancement', () => {
  for (const event of ['waiting', 'stalled']) {
    const view = mount();
    view.advance();
    view.media(event);
    assert.equal(view.classes.has('film-playing'), false);
    assert.equal(view.frames.size, 1);
    view.media(event);
    assert.equal(view.frames.size, 1);
    view.media('timeupdate'); // A stale timeupdate at the stalled frame is not recovery.
    assert.equal(view.classes.has('film-playing'), false);
    view.film.currentTime = .2;
    view.media('timeupdate');
    assert.equal(view.classes.has('film-playing'), true);
    assert.equal(view.frames.size, 0);
  }
});

test('reduced motion stays still, does not request video, and stops already playing media', () => {
  const view = mount({ reduce: true });
  assert.ok(view.fills > 0);
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.hidden, true);
  assert.ok(view.classes.has('motion-reduced'));
  assert.equal(view.film.src, undefined);
  assert.equal(view.film.playCalls, 0);
  view.motion.matches = false;
  view.events.get('preference')();
  assert.equal(view.frames.size, 1);
  assert.equal(view.film.playCalls, 1);
  view.advance();
  view.motion.matches = true;
  view.events.get('preference')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.film.paused, true);
  assert.equal(view.classes.has('film-playing'), false);
  assert.equal(view.control.hidden, true);
  view.advance();
  assert.equal(view.classes.has('film-playing'), false);
});

test('offscreen or hidden documents pause media and preserve an explicit pause', () => {
  const view = mount();
  view.intersect(false);
  assert.equal(view.frames.size, 0);
  assert.equal(view.film.paused, true);
  view.advance();
  assert.equal(view.classes.has('film-playing'), false);
  view.intersect(true);
  assert.equal(view.frames.size, 1);
  assert.equal(view.film.paused, false);
  view.advance();
  view.document.hidden = true;
  view.events.get('visibilitychange')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.film.paused, true);
  view.document.hidden = false;
  view.events.get('visibilitychange')();
  assert.equal(view.film.paused, false);
  view.events.get('click')();
  const calls = view.film.playCalls;
  view.intersect(false);
  view.intersect(true);
  assert.equal(view.frames.size, 0);
  assert.equal(view.film.paused, true);
  assert.equal(view.film.playCalls, calls);
});

test('data-saving mode uses the live canvas without requesting video', () => {
  const view = mount({ saveData: true });
  assert.equal(view.film.src, undefined);
  assert.equal(view.film.playCalls, 0);
  assert.equal(view.frames.size, 1);
});

test('without canvas support the decorative enhancement leaves its motion control hidden', () => {
  const view = mount({ canvasSupported: false });
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.hidden, true);
  assert.equal(view.film.src, undefined);
  assert.equal(view.film.playCalls, 0);
});


test('cursor movement eases field position and focus rather than snapping', () => {
  const view = mount();
  view.advance();
  assert.equal(view.frames.size, 0);
  view.events.get('pointermove')({ pointerType: 'mouse', clientX: 900, clientY: 500 });
  assert.ok(view.classes.has('field-active'));
  assert.equal(view.properties.get('--field-x'), undefined);
  assert.equal(view.frames.size, 1);
  view.tick(100);
  const firstX = Number.parseFloat(view.properties.get('--field-x'));
  const targetX = (900 / 1100 - .5) * 42 * .5;
  assert.ok(firstX > 0 && firstX < targetX);
  assert.equal(Number.parseFloat(view.properties.get('--cursor-x')), 900);
  view.tick(134);
  assert.ok(Number.parseFloat(view.properties.get('--field-x')) > firstX);
  assert.ok(Number.parseFloat(view.properties.get('--field-x')) < targetX);
  view.events.get('pointermove')({ pointerType: 'mouse', clientX: 600, clientY: 250 });
  assert.equal(Number.parseFloat(view.properties.get('--cursor-x')), 900);
  view.tick(168);
  const focusX = Number.parseFloat(view.properties.get('--cursor-x'));
  const focusY = Number.parseFloat(view.properties.get('--cursor-y'));
  assert.ok(focusX > 600 && focusX < 900);
  assert.ok(focusY > 250 && focusY < 500);
  assert.equal(view.frames.size, 1);
});

test('a centered cursor displaces particle coordinates independently of whole-field translation', () => {
  const baseline = mount({ withFilm: false });
  const reactive = mount({ withFilm: false });
  // Centered input has zero parallax target. Both views use the same wave phase.
  reactive.events.get('pointermove')({ pointerType: 'mouse', clientX: 550, clientY: 325 });
  baseline.tick(100);
  reactive.tick(100);
  assert.equal(Number.parseFloat(reactive.properties.get('--field-x')), 0);
  assert.equal(Number.parseFloat(reactive.properties.get('--field-y')), 0);
  assert.equal(reactive.arcCount, baseline.arcCount);
  const original = baseline.arcSamples, moved = reactive.arcSamples;
  assert.ok(original.length > 20);
  assert.equal(moved.length, original.length);
  const shifted = moved.filter((point, index) => Math.hypot(point[0] - original[index][0], point[1] - original[index][1]) > .01);
  assert.ok(shifted.length > 5, 'cursor must alter many actual particle coordinates');
});

test('touch, reduced motion and explicit pause suppress cursor activation', () => {
  for (const mode of ['touch', 'reduced', 'paused']) {
    const view = mount({ reduce: mode === 'reduced' });
    if (mode !== 'reduced') view.advance();
    if (mode === 'paused') view.events.get('click')();
    const before = [...view.properties.entries()];
    view.events.get('pointermove')({ pointerType: mode === 'touch' ? 'touch' : 'mouse', clientX: 900, clientY: 500 });
    assert.equal(view.classes.has('field-active'), false, mode);
    assert.equal(view.frames.size, 0, mode);
    assert.deepEqual([...view.properties.entries()], before, mode);
  }
});

test('cursor overlays particles during film and the frame loop stops after cursor leave', () => {
  const view = mount();
  view.advance();
  assert.equal(view.frames.size, 0);
  assert.equal(view.arcCount, 0);
  view.events.get('pointermove')({ pointerType: 'mouse', clientX: 820, clientY: 320 });
  for (let time = 100; time < 440; time += 34) view.tick(time);
  assert.ok(view.arcCount > 0, 'playing film receives a local live particle overlay');
  assert.ok(view.classes.has('film-playing'));
  view.events.get('pointerleave')();
  assert.equal(view.classes.has('field-active'), false);
  let frames = 0;
  while (view.frames.size && frames < 150) view.tick(440 + ++frames * 34);
  assert.equal(view.frames.size, 0, 'cursor-only rendering must become idle');
  assert.equal(view.arcCount, 0, 'last overlay is cleared instead of freezing over the film');
  assert.ok(view.classes.has('film-playing'));
  view.events.get('pointermove')({ pointerType: 'mouse', clientX: 750, clientY: 300 });
  assert.equal(view.frames.size, 1, 'new hover restarts one frame loop');
});
