/* Candidature PB Protocol · site statique jetable. Données : window.DATA, window.HEAT, window.I18N */
const LINKS = {
  strava: 'https://www.strava.com/athletes/49274111',
  instagram: 'https://www.instagram.com/boilinglime/',
  article: 'https://constantwiederkehr.substack.com/p/were-all-in-this-together',
};
const D = window.DATA;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------------ langue */
let LANG = (() => { try { const s = localStorage.getItem('lang'); if (s) return s; } catch (e) {} return (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'; })();
const t = k => (I18N[LANG][k] ?? I18N.fr[k] ?? k);
const fmt = n => Math.round(n).toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-US').replace(/ | /g, ' ');
const dec = (n, d = 1) => n.toFixed(d).replace('.', LANG === 'fr' ? ',' : '.');
const MOIS = () => t('months');
const dateL = iso => { const d = new Date(iso + 'T12:00'), m = MOIS()[d.getMonth()]; return LANG === 'fr' ? `${d.getDate()} ${m} ${d.getFullYear()}` : `${m} ${d.getDate()}, ${d.getFullYear()}`; };
const dayL = iso => { const d = new Date(iso + 'T12:00'), m = MOIS()[d.getMonth()]; return LANG === 'fr' ? `${d.getDate()} ${m}` : `${m} ${d.getDate()}`; };
const monthL = iso => `${MOIS()[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;
const nameL = r => (LANG === 'en' ? r.name_en : r.name);
const noteL = r => (LANG === 'en' ? r.note_en : r.note);
const rankL = r => (LANG === 'en' ? r.rank_en : r.rank);
const paceStr = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const toSecs = s => { const p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 3600 + p[1] * 60; };

/* ------------------------------------------------------------------ modèle */
const COLORS = { marathon: '#d4f53c', semi: '#f2f0e7', '10k': '#f2f0e7', trail: '#ff6b3d', bloc: '#a58bff' };
const HEAT_COLOR = '#5b8fd6';
const shape = ty => (ty === '10k' ? 'semi' : ty);
const RANK = { marathon: 0, semi: 1, '10k': 1, trail: 2, bloc: 3 };
const byId = Object.fromEntries(D.races.map(r => [r.id, r]));
const groups = {};
D.races.forEach(r => (groups[r.group] ||= []).push(r));
Object.values(groups).forEach(g => g.sort((a, b) => a.date.localeCompare(b.date)));
const PR = { 22597120890: 'pr.marathon', 20523321063: 'pr.semi', 21584146183: 'pr.10k', 19642496114: 'pr.ultra', 17092500736: 'pr.course', 21130116865: 'pr.course' };
const isPR = r => ['pr.marathon', 'pr.semi', 'pr.10k', 'pr.ultra'].includes(PR[r.id]);
const BOSTON = 22597120890;
const layers = { heat: true, marathon: true, semi: true, trail: true, bloc: true };
let listFilter = 'all';

/* ------------------------------------------------------------------ helpers */
function el(tag, attrs = {}, parent) {
  const isSvg = ['svg', 'g', 'rect', 'path', 'line', 'text', 'circle', 'defs', 'pattern'].includes(tag);
  const n = isSvg ? document.createElementNS(NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v; else if (v != null) n.setAttribute(k, v);
  }
  if (parent) parent.appendChild(n);
  return n;
}
const tip = $('#tip');
function showTip(html, x, y) { tip.innerHTML = html; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on'); }
function hideTip() { tip.classList.remove('on'); }
function roundRectTop(x, y, w, h, r) { r = Math.min(r, w / 2, h); if (h <= 0) return ''; return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }
function roundRectBottom(x, y, w, h, r) { r = Math.min(r, w / 2, h); if (h <= 0) return ''; return `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`; }
function haversine(a, b) { const R = 6371000, k = Math.PI / 180, dLat = (b[1] - a[1]) * k, dLon = (b[0] - a[0]) * k; const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * k) * Math.cos(b[1] * k) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); }
D.races.forEach(r => { let c = 0; r.cum = r.track.map((p, i) => (c += i ? haversine(r.track[i - 1], p) : 0)); });
function pointAtKm(r, km) { const target = km / r.km * r.cum[r.cum.length - 1]; let i = r.cum.findIndex(c => c >= target); if (i < 0) i = r.cum.length - 1; return r.track[i]; }
const ICON = {
  trail: '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M0 12 5.5 3l2.6 4.2L10.5 4 16 12Z" fill="currentColor"/></svg>',
  bloc: '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 12V7h3v5Zm5.5 0V3h3v9ZM12 12V0h3v12Z" fill="currentColor"/></svg>',
};
const pillLabel = ty => (ty === 'marathon' ? '42' : ty === 'semi' ? '21' : ty === '10k' ? '10' : ICON[ty]);
const goRace = id => { $('#carte').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => openRace(id), 500); };

/* ------------------------------------------------------------------ textes statiques */
function applyStatic() {
  document.documentElement.lang = LANG;
  $$('[data-i18n]').forEach(n => { n.innerHTML = t(n.dataset.i18n); });
  $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG));
}
function setLang(l) {
  if (l === LANG) return; LANG = l; try { localStorage.setItem('lang', l); } catch (e) {}
  renderAll(); if (current) renderDetail(current); if (map?.loaded()) addMarkers();
}

/* ------------------------------------------------------------------ rail : liste + filtres */
function buildRail() {
  const top = $('#railTop'); top.innerHTML = '';
  const f = el('figure', { class: 'portrait' }, top);
  el('img', { src: 'media/p/18187718549-1.jpg', alt: 'Xavier & Caroline, Boston 2026' }, f);
  el('figcaption', { text: 'Boston · 20.04.2026' }, f);
  const lk = el('div', { class: 'rail-links' }, top);
  el('a', { href: LINKS.strava, target: '_blank', rel: 'noopener', text: t('links.strava') }, lk);
  el('a', { href: LINKS.instagram, target: '_blank', rel: 'noopener', text: t('links.insta') }, lk);
  el('a', { href: LINKS.article, target: '_blank', rel: 'noopener', text: t('links.article') }, lk);

  const lf = $('#listFilters'); lf.innerHTML = '';
  ['all', 'pr', 'marathon', 'semi', 'trail'].forEach(k => {
    const b = el('button', { type: 'button', role: 'tab', class: (k === listFilter ? 'on' : '') + (k === 'pr' ? ' f-pr' : ''), 'aria-selected': k === listFilter, html: (k === 'pr' ? '★ ' : '') + t('filter.' + k) }, lf);
    b.addEventListener('click', () => { listFilter = k; buildRail(); });
  });

  const box = $('#raceLists'); box.innerHTML = '';
  [['marathon', ['marathon']], ['semi', ['semi', '10k']], ['trail', ['trail']], ['bloc', ['bloc']]].forEach(([cat, types]) => {
    let races = D.races.filter(r => types.includes(r.type)).sort((a, b) => a.date.localeCompare(b.date));
    if (listFilter === 'pr') races = races.filter(isPR);
    else if (listFilter !== 'all' && listFilter !== cat) races = [];
    if (!races.length) return;
    const g = el('div', { class: 'list-group' }, box);
    const tt = el('p', { class: 'list-title' }, g);
    el('span', { class: `pill pill-${shape(types[0])} pill-xs`, html: pillLabel(types[0]) }, tt);
    tt.append(t('cat.' + cat));
    races.forEach(r => {
      const pr = isPR(r);
      const b = el('button', { class: 'race-btn' + (pr ? ' is-pr' : '') + (r.fun ? ' is-fun' : ''), type: 'button', 'data-group': r.group }, g);
      el('span', { class: 'rb-year', text: r.year }, b);
      const meta = r.type === 'bloc' || r.type === 'trail' ? `${dec(r.km, 0)} km · ${fmt(r.elev)} m D+` : r.place;
      const sub = pr ? `<small class="pr-sub">★ ${t(PR[r.id])}</small>` : `<small>${meta}${rankL(r) ? ' · ' + rankL(r) : ''}</small>`;
      el('span', { class: 'rb-name', html: `${nameL(r)}${sub}` }, b);
      el('span', { class: 'rb-time', text: r.time }, b);
      b.addEventListener('click', () => openRace(r.id));
      b.addEventListener('mouseenter', () => markerEls[r.group]?.classList.add('hover'));
      b.addEventListener('mouseleave', () => markerEls[r.group]?.classList.remove('hover'));
    });
  });

  const s = $('#mapStats'); s.innerHTML = '';
  [[fmt(D.stats.km), t('stat.km')], ['2:47:18', t('stat.pr')], [D.stats.marathons, t('stat.mar')], [fmt(D.stats.elev / 1000) + ' km', t('stat.elev')]]
    .forEach(([b, l]) => { const d = el('div', {}, s); el('b', { text: b }, d); el('span', { text: l }, d); });
  buildLayers();
}

function buildLayers() {
  const box = $('#layers'); box.innerHTML = '';
  el('span', { class: 'layers-k', text: t('layers') }, box);
  [['heat', '<i class="heatkey"></i>'], ['marathon', '<span class="pill pill-marathon pill-xs">42</span>'], ['semi', '<span class="pill pill-semi pill-xs">21</span>'], ['trail', `<span class="pill pill-trail pill-xs">${ICON.trail}</span>`], ['bloc', `<span class="pill pill-bloc pill-xs">${ICON.bloc}</span>`]]
    .forEach(([k, ic]) => {
      const b = el('button', { type: 'button', class: 'layer' + (layers[k] ? ' on' : ''), 'aria-pressed': layers[k], html: `${ic}<span>${t('layer.' + k)}${k === 'heat' ? ` · ${fmt(D.stats.runs)}` : ''}</span>` }, box);
      b.addEventListener('click', () => {
        layers[k] = !layers[k]; b.classList.toggle('on', layers[k]); b.setAttribute('aria-pressed', layers[k]);
        if (k === 'heat') ['heat', 'heat-glow'].forEach(id => map.setLayoutProperty(id, 'visibility', layers.heat ? 'visible' : 'none'));
        else addMarkers();
      });
    });
}

/* ------------------------------------------------------------------ carte */
const FRANCE = [[-5.6, 41.3], [9.9, 51.2]];
const HEAT_OP = ['interpolate', ['linear'], ['zoom'], 4, 0.9, 8, 0.55, 11, 0.32];
let map, markerEls = {}, markerObjs = [], current = null, animId = null;
const pad = () => (innerWidth > 860 ? { top: 90, bottom: 90, left: 60, right: 60 } : { top: 50, bottom: 50, left: 40, right: 40 });
const fc = features => ({ type: 'FeatureCollection', features });
const line = (coords, c) => ({ type: 'Feature', properties: { c }, geometry: { type: 'LineString', coordinates: coords } });

function initMap() {
  map = new maplibregl.Map({
    container: 'map', style: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
    bounds: FRANCE, fitBoundsOptions: { padding: pad() }, attributionControl: { compact: true }, maxPitch: 70, cooperativeGestures: innerWidth <= 860,
  });
  map.on('load', () => {
    const set = (id, p, v) => { try { map.setPaintProperty(id, p, v); } catch (e) {} };
    map.getStyle().layers.forEach(l => {
      if (l.type === 'background') set(l.id, 'background-color', '#10110d');
      if (/water/.test(l.id) && l.type === 'fill') set(l.id, 'fill-color', '#08090a');
      if (/landcover|park|landuse/.test(l.id) && l.type === 'fill') set(l.id, 'fill-opacity', 0.35);
      if (/boundary/.test(l.id) && l.type === 'line') set(l.id, 'line-color', '#3a3d33');
    });
    const firstLine = map.getStyle().layers.find(l => l.type === 'line')?.id;
    map.addSource('dem', { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 14, attribution: 'Terrain : Mapzen/AWS' });
    map.addLayer({ id: 'hill', type: 'hillshade', source: 'dem', paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': '#000000', 'hillshade-highlight-color': '#2b2e24', 'hillshade-accent-color': '#15170f' } }, firstLine);

    map.addSource('heat', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'MultiLineString', coordinates: window.HEAT || [] } } });
    map.addLayer({ id: 'heat-glow', type: 'line', source: 'heat', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': HEAT_COLOR, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.28, 11, 0.1], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 10, 12, 8], 'line-blur': ['interpolate', ['linear'], ['zoom'], 4, 9, 12, 6] } });
    map.addLayer({ id: 'heat', type: 'line', source: 'heat', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': HEAT_COLOR, 'line-opacity': HEAT_OP, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2, 8, 1.4, 12, 1.6] } });

    map.addSource('ghost', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'ghost', type: 'line', source: 'ghost', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f2f0e7', 'line-opacity': 0.35, 'line-width': 2, 'line-dasharray': [1, 2] } });
    map.addSource('active', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'active-glow', type: 'line', source: 'active', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': 12, 'line-blur': 10, 'line-opacity': 0.45 } });
    map.addLayer({ id: 'active', type: 'line', source: 'active', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': 3.2 } });
    map.addSource('head', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'head-halo', type: 'circle', source: 'head', paint: { 'circle-radius': 14, 'circle-color': '#f2f0e7', 'circle-opacity': 0.18 } });
    map.addLayer({ id: 'head', type: 'circle', source: 'head', paint: { 'circle-radius': 5.5, 'circle-color': '#f2f0e7', 'circle-stroke-color': '#0e0f0c', 'circle-stroke-width': 2 } });
    map.addSource('hoverpt', { type: 'geojson', data: fc([]) });
    map.addLayer({ id: 'hoverpt', type: 'circle', source: 'hoverpt', paint: { 'circle-radius': 6, 'circle-color': '#0e0f0c', 'circle-stroke-color': '#f2f0e7', 'circle-stroke-width': 2.5 } });

    addMarkers();
    const h = location.hash.match(/^#race-(\d+)/); if (h && byId[h[1]]) openRace(+h[1]);
  });
  map.on('moveend', () => $('#carte').classList.toggle('at-boston', map.getCenter().lng < -30));
}

function addMarkers() {
  markerObjs.forEach(m => m.remove()); markerObjs = []; markerEls = {};
  Object.entries(groups).forEach(([g, all]) => {
    const races = all.filter(r => layers[shape(r.type)]);
    if (!races.length) return;
    const top = [...races].sort((a, b) => RANK[a.type] - RANK[b.type])[0], pr = races.some(isPR);
    const n = el('div', { class: `mk mk-${shape(top.type)}${pr ? ' is-pr' : ''}`, role: 'button', tabindex: 0, 'aria-label': top.place });
    el('span', { class: `pill pill-${shape(top.type)}`, html: pillLabel(top.type) }, n);
    if (races.length > 1) el('span', { class: 'mk-n', text: '×' + races.length }, n);
    if (pr) el('span', { class: 'mk-star', text: '★' }, n);
    el('span', { class: 'mk-l', text: races.length > 1 ? `${top.place} · ${races.map(r => r.year).join(' · ')}` : `${nameL(top)} · ${top.time}` }, n);
    const open = () => openRace((races.find(isPR) || races[races.length - 1]).id);
    n.addEventListener('click', open); n.addEventListener('keydown', e => e.key === 'Enter' && open());
    n.addEventListener('mouseenter', () => $$(`.race-btn[data-group="${g}"]`).forEach(b => b.classList.add('hover')));
    n.addEventListener('mouseleave', () => $$(`.race-btn[data-group="${g}"]`).forEach(b => b.classList.remove('hover')));
    markerEls[g] = n;
    markerObjs.push(new maplibregl.Marker({ element: n }).setLngLat(top.track[0]).addTo(map));
  });
}

/* ------------------------------------------------------------------ détail */
function openRace(id) {
  const r = byId[id]; if (!r) return;
  const first = !current; current = r;
  history.replaceState(null, '', '#race-' + id);
  $('#carte').classList.add('detail'); $('#railIndex').classList.add('away');
  const det = $('#railDetail'); det.hidden = false; renderDetail(r); det.scrollTop = 0;
  requestAnimationFrame(() => det.classList.add('in'));
  if (innerWidth <= 860 && first) $('#map').scrollIntoView({ behavior: 'smooth' });
  if (!map?.loaded()) return;
  const trail = r.type === 'trail' || r.type === 'bloc';
  try { trail ? map.setTerrain({ source: 'dem', exaggeration: 1.35 }) : map.setTerrain(null); } catch (e) {}
  map.setPaintProperty('heat', 'line-opacity', 0.14);
  ['active', 'head', 'hoverpt'].forEach(s => map.getSource(s).setData(fc([])));
  map.getSource('ghost').setData(fc(groups[r.group].filter(x => x.id !== r.id).map(o => line(o.track))));
  cancelAnimationFrame(animId);
  const b = r.bbox, far = map.getCenter().lng - (b[0] + b[2]) / 2;
  const cam = map.cameraForBounds([[b[0], b[1]], [b[2], b[3]]], { padding: pad(), bearing: trail ? -18 : -8, pitch: trail ? 58 : 38 });
  map.flyTo({ ...cam, bearing: trail ? -18 : -8, pitch: trail ? 58 : 38, duration: Math.abs(far) > 40 ? 4200 : 2400, curve: 1.5, essential: true });
  map.once('moveend', () => { if (current === r) drawTrack(r); });
}
function drawTrack(r) {
  const coords = r.track, n = coords.length, dur = 2600, t0 = performance.now(), c = COLORS[r.type];
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), i = Math.max(2, Math.floor(e * n));
    map.getSource('active').setData(fc([line(coords.slice(0, i), c)]));
    map.getSource('head').setData(fc([{ type: 'Feature', geometry: { type: 'Point', coordinates: coords[i - 1] } }]));
    if (k < 1) animId = requestAnimationFrame(step);
  };
  animId = requestAnimationFrame(step);
}
function closeRace() {
  current = null; cancelAnimationFrame(animId);
  history.replaceState(null, '', location.pathname);
  $('#carte').classList.remove('detail');
  const det = $('#railDetail'); det.classList.remove('in');
  setTimeout(() => { if (!current) det.hidden = true; }, 500);
  $('#railIndex').classList.remove('away');
  ['active', 'head', 'ghost', 'hoverpt'].forEach(s => map.getSource(s).setData(fc([])));
  map.setPaintProperty('heat', 'line-opacity', HEAT_OP);
  try { map.setTerrain(null); } catch (e) {}
  map.fitBounds(FRANCE, { padding: pad(), pitch: 0, bearing: 0, duration: 2200 });
}

function renderDetail(r) {
  const det = $('#railDetail'); det.innerHTML = '';
  el('button', { class: 'back', type: 'button', html: `<span>←</span>${t('d.back')}` }, det).addEventListener('click', closeRace);
  const k = el('p', { class: 'd-kicker' }, det);
  el('span', { class: `pill pill-${shape(r.type)} pill-xs`, html: pillLabel(r.type) }, k); k.append(`${t('type.' + r.type)} · ${dateL(r.date)} · ${r.place}`);
  el('h2', { class: 'd-title', text: nameL(r).replace(' · Belle-Île', '') }, det);
  if (PR[r.id]) el('p', { class: 'd-pr', text: `★ ${t(PR[r.id])}` }, det);

  const g = groups[r.group];
  if (g.length > 1) {
    const mixed = g.some(y => y.type !== g[0].type);
    const ed = el('div', { class: 'editions', role: 'tablist' }, det);
    g.forEach(x => {
      const b = el('button', { class: x.id === r.id ? 'on' : '', type: 'button', role: 'tab', 'aria-selected': x.id === r.id, html: `${x.year}${mixed ? ' · ' + t('type.' + x.type).split('-')[0] : ''}<b>${x.time}</b>` }, ed);
      b.addEventListener('click', () => x.id !== r.id && openRace(x.id));
    });
  }
  const tm = el('div', { class: 'd-time' }, det);
  el('b', { text: r.time }, tm);
  el('span', { html: `${r.official ? t('d.official') : t('d.garmin')}${rankL(r) ? `<br><em>${rankL(r)}</em>` : ''}` }, tm);
  const st = el('div', { class: 'd-stats' }, det), pace = r.secs / r.km;
  [[dec(r.km, r.km < 50 ? 1 : 0), t('d.km')], [paceStr(pace), t('d.pace')], [r.hr || '–', t('d.hr')], [fmt(r.elev), t('d.elev')]]
    .forEach(([b, l]) => { const d = el('div', {}, st); el('b', { text: b }, d); el('span', { text: l }, d); });
  el('p', { class: 'd-note', text: noteL(r) }, det);

  if (r.photos?.length) {
    const grid = el('div', { class: 'd-media n' + r.photos.length }, det);
    r.photos.forEach(src => el('img', { src, alt: nameL(r), loading: 'lazy' }, grid).addEventListener('click', () => lightbox(src)));
  }
  const road = ['marathon', 'semi', '10k'].includes(r.type);
  const b1 = el('div', { class: 'd-block' }, det);
  el('h4', { html: `${t('d.profile')} <small>${fmt(r.elev)} ${t('d.profileSub')}</small>` }, b1);
  profileChart(el('div', {}, b1), r);
  const b2 = el('div', { class: 'd-block' }, det);
  el('h4', { html: `${road ? t('d.splitsKm') : t('d.splits5')} <small>${t('d.splitsSub')} · ${paceStr(r.secs / r.km)}/km</small>` }, b2);
  splitsChart(el('div', {}, b2), r, road ? 1 : 5);
  const same = g.filter(x => x.type === r.type);
  if (same.length > 1) {
    const bc = el('div', { class: 'd-block' }, det);
    el('h4', { html: `${same.length} ${t('d.editions')} <small>${t('d.editionsSub')}</small>` }, bc);
    editionsChart(el('div', {}, bc), same, r);
  }
  if (r.buildup) {
    const b3 = el('div', { class: 'd-block' }, det);
    el('h4', { html: `${t('d.prep')} <small>${fmt(r.buildup.total)} km · ${t('d.peak')} ${Math.round(r.buildup.peak)} km</small>` }, b3);
    buildChart(el('div', {}, b3), r.buildup.weeks, { h: 90, labels: true });
    if (r.buildup.key.length) {
      const ul = el('ul', { class: 'd-sessions' }, b3);
      r.buildup.key.forEach(s => { const li = el('li', {}, ul); el('span', { text: s.d.slice(8, 10) + '/' + s.d.slice(5, 7) }, li); el('span', { text: s.n }, li); el('span', { text: dec(s.km) + ' km' }, li); });
    }
  }
  el('a', { class: 'btn primary', href: r.strava, target: '_blank', rel: 'noopener', text: t('d.strava') }, el('div', { class: 'd-links' }, det));
}

/* ------------------------------------------------------------------ graphiques du détail */
function profileChart(box, r) {
  const W = 344, H = 96, P = r.profile, maxK = P[P.length - 1][0];
  const eles = P.map(p => p[1]), lo = Math.min(...eles), hi = Math.max(...eles), span = Math.max(hi - lo, 30);
  const x = k => (k / maxK) * W, y = e => H - 16 - ((e - lo) / span) * (H - 28);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${t('d.profile')} ${Math.round(lo)}–${Math.round(hi)} m` }, box);
  const d = P.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(''), c = COLORS[r.type];
  el('path', { d: `${d}L${W},${H - 16}L0,${H - 16}Z`, fill: c, 'fill-opacity': 0.1 }, svg);
  el('path', { d, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
  el('line', { x1: 0, x2: W, y1: H - 16, y2: H - 16, class: 'grid-l' }, svg);
  [0, maxK / 2, maxK].forEach((k, i) => el('text', { x: x(k), y: H - 3, class: 'ax', 'text-anchor': ['start', 'middle', 'end'][i], text: Math.round(k) + ' km' }, svg));
  el('text', { x: W, y: y(hi) - 4, class: 'ax', 'text-anchor': 'end', text: Math.round(hi) + ' m' }, svg);
  const cross = el('line', { y1: 0, y2: H - 16, stroke: 'currentColor', 'stroke-opacity': 0, 'stroke-width': 1 }, svg);
  const hit = el('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent', style: 'cursor:crosshair' }, svg);
  hit.addEventListener('mousemove', e => {
    const bb = svg.getBoundingClientRect(), k = ((e.clientX - bb.left) / bb.width) * maxK;
    const p = P.reduce((a, b) => (Math.abs(b[0] - k) < Math.abs(a[0] - k) ? b : a));
    cross.setAttribute('x1', x(p[0])); cross.setAttribute('x2', x(p[0])); cross.setAttribute('stroke-opacity', 0.4);
    showTip(`<b>${dec(p[0])} km</b> · ${p[1]} m`, e.clientX, bb.top + y(p[1]) * (bb.height / H));
    map.getSource('hoverpt').setData(fc([{ type: 'Feature', geometry: { type: 'Point', coordinates: pointAtKm(r, p[0]) } }]));
  });
  hit.addEventListener('mouseleave', () => { hideTip(); cross.setAttribute('stroke-opacity', 0); map.getSource('hoverpt').setData(fc([])); });
}
function splitsChart(box, r, stepKm) {
  const S = r.splits.filter(s => s[1] > 0), W = 344, H = 120, mid = 56;
  const len = i => ((S[i][0] - (i ? S[i - 1][0] : 0)) / 1000) || 1;
  const paces = S.map((s, i) => s[1] / len(i));
  const avg = S.reduce((a, s) => a + s[1], 0) / (S[S.length - 1][0] / 1000);
  const dev = paces.map(p => p - avg), maxDev = Math.max(12, ...dev.map(Math.abs));
  const bw = W / S.length, w = Math.min(24, bw - Math.min(2, bw * 0.2));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('d.splitsSub') }, box);
  el('line', { x1: 0, x2: W, y1: mid, y2: mid, stroke: 'currentColor', 'stroke-opacity': 0.35 }, svg);
  el('text', { x: 0, y: 10, class: 'ax', text: t('d.faster') }, svg);
  el('text', { x: 0, y: H - 18, class: 'ax', text: t('d.slower') }, svg);
  const fastest = dev.indexOf(Math.min(...dev));
  S.forEach((s, i) => {
    const hgt = (Math.abs(dev[i]) / maxDev) * (mid - 14), x = i * bw + (bw - w) / 2, faster = dev[i] < 0;
    el('path', { d: faster ? roundRectTop(x, mid - hgt, w, hgt, 2) : roundRectBottom(x, mid, w, hgt, 2), fill: faster ? COLORS[r.type] : 'rgba(242,240,231,.3)' }, svg);
    const hit = el('rect', { x: i * bw, y: 0, width: bw, height: H - 14, fill: 'transparent' }, svg);
    hit.addEventListener('mousemove', e => {
      const km = s[0] / 1000;
      showTip(`<b>${stepKm === 1 ? 'km ' + Math.ceil(km) : Math.round(km - 5) + '–' + Math.round(km) + ' km'}</b> · ${paceStr(paces[i])}/km${s[2] ? ' · ' + s[2] + ' bpm' : ''}`, e.clientX, e.clientY - 6);
      map.getSource('hoverpt').setData(fc([{ type: 'Feature', geometry: { type: 'Point', coordinates: pointAtKm(r, km) } }]));
    });
    hit.addEventListener('mouseleave', () => { hideTip(); map.getSource('hoverpt').setData(fc([])); });
  });
  S.map((s, i) => i).filter(i => (i + 1) % (stepKm === 1 ? 5 : 4) === 0).forEach(i => el('text', { x: i * bw + bw / 2, y: H - 2, class: 'ax', 'text-anchor': 'middle', text: Math.round(S[i][0] / 1000) }, svg));
  const fx = fastest * bw + bw / 2;
  el('text', { x: Math.min(W - 40, Math.max(40, fx)), y: mid - (Math.abs(dev[fastest]) / maxDev) * (mid - 14) - 5, class: 'ax', 'text-anchor': 'middle', style: 'opacity:.85', text: paceStr(paces[fastest]) }, svg);
}
function pointTime(r, d) { let prev = 0, tt = 0; for (const s of r.splits) { if (s[0] >= d) return tt + s[1] * ((d - prev) / ((s[0] - prev) || 1)); tt += s[1]; prev = s[0]; } return tt; }
function editionsChart(box, races, cur) {
  const W = 344, H = 150, L = 34, B = 20, T = 10;
  const series = races.map(x => { const pts = []; for (let d = 5000; d <= Math.min(x.km * 1000, 42000) + 1; d += 5000) pts.push([d / 1000, (pointTime(x, d) - pointTime(x, d - 5000)) / 5]); return { r: x, pts }; });
  const all = series.flatMap(s => s.pts.map(p => p[1])), lo = Math.min(...all) - 5, hi = Math.max(...all) + 5, maxK = Math.max(...series.flatMap(s => s.pts.map(p => p[0])));
  const x = k => L + ((k - 5) / (maxK - 5)) * (W - L - 10), y = p => T + ((p - lo) / (hi - lo)) * (H - T - B);
  const lg = el('div', { class: 'ed-legend' }, box);
  [...races].sort((a, b) => b.year - a.year).forEach(r => el('span', { class: r.id === cur.id ? 'on' : '', html: `<i style="background:${r.id === cur.id ? COLORS[cur.type] : 'rgba(242,240,231,.4)'}"></i>${r.year} · ${r.time}` }, lg));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('d.editionsSub') }, box);
  const step = hi - lo > 60 ? 20 : 10;
  for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) { el('line', { x1: L, x2: W - 10, y1: y(p), y2: y(p), class: 'grid-l' }, svg); el('text', { x: 0, y: y(p) + 3, class: 'ax', text: paceStr(p) }, svg); }
  [5, 20, 40].filter(k => k <= maxK).forEach(k => el('text', { x: x(k), y: H - 4, class: 'ax', 'text-anchor': 'middle', text: k + ' km' }, svg));
  series.sort((a, b) => (a.r.id === cur.id) - (b.r.id === cur.id)).forEach(s => {
    const on = s.r.id === cur.id, c = on ? COLORS[cur.type] : 'rgba(242,240,231,.4)';
    el('path', { d: s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0])},${y(p[1])}`).join(''), fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    const lp = s.pts[s.pts.length - 1];
    el('circle', { cx: x(lp[0]), cy: y(lp[1]), r: 4, fill: c, stroke: 'var(--ink)', 'stroke-width': 2 }, svg);
    s.pts.forEach(p => { const hit = el('circle', { cx: x(p[0]), cy: y(p[1]), r: 8, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', e => showTip(`<b>${s.r.year} · km ${p[0] - 5}–${p[0]}</b> · ${paceStr(p[1])}/km`, e.clientX, e.clientY - 6)); hit.addEventListener('mouseleave', hideTip); });
  });
}
function buildChart(box, weeks, { h = 64, labels = false, maxY = null, color = 'var(--lime)' } = {}) {
  const W = 344, H = h, n = weeks.length, top = maxY || Math.max(...weeks.map(w => w[1]));
  const bw = W / n, w = Math.min(24, bw - 2), base = H - (labels ? 14 : 2);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': t('d.prep') }, box);
  const peak = weeks.reduce((a, b, i) => (b[1] > weeks[a][1] ? i : a), 0);
  weeks.forEach(([d, km], i) => {
    const hh = (km / top) * (base - (labels ? 14 : 4)), x = i * bw + (bw - w) / 2;
    el('path', { d: roundRectTop(x, base - hh, w, hh, 2), fill: i === peak ? color : 'rgba(242,240,231,.42)' }, svg);
    if (labels && i === peak) el('text', { x: x + w / 2, y: base - hh - 4, class: 'ax', 'text-anchor': 'middle', style: 'opacity:.9', text: Math.round(km) }, svg);
    const hit = el('rect', { x: i * bw, y: 0, width: bw, height: H, fill: 'transparent' }, svg);
    hit.addEventListener('mousemove', e => showTip(`<b>${Math.round(km)} km</b> · ${t('d.week')} ${dateL(d)}`, e.clientX, e.clientY - 6));
    hit.addEventListener('mouseleave', hideTip);
  });
  if (labels) { el('text', { x: 0, y: H - 2, class: 'ax', text: 'S-16' }, svg); el('text', { x: W, y: H - 2, class: 'ax', 'text-anchor': 'end', text: t('d.race') }, svg); }
}

/* ------------------------------------------------------------------ section volume */
function journey() {
  const box = $('#journey'); box.innerHTML = '';
  const W = 1100, H = 110, total = D.stats.km, x = k => (k / total) * W, y = 46;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Paris – Boston – Paris' }, box);
  el('line', { x1: 0, x2: W, y1: y, y2: y, stroke: 'currentColor', 'stroke-opacity': 0.15, 'stroke-width': 2 }, svg);
  const prog = el('line', { x1: 0, x2: W, y1: y, y2: y, stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': W, 'stroke-dashoffset': W, style: 'transition: stroke-dashoffset 3.2s cubic-bezier(.2,.7,.1,1)' }, svg);
  let cum = 0;
  D.years.forEach(yr => {
    cum += yr.km; const cx = x(cum);
    el('line', { x1: cx, x2: cx, y1: y + 6, y2: y + 14, stroke: 'currentColor', 'stroke-opacity': 0.35 }, svg);
    if (yr.y >= 2023) { el('text', { x: cx, y: y + 28, class: 'ax', 'text-anchor': 'middle', text: `${t('vol.end')} ${yr.y === 2026 ? t('vol.endNow') : yr.y}` }, svg); el('text', { x: cx, y: y + 42, class: 'ax', 'text-anchor': 'middle', style: 'opacity:.8', text: fmt(cum) }, svg); }
  });
  [[0, 'Paris', 'start'], [5540, 'Boston', 'middle'], [11080, 'Paris', 'middle']].forEach(([k, l, a]) => {
    el('circle', { cx: x(k), cy: y, r: 7, fill: k === 5540 ? 'var(--lime)' : 'var(--paper)', stroke: 'currentColor', 'stroke-width': 2 }, svg);
    el('text', { x: x(k), y: y - 18, 'text-anchor': a, style: 'font: 600 13px var(--f-sans); fill: currentColor', text: l }, svg);
  });
  const runner = el('circle', { cx: 0, cy: y, r: 6, fill: 'currentColor', style: 'transition: transform 3.2s cubic-bezier(.2,.7,.1,1)' }, svg);
  el('text', { x: W, y: y - 18, 'text-anchor': 'end', style: 'font: 500 11px var(--f-mono); fill: currentColor; opacity:.6', text: `+${fmt(total - 11080)} km` }, svg);
  onReveal(box, () => { prog.setAttribute('stroke-dashoffset', 0); runner.style.transform = `translateX(${W}px)`; });
}
function yearsChart() {
  const box = $('#yearsChart'); box.innerHTML = '';
  const W = 520, H = 400, base = H - 40, ys = D.years, n = ys.length, top = Math.max(D.stats.proj2026, ...ys.map(y => y.km)) * 1.08;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('vol.years') }, box);
  const pat = el('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, el('defs', {}, svg));
  el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-opacity': 0.35 }, pat);
  [1000, 2000, 3000, 4000].forEach(v => { const yy = base - (v / top) * (base - 20); el('line', { x1: 0, x2: W, y1: yy, y2: yy, class: 'grid-l' }, svg); el('text', { x: 0, y: yy - 4, class: 'ax', text: fmt(v) }, svg); });
  const bw = W / n, w = 43;
  ys.forEach((y, i) => {
    const x = i * bw + (bw - w) / 2, hh = (y.km / top) * (base - 20), g = el('g', {}, svg);
    if (y.y === 2026) {
      const ph = (D.stats.proj2026 / top) * (base - 20);
      el('path', { d: roundRectTop(x, base - ph, w, ph, 4), fill: 'url(#hatch)', class: 'fade-in' }, g);
      el('text', { x: x + w / 2, y: base - ph - 8, 'text-anchor': 'middle', class: 'ax fade-in', text: `~${fmt(D.stats.proj2026)}` }, g);
    }
    el('path', { d: roundRectTop(x, base - hh, w, hh, 4), fill: 'currentColor', class: 'bar-grow', style: `transition-delay:${i * 90}ms` }, g);
    el('text', { x: x + w / 2, y: y.y === 2026 ? base - hh / 2 + 4 : base - hh - 8, 'text-anchor': 'middle', class: 'val fade-in', style: y.y === 2026 ? 'fill:var(--paper)' : null, text: fmt(y.km) }, g);
    el('text', { x: x + w / 2, y: base + 18, 'text-anchor': 'middle', class: 'ax', style: 'opacity:.9', text: y.y }, g);
    el('text', { x: x + w / 2, y: base + 32, 'text-anchor': 'middle', class: 'ax', text: `${fmt(y.h)} h` }, g);
    const hit = el('rect', { x: i * bw, y: 0, width: bw, height: base, fill: 'transparent' }, g);
    hit.addEventListener('mousemove', e => showTip(`<b>${y.y} · ${fmt(y.km)} km</b><br>${fmt(y.h)} h · ${fmt(y.elev)} m D+`, e.clientX, e.clientY - 6));
    hit.addEventListener('mouseleave', hideTip);
  });
  el('line', { x1: 0, x2: W, y1: base, y2: base, stroke: 'currentColor', 'stroke-opacity': 0.4 }, svg);
  onReveal(box, () => box.classList.add('is-in'));
}
function calendar() {
  const box = $('#calendar'); box.innerHTML = '';
  const raceDays = Object.fromEntries(D.races.map(r => [r.date, r])), steps = [0.18, 0.36, 0.56, 0.78, 1], th = [8, 14, 20, 30];
  const lvl = km => (km <= 0 ? -1 : th.findIndex(v => km < v) === -1 ? 4 : th.findIndex(v => km < v));
  for (let y = 2021; y <= 2026; y++) {
    const row = el('div', { class: 'cal-row' }, box); el('span', { text: y }, row);
    const cell = 7, gap = 2, svg = el('svg', { viewBox: `0 0 ${53 * (cell + gap)} ${7 * (cell + gap)}`, role: 'img', 'aria-label': String(y) }, row);
    const start = new Date(y, 0, 1), off = (start.getDay() + 6) % 7;
    for (let d = new Date(start); d.getFullYear() === y; d.setDate(d.getDate() + 1)) {
      const iso = `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const doy = Math.round((d - start) / 864e5), wk = Math.floor((doy + off) / 7), wd = (d.getDay() + 6) % 7;
      const km = D.daily[iso] || 0, L = lvl(km), race = raceDays[iso], out = iso > '2026-09-26' || iso < '2021-10-12';
      const r = el('rect', { x: wk * (cell + gap), y: wd * (cell + gap), width: cell, height: cell, rx: 1.5, fill: race ? 'var(--lime)' : L < 0 ? 'rgba(18,19,16,.07)' : `rgba(18,19,16,${steps[L]})`, 'fill-opacity': out ? 0.4 : 1, stroke: race ? 'var(--txt-p)' : null, 'stroke-width': race ? 1.2 : null }, svg);
      if (km > 0 || race) { r.addEventListener('mousemove', e => showTip(`<b>${race ? nameL(race) : fmt(km) + ' km'}</b><br>${dateL(iso)}${race ? ' · ' + race.time : ''}`, e.clientX, e.clientY - 6)); r.addEventListener('mouseleave', hideTip); }
    }
  }
  $('#calLegend').innerHTML = `${t('vol.rest')} <i style="background:rgba(18,19,16,.07)"></i>${steps.map(s => `<i style="background:rgba(18,19,16,${s})"></i>`).join('')} 30 km+ <i style="background:var(--lime);outline:1px solid var(--txt-p);margin-left:10px"></i> ${t('vol.race')}`;
}
function facts() {
  const f = $('#facts'); f.innerHTML = '';
  [[fmt(D.stats.h), t('fact.h')], [fmt(D.stats.runs), t('fact.runs')], [D.stats.avg52 + ' km', t('fact.avg')], [D.stats.days12w + ' / 84', t('fact.days')]]
    .forEach(([b, s]) => { const d = el('div', {}, f); el('b', { text: b }, d); el('span', { text: s }, d); });
}

