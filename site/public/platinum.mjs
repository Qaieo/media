// Approved Ivory Platinum material. Static imagery is the default.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
for (const layer of document.querySelectorAll('[data-platinum-source]')) {
  const region = layer.parentElement;
  const control = region.querySelector('[data-platinum-toggle]');
  let video, inView = false, paused = false, failed = false, playhead = 0;
  const permitted = () => !preference.matches && !connection?.saveData && !failed;
  function removeVideo() {
    if (!video) return;
    playhead = video.currentTime;
    video.pause(); video.removeAttribute('src'); video.load(); video.remove();
    video = undefined;
  }
  function fallback() { failed = true; removeVideo(); control.hidden = true; }
  function update() {
    if (!permitted()) { removeVideo(); control.hidden = true; return; }
    if (!inView || document.hidden) { video?.pause(); return; }
    if (!video) {
      video = document.createElement('video');
      video.muted = true; video.loop = true; video.playsInline = true;
      video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
      video.className = 'platinum-video'; video.preload = 'metadata';
      video.addEventListener('error', fallback, { once: true });
      video.addEventListener('loadedmetadata', () => {
        if (video && Number.isFinite(video.duration)) video.currentTime = playhead % video.duration;
      }, { once: true });
      layer.append(video); video.src = layer.dataset.platinumSource;
    }
    control.hidden = false;
    control.textContent = paused ? 'Resume background animation' : 'Pause background animation';
    control.setAttribute('aria-pressed', String(paused));
    if (paused) video.pause();
    else video.play().catch(error => { if (error.name !== 'AbortError') fallback(); });
  }
  control.addEventListener('click', () => { paused = !paused; update(); });
  preference.addEventListener('change', update);
  connection?.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  new IntersectionObserver(entries => {
    inView = entries.some(entry => entry.isIntersecting); update();
  }).observe(region);
}
