import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./ripple.mjs', import.meta.url), 'utf8');

function mount({ reduce = false, canvasSupported = true } = {}) {
  const frames = new Map(), events = new Map();
  const classes = new Set(), properties = new Map();
  let frameId = 0, fills = 0, intersects, resize, arcCount = 0, clock = 100;
  const arcSamples = [];
  const motion = { matches: reduce, addEventListener: (_, fn) => events.set('preference', fn) };
  const bounds = { width: 1100, height: 650, left: 0, top: 0 };
  const hero = {
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
    },
    style: { setProperty: (name, value) => properties.set(name, value) },
    // The enhancement must work without a film element or a motion button.
    querySelector: () => null,
    getBoundingClientRect: () => bounds,
    addEventListener: (name, fn) => events.set(name, fn),
  };
  const context = {
    clearRect() { arcSamples.length = 0; arcCount = 0; },
    setTransform() {}, beginPath() {}, moveTo() {},
    arc(x, y, radius) {
      if (arcCount++ % 17 === 0 && arcSamples.length < 512) arcSamples.push([x, y, radius]);
    },
    fill() { fills++; },
  };
  const canvas = {
    getContext: () => canvasSupported ? context : null,
    closest: () => hero, getBoundingClientRect: () => bounds,
  };
  const document = {
    hidden: false, querySelector: () => canvas,
    addEventListener: (name, fn) => events.set(name, fn),
  };
  runInNewContext(source, {
    document, matchMedia: () => motion, devicePixelRatio: 2,
    performance: { now: () => clock },
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} },
    IntersectionObserver: class { constructor(fn) { intersects = fn; } observe() {} },
  });
  return {
    frames, motion, document, events, canvas, classes, properties, bounds,
    get fills() { return fills; },
    get arcCount() { return arcCount; },
    get arcSamples() { return arcSamples.map(point => [...point]); },
    intersect(value) { intersects([{ isIntersecting: value }]); },
    resize() { resize(); },
    move(x = 900, y = 400, pointerType = 'mouse') {
      events.get('pointermove')?.({ pointerType, clientX: x, clientY: y, timeStamp: clock });
    },
    tick() {
      assert.equal(frames.size, 1, 'only one animation loop may be scheduled');
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(clock += 34);
    },
    settle() {
      let count = 0;
      while (frames.size && count++ < 180) this.tick();
      assert.equal(frames.size, 0, 'decorative motion must settle without requiring a pause button');
    },
  };
}

test('one branded field renders immediately and stays still until pointer interaction', () => {
  const view = mount();
  assert.ok(view.classes.has('field-ready'));
  assert.ok(view.fills > 0);
  assert.ok(view.arcCount > 100, 'the initial field must be visible, not a transparent overlay');
  assert.equal(view.frames.size, 0);
  assert.equal(view.canvas.width, 1650, 'retina backing resolution remains capped');
  assert.equal(view.canvas.height, 975);
  assert.equal(view.events.has('click'), false, 'no pause button is needed to initialize the field');
});

test('pointer response eases toward new positions and schedules only one loop', () => {
  const view = mount();
  view.move(900, 500);
  view.tick();
  const firstX = Number.parseFloat(view.properties.get('--field-x'));
  assert.ok(firstX > 0);
  view.tick();
  assert.ok(Number.parseFloat(view.properties.get('--field-x')) > firstX);
  const oldFocusX = Number.parseFloat(view.properties.get('--cursor-x'));
  const oldFocusY = Number.parseFloat(view.properties.get('--cursor-y'));
  for (let i = 0; i < 20; i++) view.move(600, 250);
  assert.equal(view.frames.size, 1);
  view.tick();
  const focusX = Number.parseFloat(view.properties.get('--cursor-x'));
  const focusY = Number.parseFloat(view.properties.get('--cursor-y'));
  assert.ok(focusX < oldFocusX && focusX > 600, 'focus must glide horizontally, not snap');
  assert.ok(focusY < oldFocusY && focusY > 250, 'focus must glide vertically, not snap');
});

