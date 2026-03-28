/**
 * AssetsPicker — Content Script
 * Injects a draggable floating panel with Shadow DOM (style isolation).
 * Toggled by clicking the extension icon.
 */

// ── CSS injected into Shadow DOM ──────────────────────────────────────────────
const PANEL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  #panel {
    width: 360px;
    max-height: 560px;
    background: #0f0f11;
    border: 1px solid #2a2a32;
    border-radius: 12px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #e8e8f0;
    font-size: 13px;
  }

  /* Header */
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 14px;
    border-bottom: 1px solid #2a2a32;
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
  }
  header:active { cursor: grabbing; }

  .logo {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c6ef7, #e05c6a);
    flex-shrink: 0;
  }

  h1 {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    flex: 1;
    color: #e8e8f0;
  }

  .count-badge {
    font-size: 10px;
    font-weight: 500;
    color: #6b6b80;
    background: #1a1a1f;
    border: 1px solid #2a2a32;
    border-radius: 20px;
    padding: 2px 7px;
  }

  .header-btn {
    background: none;
    border: 1px solid #2a2a32;
    color: #6b6b80;
    border-radius: 6px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
    line-height: 1;
  }
  .header-btn:hover { color: #e8e8f0; border-color: #7c6ef7; }

  /* Tabs */
  .tabs {
    display: flex;
    border-bottom: 1px solid #2a2a32;
    padding: 0 14px;
    gap: 2px;
    flex-shrink: 0;
  }

  .tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b6b80;
    padding: 9px 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }
  .tab:hover { color: #e8e8f0; }
  .tab.active { color: #7c6ef7; border-bottom-color: #7c6ef7; }

  /* Content area */
  #content {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    min-height: 100px;
  }
  #content::-webkit-scrollbar { width: 4px; }
  #content::-webkit-scrollbar-track { background: transparent; }
  #content::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 2px; }

  /* Loading / Error */
  .loading, .error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    color: #6b6b80;
    font-size: 12px;
    text-align: center;
    line-height: 1.6;
  }
  .error { color: #e05c6a; }

  /* Section label */
  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b6b80;
    margin-bottom: 10px;
    margin-top: 16px;
  }
  .section-label:first-child { margin-top: 0; }

  /* Color grid */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    margin-bottom: 2px;
  }

  .swatch {
    position: relative;
    border-radius: 7px;
    cursor: pointer;
    aspect-ratio: 1;
    border: 1px solid rgba(255,255,255,0.07);
    transition: transform 0.12s, box-shadow 0.12s;
    overflow: hidden;
  }
  .swatch:hover {
    transform: scale(1.14);
    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
    z-index: 1;
  }

  .swatch-color {
    width: 100%;
    height: 100%;
  }

  /* Tooltip */
  .swatch-tip {
    position: absolute;
    bottom: calc(100% + 7px);
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    color: #fff;
    font-size: 10px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    padding: 3px 7px;
    border-radius: 5px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s;
    z-index: 10;
  }
  .swatch:hover .swatch-tip { opacity: 1; }

  /* Copy flash */
  .swatch-flash {
    position: absolute;
    inset: 0;
    background: rgba(124,110,247,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s;
  }
  .swatch.copied .swatch-flash { opacity: 1; }

  /* Font items */
  .font-item {
    background: #1a1a1f;
    border: 1px solid #2a2a32;
    border-radius: 9px;
    padding: 12px 13px;
    margin-bottom: 7px;
  }
  .font-item:last-child { margin-bottom: 0; }

  .font-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 7px;
  }

  .font-family-name {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b6b80;
  }

  .font-copy-btn {
    background: none;
    border: none;
    color: #6b6b80;
    cursor: pointer;
    font-size: 10px;
    padding: 3px 7px;
    border-radius: 5px;
    transition: color 0.15s, background 0.15s;
  }
  .font-copy-btn:hover { color: #7c6ef7; background: rgba(124,110,247,0.1); }

  .font-specimen {
    font-size: 21px;
    line-height: 1.25;
    color: #e8e8f0;
    margin-bottom: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .font-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    background: rgba(255,255,255,0.05);
    border: 1px solid #2a2a32;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 10px;
    color: #6b6b80;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .tag.weight { color: #a89af0; border-color: rgba(124,110,247,0.25); }
`;

// ── Panel HTML skeleton ───────────────────────────────────────────────────────
const PANEL_HTML = `
  <header>
    <div class="logo"></div>
    <h1>AssetsPicker</h1>
    <span class="count-badge" id="badge">—</span>
    <button class="header-btn" id="btn-refresh" title="Re-scan">↺</button>
    <button class="header-btn" id="btn-close" title="Close">✕</button>
  </header>
  <nav class="tabs">
    <button class="tab active" data-tab="colors">Colors</button>
    <button class="tab" data-tab="fonts">Typography</button>
  </nav>
  <div id="content">
    <div class="loading">Scanning page…</div>
  </div>
`;

// ── Asset extraction ──────────────────────────────────────────────────────────
function rgbToHex(rgb) {
  if (!rgb) return null;
  const rgba = rgb.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/);
  if (rgba && parseFloat(rgba[4]) === 0) return null;
  const match = rgb.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return '#' + [match[1], match[2], match[3]]
    .map(n => parseInt(n).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function extractAssets() {
  const elements = document.querySelectorAll('*');
  const limit = Math.min(elements.length, 2000);

  const textColors = new Set();
  const bgColors = new Set();
  const borderColors = new Set();
  const fontsMap = {};

  const SKIP = new Set(['script', 'style', 'noscript', 'meta', 'link', 'head']);

  for (let i = 0; i < limit; i++) {
    const el = elements[i];
    if (SKIP.has(el.tagName.toLowerCase())) continue;

    const s = window.getComputedStyle(el);

    // Colors
    const c = rgbToHex(s.color);
    if (c) textColors.add(c);

    const bg = rgbToHex(s.backgroundColor);
    if (bg) bgColors.add(bg);

    const border = rgbToHex(s.borderTopColor);
    if (border && border !== c && border !== bg) borderColors.add(border);

    // Typography
    const family = s.fontFamily?.split(',')[0].trim().replace(/['"]/g, '');
    const size = Math.round(parseFloat(s.fontSize));
    const weight = s.fontWeight;

    if (family && size > 0) {
      if (!fontsMap[family]) fontsMap[family] = { sizes: new Set(), weights: new Set() };
      fontsMap[family].sizes.add(size);
      if (weight) fontsMap[family].weights.add(weight);
    }
  }

  const fonts = Object.entries(fontsMap).map(([family, d]) => ({
    family,
    sizes: [...d.sizes].sort((a, b) => a - b),
    weights: [...d.weights].sort((a, b) => parseInt(a) - parseInt(b)),
  }));

  return {
    colors: {
      text: [...textColors],
      background: [...bgColors],
      border: [...borderColors],
    },
    fonts,
  };
}

// ── Render helpers ────────────────────────────────────────────────────────────
function renderColors(container, colors) {
  const sections = [
    { label: 'Text', list: colors.text },
    { label: 'Background', list: colors.background },
    { label: 'Border', list: colors.border },
  ];

  let total = 0;
  sections.forEach(({ label, list }) => {
    if (!list?.length) return;
    total += list.length;

    const lbl = document.createElement('div');
    lbl.className = 'section-label';
    lbl.textContent = `${label} · ${list.length}`;
    container.appendChild(lbl);

    const grid = document.createElement('div');
    grid.className = 'color-grid';
    list.forEach(hex => grid.appendChild(makeSwatch(hex)));
    container.appendChild(grid);
  });

  if (!total) container.innerHTML = '<div class="loading">No colors found.</div>';
  return total;
}

function makeSwatch(hex) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';

  const color = document.createElement('div');
  color.className = 'swatch-color';
  color.style.background = hex;

  const tip = document.createElement('div');
  tip.className = 'swatch-tip';
  tip.textContent = hex;

  const flash = document.createElement('div');
  flash.className = 'swatch-flash';
  flash.textContent = '✓';

  swatch.appendChild(color);
  swatch.appendChild(tip);
  swatch.appendChild(flash);

  swatch.addEventListener('click', () => {
    navigator.clipboard.writeText(hex).then(() => {
      swatch.classList.add('copied');
      setTimeout(() => swatch.classList.remove('copied'), 700);
    });
  });

  return swatch;
}

function renderFonts(container, fonts) {
  if (!fonts?.length) {
    container.innerHTML = '<div class="loading">No fonts found.</div>';
    return;
  }

  const lbl = document.createElement('div');
  lbl.className = 'section-label';
  lbl.textContent = `Font families · ${fonts.length}`;
  container.appendChild(lbl);

  fonts.forEach(font => container.appendChild(makeFontItem(font)));
  return fonts.length;
}

function makeFontItem({ family, sizes, weights }) {
  const item = document.createElement('div');
  item.className = 'font-item';

  const header = document.createElement('div');
  header.className = 'font-header';

  const name = document.createElement('div');
  name.className = 'font-family-name';
  name.textContent = family;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'font-copy-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(family).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    });
  });

  header.appendChild(name);
  header.appendChild(copyBtn);

  const specimen = document.createElement('div');
  specimen.className = 'font-specimen';
  specimen.style.fontFamily = family;
  specimen.textContent = 'The quick brown fox jumps';

  const tags = document.createElement('div');
  tags.className = 'font-tags';

  sizes.slice(0, 10).forEach(size => {
    const t = document.createElement('span');
    t.className = 'tag';
    t.textContent = `${size}px`;
    tags.appendChild(t);
  });

  weights.forEach(w => {
    const t = document.createElement('span');
    t.className = 'tag weight';
    t.textContent = `${w}`;
    tags.appendChild(t);
  });

  item.appendChild(header);
  item.appendChild(specimen);
  item.appendChild(tags);
  return item;
}

// ── Main panel class ──────────────────────────────────────────────────────────
class AssetsPicker {
  constructor() {
    this.host = null;
    this.shadow = null;
    this.visible = false;
    this.data = null;
    this.activeTab = 'colors';
    this.drag = { active: false, ox: 0, oy: 0 };
  }

  toggle() {
    if (!this.host) {
      this.create();
      this.scan();
    } else {
      this.setVisible(!this.visible);
    }
  }

  setVisible(v) {
    this.visible = v;
    this.host.style.display = v ? '' : 'none';
  }

  create() {
    this.host = document.createElement('div');
    Object.assign(this.host.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '2147483647',
      width: '360px',
    });

    this.shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_CSS;

    const panel = document.createElement('div');
    panel.id = 'panel';
    panel.innerHTML = PANEL_HTML;

    this.shadow.appendChild(style);
    this.shadow.appendChild(panel);

    document.body.appendChild(this.host);
    this.visible = true;

    this.bindEvents();
  }

  bindEvents() {
    const s = this.shadow;

    // Tabs
    s.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        s.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.tab;
        if (this.data) this.render();
      });
    });

    // Buttons
    s.getElementById('btn-close').addEventListener('click', () => this.setVisible(false));
    s.getElementById('btn-refresh').addEventListener('click', () => this.scan());

    // Drag — header inside Shadow DOM, mouse events on document
    const header = s.querySelector('header');
    header.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      this.drag.active = true;
      const rect = this.host.getBoundingClientRect();
      this.drag.ox = e.clientX - rect.left;
      this.drag.oy = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!this.drag.active) return;
      const x = Math.max(0, Math.min(e.clientX - this.drag.ox, window.innerWidth - this.host.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - this.drag.oy, window.innerHeight - this.host.offsetHeight));
      this.host.style.left = x + 'px';
      this.host.style.top = y + 'px';
      this.host.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => { this.drag.active = false; });
  }

  scan() {
    const content = this.shadow.getElementById('content');
    content.innerHTML = '<div class="loading">Scanning…</div>';

    setTimeout(() => {
      try {
        this.data = extractAssets();
        this.render();
      } catch (e) {
        content.innerHTML = `<div class="error">${e.message}</div>`;
      }
    }, 30);
  }

  render() {
    const content = this.shadow.getElementById('content');
    const badge = this.shadow.getElementById('badge');
    content.innerHTML = '';

    let count = 0;
    if (this.activeTab === 'colors') {
      count = renderColors(content, this.data.colors);
      badge.textContent = `${count} colors`;
    } else {
      count = renderFonts(content, this.data.fonts);
      badge.textContent = `${count} fonts`;
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Guard against double-injection (executeScript on a tab that already has
// the content script loaded via manifest).
if (!window.__assetsPickerInit) {
  window.__assetsPickerInit = true;

  const picker = new AssetsPicker();

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'toggle') {
      picker.toggle();
      sendResponse({ ok: true }); // resolves the sendMessage promise in background.js
    }
  });
}