/* ------------------------------------------------------------------ section prépas */
function weeksChart() {
  const box = $('#weeksChart'); box.innerHTML = '';
  const Wk = D.weeks, W = 1100, H = 260, base = H - 26, top = 150;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('prep.weeks') }, box);
  [50, 100, 150].forEach(v => { const y = base - (v / top) * (base - 30); el('line', { x1: 0, x2: W, y1: y, y2: y, class: 'grid-l' }, svg); el('text', { x: 0, y: y - 4, class: 'ax', text: v + ' km' }, svg); });
  const bw = W / Wk.length, raceWeek = {};
  D.races.forEach(r => { const d = new Date(r.date + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); (raceWeek[d.toISOString().slice(0, 10)] ||= []).push(r); });
  const g = el('g', {}, svg);
  Wk.forEach(([d, km], i) => {
    const hh = (Math.min(km, top) / top) * (base - 30), x = i * bw, rs = raceWeek[d];
    el('rect', { x: x + 0.4, y: base - hh, width: Math.max(1, bw - 0.8), height: hh, fill: rs?.some(r => r.type === 'marathon' && !r.fun) ? 'var(--lime)' : 'rgba(242,240,231,.5)', class: 'bar-grow', style: `transition-delay:${Math.round(i * 5)}ms` }, g);
    const hit = el('rect', { x, y: 0, width: bw, height: base, fill: 'transparent' }, svg);
    hit.addEventListener('mousemove', e => showTip(`<b>${Math.round(km)} km</b> · ${t('d.week')} ${dateL(d)}${rs ? '<br>' + rs.map(r => nameL(r) + ' · ' + r.time).join('<br>') : ''}`, e.clientX, e.clientY - 6));
    hit.addEventListener('mouseleave', hideTip);
  });
  Object.entries(raceWeek).forEach(([d, rs]) => {
    const i = Wk.findIndex(w => w[0] === d); if (i < 0) return; const x = i * bw + bw / 2;
    rs.forEach(r => {
      if (r.type === 'marathon' && !r.fun) { el('line', { x1: x, x2: x, y1: 18, y2: base, stroke: 'var(--lime)', 'stroke-opacity': 0.35, 'stroke-dasharray': '2 3', class: 'fade-in' }, svg); el('text', { x, y: 12, 'text-anchor': 'middle', class: 'val fade-in', style: 'font-size:12px', text: r.time }, svg); }
      else if (r.type === 'trail') el('path', { d: `M${x},${base + 6}l4,4l-4,4l-4,-4z`, fill: 'var(--coral)', class: 'fade-in' }, svg);
    });
  });
  [2022, 2023, 2024, 2025, 2026].forEach(y => { const i = Wk.findIndex(w => w[0] >= `${y}-01-01`); el('text', { x: i * bw, y: H - 2, class: 'ax', text: y }, svg); });
  el('line', { x1: 0, x2: W, y1: base, y2: base, stroke: 'currentColor', 'stroke-opacity': 0.3 }, svg);
  el('text', { x: W, y: H - 2, class: 'ax', 'text-anchor': 'end', text: t('prep.ultra') }, svg);
  onReveal(box, () => box.classList.add('is-in'));
}
function builds() {
  const box = $('#builds'); box.innerHTML = '';
  const ms = D.races.filter(r => r.buildup).sort((a, b) => a.date.localeCompare(b.date));
  const maxY = Math.max(...ms.map(m => m.buildup.peak));
  ms.forEach((m, i) => {
    const c = el('div', { class: 'build reveal' + (m.lesson ? ' lesson' : ''), style: `transition-delay:${i * 80}ms`, role: 'button', tabindex: 0 }, box);
    el('div', { class: 'b-y', text: monthL(m.date) }, c);
    el('div', { class: 'b-n', text: m.place + (m.lesson ? ' · ' + t('prep.lesson') : '') }, c);
    buildChart(c, m.buildup.weeks, { h: 64, maxY, color: m.lesson ? 'var(--coral)' : 'var(--lime)' });
    const row = el('div', { class: 'b-row' }, c);
    el('span', { class: 'b-km', text: fmt(m.buildup.total) + ' km' }, row);
    el('span', { class: 'b-t', text: m.time }, row);
    c.addEventListener('click', () => goRace(m.id)); c.addEventListener('keydown', e => e.key === 'Enter' && goRace(m.id));
    io.observe(c);
  });
  const ol = $('#bostonSessions'); ol.innerHTML = '';
  byId[BOSTON].buildup.key.forEach(s => { const li = el('li', {}, ol); el('span', { text: dayL(s.d) }, li); el('span', { text: s.n }, li); el('span', { text: dec(s.km) + ' km' }, li); });
  const W = D.weeks, sums = W.map((w, i) => (i >= 3 ? [i, W.slice(i - 3, i + 1).reduce((a, b) => a + b[1], 0)] : [i, 0])).sort((a, b) => b[1] - a[1]);
  const picked = []; for (const [i, s] of sums) { if (picked.every(([j]) => Math.abs(j - i) > 6)) picked.push([i, s]); if (picked.length === 4) break; }
  const ob = $('#topBlocks'); ob.innerHTML = ''; const mx = picked[0][1];
  picked.forEach(([i, s]) => {
    const from = W[i - 3][0], next = D.races.filter(r => r.date >= from && r.type !== 'bloc').sort((a, b) => a.date.localeCompare(b.date))[0];
    const li = el('li', {}, ob);
    el('span', { text: monthL(from) }, li);
    const mid = el('span', { html: `<b>${fmt(s)} km</b> ${t('prep.in4')}${next ? ` <span style="color:var(--txt-d3)">→ ${nameL(next).replace(' · Belle-Île', '')}</span>` : ''}` }, li);
    el('i', { class: 'meter', html: `<i style="--v:${(s / mx).toFixed(3)}"></i>` }, mid);
    el('span', { text: Math.round(s / 4) + ' ' + t('prep.perWeek') }, li);
  });
  onReveal(ob, () => ob.classList.add('is-in'));
}