test('centered input changes actual particles even without whole-field translation', () => {
  const view = mount();
  const original = view.arcSamples;
  view.move(550, 325);
  for (let i = 0; i < 6; i++) view.tick();
  assert.equal(Number.parseFloat(view.properties.get('--field-x')), 0);
  assert.equal(Number.parseFloat(view.properties.get('--field-y')), 0);
  const moved = view.arcSamples;
  assert.ok(moved.length > 20);
  const shifted = moved.filter((point, index) => original[index] &&
    Math.hypot(point[0] - original[index][0], point[1] - original[index][1]) > .1);
  assert.ok(shifted.length > 5, 'many particle positions must respond to the cursor');
});

test('stationary cursor settles to a visible frame and new movement restarts one loop', () => {
  const view = mount();
  view.move();
  view.settle();
  assert.ok(view.arcCount > 100, 'settling must not clear the field');
  view.move(700, 300);
  assert.equal(view.frames.size, 1);
  view.settle();
  assert.ok(view.arcCount > 100);
});

test('leaving the hero eases back without making the wave disappear', () => {
  const view = mount();
  view.move();
  for (let i = 0; i < 6; i++) view.tick();
  view.events.get('pointerleave')();
  view.settle();
  assert.equal(view.classes.has('field-active'), false);
  assert.ok(view.arcCount > 100);
  assert.ok(Math.abs(Number.parseFloat(view.properties.get('--field-x'))) < .1);
  assert.ok(Math.abs(Number.parseFloat(view.properties.get('--field-y'))) < .1);
});

test('reduced-motion preference prevents interaction and immediately settles active motion', () => {
  const view = mount({ reduce: true });
  const initial = view.arcSamples;
  view.move();
  assert.equal(view.frames.size, 0);
  assert.deepEqual(view.arcSamples, initial);
  assert.equal(view.classes.has('field-active'), false);
  view.motion.matches = false;
  view.events.get('preference')();
  assert.equal(view.frames.size, 0, 'preference change alone must not start motion');
  view.move();
  view.tick();
  view.motion.matches = true;
  view.events.get('preference')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.classes.has('field-active'), false);
  assert.equal(Number.parseFloat(view.properties.get('--field-x')), 0);
  assert.equal(Number.parseFloat(view.properties.get('--field-y')), 0);
});

test('touch input leaves the decorative field static', () => {
  const view = mount();
  const initial = view.arcSamples;
  view.move(800, 300, 'touch');
  assert.equal(view.frames.size, 0);
  assert.deepEqual(view.arcSamples, initial);
  assert.equal(view.classes.has('field-active'), false);
});

test('hidden or offscreen heroes stop, ignore movement and wait for fresh interaction', () => {
  for (const hiddenBy of ['document', 'intersection']) {
    const view = mount();
    view.move();
    view.tick();
    if (hiddenBy === 'document') {
      view.document.hidden = true;
      view.events.get('visibilitychange')();
    } else view.intersect(false);
    assert.equal(view.frames.size, 0, hiddenBy);
    assert.equal(view.classes.has('field-active'), false, hiddenBy);
    view.move(700, 300);
    assert.equal(view.frames.size, 0, hiddenBy);
    if (hiddenBy === 'document') {
      view.document.hidden = false;
      view.events.get('visibilitychange')();
    } else view.intersect(true);
    assert.equal(view.frames.size, 0, hiddenBy);
    view.move(850, 350);
    assert.equal(view.frames.size, 1, hiddenBy);
  }
});

test('resize preserves a visible static field with bounded backing resolution', () => {
  const view = mount();
  view.bounds.width = 390;
  view.bounds.height = 600;
  view.resize();
  assert.equal(view.canvas.width, 585);
  assert.equal(view.canvas.height, 900);
  assert.ok(view.arcCount > 50);
  assert.equal(view.frames.size, 0);
});

test('missing canvas support leaves the static fallback unobstructed', () => {
  const view = mount({ canvasSupported: false });
  assert.equal(view.frames.size, 0);
  assert.equal(view.classes.has('field-ready'), false);
  assert.equal(view.events.has('pointermove'), false);
});

test('built homepage uses approved platinum material with native pause control', () => {
  const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
  const hero = html.match(/<section\b[^>]*class="hero"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero);
  assert.equal((hero.match(/data-platinum-source=/g) || []).length, 1);
  assert.doesNotMatch(hero, /<canvas\b|src="ripple.mjs"/);
  assert.match(hero, /src="art\/ivory.webp"/);
  assert.match(hero, /data-platinum-toggle aria-pressed="false" hidden/);
});
