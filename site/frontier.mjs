import { FRONTIER_INDUSTRIES, parseFrontierFeed, frontierDate, latestFrontierArticles, industryFrontierArticles } from './frontier-data.mjs';
export { FRONTIER_INDUSTRIES, parseFrontierFeed, frontierDate, latestFrontierArticles, publishedFrontierArticles, frontierArticleIndustries, industryFrontierArticles } from './frontier-data.mjs';
const FEED_URL = '/api/frontier';
const states = new WeakMap();
const displayDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function renderArticles(document, list, articles, state) {
  const key = JSON.stringify(articles);
  // Each section has its own key: changes elsewhere cannot remove its focused link.
  if (key === state.key) return;
  const focusedKey = [...state.links].find(([, link]) => link === document.activeElement)?.[0];
  const links = new Map();
  const fragment = document.createDocumentFragment();
  for (const article of articles) {
    const card = document.createElement('article');
    card.className = 'post frontier-post';
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    const date = document.createElement('time');
    date.dateTime = article.date;
    date.textContent = displayDate.format(new Date(`${article.date}T12:00:00Z`));
    meta.append(date);
    if (article.tags.length) {
      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = article.tags[0];
      meta.append(label);
    }
    const heading = document.createElement('h3');
    const link = document.createElement('a');
    link.href = article.url;
    const title = document.createElement('span');
    title.textContent = article.title;
    const arrow = document.createElement('span');
    arrow.className = 'article-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    link.append(title, arrow);
    heading.append(link);
    const source = document.createElement('p');
    source.className = 'post-source';
    const sourceLink = document.createElement('a');
    sourceLink.href = article.source.href;
    sourceLink.textContent = article.source.label;
    source.append('Source: ', sourceLink);
    card.append(meta, heading, source);
    fragment.append(card);
    links.set(`${article.slug}:article`, link);
    links.set(`${article.slug}:source`, sourceLink);
  }
  list.replaceChildren(fragment);
  // Preserve keyboard position when a changed section still contains that link.
  if (focusedKey) links.get(focusedKey)?.focus({ preventScroll: true });
  state.key = key;
  state.links = links;
  state.articles = articles;
}

export async function loadFrontier(document, fetchFeed = fetch, now = new Date()) {
  const list = document.getElementById('frontier-articles');
  const status = document.getElementById('frontier-status');
  if (!list || !status) return;
  let state = states.get(document);
  if (!state) { state = { pending: false, sections: new Map() }; states.set(document, state); }
  if (state.pending) return;
  const sections = [
    { id: 'latest', list, status },
    ...FRONTIER_INDUSTRIES.map(industry => ({
      id: industry.id,
      list: document.getElementById(`industry-${industry.id}-articles`),
      status: document.getElementById(`industry-${industry.id}-status`),
    })).filter(section => section.list && section.status),
  ];
  for (const section of sections) {
    if (!state.sections.has(section.id)) state.sections.set(section.id, { key: null, articles: [], links: new Map() });
  }
  state.pending = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchFeed(FEED_URL, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
    if (!response.ok) throw new Error('Feed unavailable');
    const raw = await response.text();
    if (raw.length > 150000) throw new Error('Feed too large');
    const articles = parseFrontierFeed(JSON.parse(raw));
    const today = frontierDate(now);
    const groups = industryFrontierArticles(today, articles);
    groups.set('latest', latestFrontierArticles(today, articles));
    for (const section of sections) {
      const published = groups.get(section.id);
      renderArticles(document, section.list, published, state.sections.get(section.id));
      section.status.textContent = published.length
        ? (section.id === 'latest' ? 'Latest published · Updates automatically' : 'Published coverage · Updates automatically')
        : (section.id === 'latest' ? 'No published articles yet.' : 'No published coverage in this industry yet.');
    }
  } catch {
    for (const section of sections) {
      const saved = state.sections.get(section.id);
      section.status.textContent = saved.articles.length
        ? 'Showing the last available articles. Updates will resume automatically.'
        : saved.key !== null
          ? 'No published coverage in the last available feed. Updates will resume automatically.'
          : 'Articles are temporarily unavailable. Read the Frontier archive.';
    }
  } finally {
    state.pending = false;
    clearTimeout(timer);
  }
}

export function startFrontier(document, window, fetchFeed = fetch, now = () => new Date()) {
  const refresh = () => {
    if (document.visibilityState !== 'hidden') return loadFrontier(document, fetchFeed, now());
  };
  void refresh();
  const interval = window.setInterval(refresh, 60_000);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('focus', refresh);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('focus', refresh);
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') startFrontier(document, window);