/* ------------------------------------------------------------------ section candidature */
function ladder() {
  const box = $('#ladder'); box.innerHTML = '';
  const W = 680, H = 260;
  const pts = D.races.filter(r => r.type === 'marathon' && !r.fun).sort((a, b) => a.date.localeCompare(b.date)).map(r => ({ d: r.date, t: r.secs, l: r.id === BOSTON ? r.time : r.time.slice(0, -3), n: r.place }));
  const fut = [{ d: '2026-11-29', t: toSecs('2:45:00'), l: '2:45', n: 'La Rochelle', f: 1 }, { d: '2027-03-14', t: toSecs('2:40:00'), l: '~2:40', n: LANG === 'fr' ? 'Barcelone' : 'Barcelona', f: 1 }, { d: '2029-04-01', t: toSecs('2:30:00'), l: '2:30', n: t('objective'), f: 1 }];
  const all = [...pts, ...fut], n = all.length, np = pts.length;
  const x = i => 62 + i * ((W - 92) / (n - 1)), lo = 2.45 * 3600, hi = 3.52 * 3600, y = s => 26 + ((s - lo) / (hi - lo)) * (H - 76);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('c2.h') }, box);
  [['3:30', 3.5 * 3600], ['3:00', 3 * 3600], ['2:30', 2.5 * 3600]].forEach(([l, s]) => { el('line', { x1: 34, x2: W, y1: y(s), y2: y(s), class: 'grid-l', style: 'opacity:.14' }, svg); el('text', { x: 0, y: y(s) + 3, class: 'ax', text: l }, svg); });
  el('text', { x: W, y: y(3 * 3600) - 6, class: 'ax', 'text-anchor': 'end', text: t('sub3') }, svg);
  el('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.t)}`).join(''), fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-dasharray': 1200, 'stroke-dashoffset': 1200, class: 'lad-line', style: 'transition: stroke-dashoffset 2.2s cubic-bezier(.2,.7,.1,1)' }, svg);
  el('path', { d: `M${x(np - 1)},${y(pts[np - 1].t)}` + fut.map((p, i) => `L${x(np + i)},${y(p.t)}`).join(''), fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-dasharray': '3 5', class: 'fade-in', style: 'transition-delay:1.8s' }, svg);
  const sx = (x(np - 1) + x(np)) / 2;
  el('line', { x1: sx, x2: sx, y1: 14, y2: H - 34, stroke: 'currentColor', 'stroke-opacity': 0.25, 'stroke-dasharray': '2 3' }, svg);
  el('text', { x: sx + 6, y: 14, class: 'ax', text: t('goals') }, svg);
  const below = [1, 0, 1, 0, 0, 1, 0, 1, 0];
  all.forEach((p, i) => {
    const cx = x(i), cy = y(p.t), dn = below[i], g = el('g', { class: 'fade-in', style: `transition-delay:${0.3 + i * 0.2}s` }, svg);
    el('circle', { cx, cy, r: 5.5, fill: p.f || i === np - 1 ? 'var(--lime)' : 'var(--txt-p)', stroke: p.f ? 'var(--txt-p)' : 'var(--paper)', 'stroke-width': 2 }, g);
    el('text', { x: cx, y: cy + (dn ? 24 : -12), 'text-anchor': 'middle', class: 'val', style: 'font-size:14px', text: p.l }, g);
    el('text', { x: cx, y: H - 18, 'text-anchor': 'middle', class: 'ax', style: 'opacity:.8', text: p.n }, g);
    el('text', { x: cx, y: H - 5, 'text-anchor': 'middle', class: 'ax', text: `${MOIS()[+p.d.slice(5, 7) - 1]} ${p.d.slice(2, 4)}` }, g);
  });
  onReveal(box, () => { box.classList.add('is-in'); $('.lad-line', box).setAttribute('stroke-dashoffset', 0); });
}
function mlog() {
  const box = $('#mlog'); box.innerHTML = '';
  D.races.filter(r => r.type === 'marathon').sort((a, b) => a.date.localeCompare(b.date)).forEach(r => {
    const row = el('button', { type: 'button', class: 'ml-row' + (r.fun ? ' is-fun' : '') + (r.id === BOSTON ? ' is-pr' : '') + (r.lesson ? ' is-lesson' : '') }, box);
    el('span', { class: 'ml-d', text: monthL(r.date) }, row);
    el('span', { class: 'ml-n', html: `${r.place}<small>${t('log')[r.id] || ''}</small>` }, row);
    el('span', { class: 'ml-r', text: rankL(r) || '' }, row);
    el('span', { class: 'ml-t', text: r.time }, row);
    row.addEventListener('click', () => goRace(r.id));
  });
}
const SHOES = [
  ['road', 'Clifton 9', 3], ['road', 'Clifton 10', 1], ['road', 'Mach 6', 1], ['road', 'Mach X', 1], ['road', 'Mach X3', 1],
  ['race', 'Rocket X', 1], ['race', 'Rocket X3', 1], ['race', 'Cielo X1', 1],
  ['trail', 'Mafate Speed 4', 3], ['trail', 'Speedgoat 5', 2], ['trail', 'Tecton X3', 1], ['trail', 'Zinal 2', 1],
];
function wall() {
  const box = $('#wall'); box.innerHTML = '';
  ['road', 'race', 'trail'].forEach(cat => {
    const col = el('div', { class: 'wall-col wall-' + cat }, box), list = SHOES.filter(s => s[0] === cat);
    el('p', { class: 'wall-k', html: `${t('c6.' + cat)} <b>${list.reduce((a, s) => a + s[2], 0)}</b>` }, col);
    list.forEach(([, m, c]) => {
      const tile = el('div', { class: 'shoe' }, col);
      el('span', { class: 'shoe-n', text: m }, tile);
      el('span', { class: 'shoe-c', html: Array.from({ length: c }, () => '<i></i>').join('') + (c > 1 ? `<em>×${c}</em>` : '') }, tile);
    });
  });
  const ap = el('div', { class: 'wall-apparel' }, box);
  el('p', { class: 'wall-k', html: t('c6.apparel') }, ap); el('span', { html: t('c6.apparelList') }, ap);
}
function lanes() {
  const box = $('#lanes'); box.innerHTML = '';
  const bos = byId[BOSTON].secs / 42.195;
  [['l1', '2:45:00'], ['l2', null], ['l3', '2:40:00'], ['l4', '2:30:00']].forEach(([k, goal], i) => {
    const li = el('li', { class: 'lane' + (k === 'l2' || k === 'l3' ? ' is-hoka' : '') }, box);
    el('span', { class: 'lane-n', text: i + 1 }, li);
    const mid = el('div', { class: 'lane-m' }, li);
    el('span', { class: 'lane-d', text: t(`c7.${k}.d`) }, mid);
    el('span', { class: 'lane-t', text: t(`c7.${k}.t`) }, mid);
    el('span', { class: 'lane-s', text: t(`c7.${k}.s`) }, mid);
    const rt = el('div', { class: 'lane-r' }, li);
    if (goal) {
      const p = toSecs(goal) / 42.195, delta = Math.round(bos - p);
      el('span', { class: 'lane-g', text: (k === 'l3' ? '~' : '') + goal.slice(0, 4) }, rt);
      el('span', { class: 'lane-p', text: `${paceStr(p)}/km · −${delta} s ${t('c7.vs')}` }, rt);
      el('i', { class: 'lane-bar', html: `<i style="--v:${Math.min(1, delta / 26).toFixed(2)}"></i>` }, rt);
    } else el('span', { class: 'lane-g lane-wk', text: LANG === 'fr' ? '16 sem.' : '16 wks' }, rt);
  });
  onReveal(box, () => box.classList.add('is-in'));
}
function strips() {
  $$('.strip').forEach(s => {
    if (s.childElementCount) return;
    s.dataset.photos.split('|').forEach(src => el('img', { src, alt: '', loading: 'lazy' }, el('figure', {}, s)).addEventListener('click', () => lightbox(src)));
  });
  $('.bib img')?.addEventListener('click', e => lightbox(e.target.src));
}
function lightbox(src) { const lb = $('#lightbox'); $('img', lb).src = src; lb.hidden = false; requestAnimationFrame(() => lb.classList.add('on')); }
function closeLightbox() { const lb = $('#lightbox'); lb.classList.remove('on'); setTimeout(() => (lb.hidden = true), 300); }
function video() {
  const fig = $('#hokaVideo'), v = $('video', fig);
  v.addEventListener('loadeddata', () => { fig.hidden = false; onReveal(fig, () => v.play().catch(() => {})); });
  $('.vid-sound', fig).addEventListener('click', e => { v.muted = !v.muted; e.currentTarget.classList.toggle('on', !v.muted); });
}
function footer() {
  const f = $('#footLinks'); f.innerHTML = '';
  el('a', { class: 'btn primary', href: LINKS.strava, target: '_blank', rel: 'noopener', text: t('links.strava') }, f);
  el('a', { class: 'btn', href: LINKS.instagram, target: '_blank', rel: 'noopener', text: 'Instagram · ' + t('links.insta') }, f);
  el('a', { class: 'btn', href: LINKS.article, target: '_blank', rel: 'noopener', text: t('foot.article') }, f);
  el('a', { class: 'btn', href: '#carte', text: t('foot.map') }, f);
}

/* ------------------------------------------------------------------ reveal, compteurs, nav */
const revealCbs = new Map();
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in'); const cb = revealCbs.get(e.target); revealCbs.delete(e.target); io.unobserve(e.target); cb?.();
}), { threshold: 0.2 });
function onReveal(node, cb) { if (node.classList.contains('is-in')) { requestAnimationFrame(cb); return; } revealCbs.set(node, cb); io.observe(node); }
function counters() {
  $$('[data-count]').forEach(n => onReveal(n, () => {
    const to = +n.dataset.count, t0 = performance.now(), dur = 2200;
    const tick = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); n.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(tick); else n.dataset.done = 1; };
    requestAnimationFrame(tick);
  }));
}
function navSpy() {
  const links = $$('.nav a'), tocs = $$('#toc a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const id = e.target.id;
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    tocs.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id], .chapter[id]').forEach(s => spy.observe(s));
}

/* ------------------------------------------------------------------ go */
function renderAll() {
  applyStatic(); buildRail(); journey(); yearsChart(); calendar(); facts(); weeksChart(); builds(); ladder(); mlog(); wall(); lanes(); footer();
  $$('[data-count][data-done]').forEach(n => (n.textContent = fmt(+n.dataset.count)));
}
renderAll(); strips(); video();
initMap();
$('#bostonChip').addEventListener('click', () => openRace(BOSTON));
$$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
$('#lightbox').addEventListener('click', closeLightbox);
addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (!$('#lightbox').hidden) closeLightbox(); else if (current) closeRace(); });
$$('.reveal').forEach(n => io.observe(n));
counters(); navSpy();
