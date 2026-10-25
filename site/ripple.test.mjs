import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('./ripple.mjs', import.meta.url), 'utf8');

function mount({ reduce = false, canvasSupported = true } = {}) {
  const frames = new Map();
  const events = new Map();
  let frameId = 0, strokes = 0, intersects;
  const motion = { matches: reduce, addEventListener: (_, fn) => events.set('preference', fn) };
  const control = { hidden: true, labels: {}, setAttribute(k, v) { this.labels[k] = v; }, addEventListener: (_, fn) => events.set('click', fn) };
  const bounds = { width: 1100, height: 650, left: 0, top: 0 };
  const hero = { querySelector: () => control, getBoundingClientRect: () => bounds, addEventListener: (name, fn) => events.set(name, fn) };
  const context = { clearRect() {}, setTransform() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() { strokes++; } };
  const canvas = { getContext: () => canvasSupported ? context : null, closest: () => hero, getBoundingClientRect: () => bounds };
  const document = { hidden: false, querySelector: () => canvas, addEventListener: (name, fn) => events.set(name, fn) };
  runInNewContext(source, {
    document, matchMedia: () => motion, devicePixelRatio: 2,
    requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(fn) { intersects = fn; } observe() {} },
  });
  return {
    frames, control, motion, document, events, canvas,
    get strokes() { return strokes; },
    intersect(value) { intersects([{ isIntersecting: value }]); },
    tick(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); },
  };
}

test('motion renders, pauses and resumes without more than one frame loop', () => {
  const view = mount();
  assert.equal(view.frames.size, 1);
  const initial = view.strokes;
  view.tick(100);
  assert.ok(view.strokes > initial);
  assert.equal(view.frames.size, 1);
  view.events.get('click')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.labels['aria-label'], 'Resume background motion');
  view.events.get('click')();
  assert.equal(view.frames.size, 1);
  assert.equal(view.control.labels['aria-label'], 'Pause background motion');
  assert.equal(view.canvas.width, 1650); // Retina backing store remains bounded.
});

test('reduced motion paints a still field, including when the preference changes', () => {
  const view = mount({ reduce: true });
  assert.ok(view.strokes > 0);
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.hidden, true);
  view.motion.matches = false;
  view.events.get('preference')();
  assert.equal(view.frames.size, 1);
  view.motion.matches = true;
  view.events.get('preference')();
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.hidden, true);
});

test('offscreen or hidden documents stop motion and preserve an explicit pause', () => {
  const view = mount();
  view.intersect(false);
  assert.equal(view.frames.size, 0);
  view.intersect(true);
  assert.equal(view.frames.size, 1);
  view.document.hidden = true;
  view.events.get('visibilitychange')();
  assert.equal(view.frames.size, 0);
  view.document.hidden = false;
  view.events.get('visibilitychange')();
  assert.equal(view.frames.size, 1);
  view.events.get('click')();
  view.intersect(false);
  view.intersect(true);
  assert.equal(view.frames.size, 0);
});

test('without canvas support the page keeps a hidden motion control', () => {
  const view = mount({ canvasSupported: false });
  assert.equal(view.frames.size, 0);
  assert.equal(view.control.hidden, true);
});
