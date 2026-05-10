#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'frontend/public/images/trip-defaults');
const WIDTH = 1600;
const HEIGHT = 900;

const locations = [
  ['new-york-city', 'skyline', ['#203a43', '#2c5364', '#f7b267']],
  ['la-hollywood', 'palms', ['#1c3144', '#f2a65a', '#f76f53']],
  ['hawaii', 'beach', ['#0b3954', '#087e8b', '#ffd166']],
  ['mexico-city', 'city', ['#293241', '#ee6c4d', '#f4d35e']],
  ['canada-niagara-falls', 'waterfall', ['#153243', '#2b7a78', '#dff6f0']],
  ['france', 'eiffel', ['#1d3557', '#457b9d', '#f1faee']],
  ['italy', 'coast', ['#264653', '#2a9d8f', '#e9c46a']],
  ['bali', 'temple', ['#12372a', '#3a7d44', '#f7d794']],
  ['vietnam', 'bay', ['#16302b', '#2d6a4f', '#b7e4c7']],
  ['singapore', 'modern', ['#0b132b', '#3a506b', '#5bc0be']],
  ['china', 'great-wall', ['#2b2d42', '#8d0801', '#f4d58d']],
  ['japan', 'torii', ['#1b263b', '#c1121f', '#fdf0d5']],
  ['south-korea', 'seoul', ['#14213d', '#5e60ce', '#ffd60a']],
  ['australia', 'opera', ['#073b4c', '#118ab2', '#ffd166']],
  ['new-zealand', 'mountains', ['#1b4332', '#40916c', '#d8f3dc']],
  ['spain', 'plaza', ['#3d405b', '#e07a5f', '#f2cc8f']],
  ['turkey', 'mosque', ['#1d3557', '#e63946', '#ffb703']],
  ['uk', 'bridge', ['#233d4d', '#619b8a', '#fe7f2d']],
  ['germany', 'old-town', ['#2f3e46', '#52796f', '#cad2c5']],
  ['greece', 'islands', ['#005f73', '#0a9396', '#e9d8a6']],
  ['morocco', 'desert-arch', ['#432818', '#bb9457', '#ffe6a7']],
  ['egypt', 'pyramids', ['#3a2e39', '#c9ada7', '#f2e9e4']],
  ['brazil', 'rio', ['#003049', '#2a9d8f', '#ffb703']],
  ['jamaica', 'tropical', ['#073b3a', '#0b6e4f', '#f4d35e']],
  ['thailand', 'temple', ['#1b4332', '#f77f00', '#fcbf49']],
  ['dubai', 'tower', ['#03045e', '#0077b6', '#ffd166']],
  ['las-vegas', 'neon', ['#240046', '#ff006e', '#ffbe0b']],
];

const themes = [
  ['cruise', 'ship', ['#023047', '#219ebc', '#ffb703']],
  ['beach', 'beach', ['#006d77', '#83c5be', '#ffd166']],
  ['skiing', 'ski', ['#1d3557', '#a8dadc', '#f1faee']],
  ['lush-green-jungle', 'jungle', ['#081c15', '#1b4332', '#95d5b2']],
  ['mountain-region', 'mountains', ['#283618', '#606c38', '#dda15e']],
  ['cityscape', 'skyline', ['#111827', '#374151', '#f59e0b']],
  ['scuba-diving', 'scuba', ['#001219', '#005f73', '#94d2bd']],
  ['wintry-tundra', 'tundra', ['#0d1b2a', '#778da9', '#e0e1dd']],
  ['cultural-tourism', 'museum', ['#3c096c', '#9d4edd', '#ffba08']],
  ['wildlife-tourism', 'wildlife', ['#283618', '#606c38', '#fefae0']],
  ['shopping-tourism', 'shopping', ['#2b2d42', '#ef476f', '#ffd166']],
  ['concert-event', 'concert', ['#10002b', '#7b2cbf', '#ff7900']],
  ['road-trip', 'road', ['#22333b', '#eae0d5', '#c6ac8f']],
  ['yoga-retreat', 'yoga', ['#264653', '#2a9d8f', '#e9c46a']],
  ['landscape-tourism', 'landscape', ['#1b4332', '#52b788', '#fefae0']],
  ['hiking', 'hiking', ['#132a13', '#31572c', '#ecf39e']],
  ['camping', 'camping', ['#1f2937', '#d97706', '#fde68a']],
];

function esc(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function polygon(points, fill, opacity = 1) {
  return `<polygon points="${points}" fill="${fill}" opacity="${opacity}"/>`;
}

function circles(fill) {
  return Array.from({ length: 18 }, (_, i) => {
    const x = 80 + i * 92;
    const y = 80 + ((i * 53) % 240);
    const r = 28 + ((i * 13) % 68);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.08"/>`;
  }).join('');
}

function motif(type, colors) {
  const dark = 'rgba(8, 24, 31, 0.72)';
  const light = 'rgba(255, 255, 255, 0.72)';
  const accent = colors[2];
  const mid = colors[1];

  const skyline = () => `
    <g transform="translate(0 0)" fill="${dark}">
      ${Array.from({ length: 22 }, (_, i) => {
        const w = 45 + ((i * 17) % 45);
        const h = 150 + ((i * 41) % 260);
        const x = i * 78;
        const y = 760 - h;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`;
      }).join('')}
      <rect x="0" y="760" width="${WIDTH}" height="160"/>
    </g>`;

  const mountains = () => `
    ${polygon('0,790 360,330 690,790', dark, 0.78)}
    ${polygon('420,790 880,260 1280,790', dark, 0.7)}
    ${polygon('900,790 1260,390 1600,790', dark, 0.64)}
    ${polygon('360,330 430,430 298,430', light, 0.55)}
    ${polygon('880,260 978,420 792,420', light, 0.52)}`;

  const beach = () => `
    <path d="M0 620 C260 540 460 690 760 610 C1060 530 1260 650 1600 560 L1600 900 L0 900 Z" fill="${accent}" opacity="0.75"/>
    <path d="M0 590 C300 500 530 650 820 570 C1100 495 1320 610 1600 535" stroke="${light}" stroke-width="18" fill="none" opacity="0.55"/>
    <circle cx="1250" cy="210" r="90" fill="${accent}" opacity="0.85"/>`;

  const temple = () => `
    <path d="M570 620 L800 360 L1030 620 Z" fill="${dark}"/>
    <rect x="610" y="620" width="380" height="145" rx="8" fill="${dark}"/>
    <path d="M510 620 Q800 500 1090 620" stroke="${accent}" stroke-width="34" fill="none" opacity="0.82"/>
    <rect x="750" y="520" width="100" height="245" fill="rgba(255,255,255,0.22)"/>`;

  const water = () => `
    <rect x="0" y="610" width="${WIDTH}" height="290" fill="${dark}" opacity="0.45"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 210 - 60} ${650 + i % 3 * 46} C${i * 210 + 35} ${610 + i % 3 * 46} ${i * 210 + 140} ${710 + i % 3 * 46} ${i * 210 + 250} ${650 + i % 3 * 46}" stroke="${light}" stroke-width="12" fill="none" opacity="0.35"/>`).join('')}`;

  const tower = () => `
    <path d="M790 180 C820 390 865 595 940 780 L660 780 C735 595 780 390 790 180 Z" fill="${dark}" opacity="0.78"/>
    <path d="M792 175 L825 780" stroke="${light}" stroke-width="10" opacity="0.35"/>
    <circle cx="790" cy="155" r="28" fill="${accent}"/>`;

  const bridge = () => `
    <rect x="150" y="610" width="1300" height="42" fill="${dark}"/>
    <path d="M230 610 C390 390 560 390 720 610 M880 610 C1040 390 1210 390 1370 610" stroke="${dark}" stroke-width="46" fill="none"/>
    <rect x="335" y="360" width="70" height="420" fill="${dark}"/>
    <rect x="1195" y="360" width="70" height="420" fill="${dark}"/>`;

  const special = {
    skyline,
    city: skyline,
    modern: skyline,
    seoul: skyline,
    neon: skyline,
    palms: () => `${beach()}<path d="M360 740 C390 570 410 420 392 270" stroke="${dark}" stroke-width="28" fill="none"/><path d="M392 282 C290 245 245 198 220 130 M392 282 C490 220 538 165 570 95 M392 282 C330 178 318 118 332 58 M392 282 C480 306 565 300 645 268" stroke="${dark}" stroke-width="28" stroke-linecap="round" fill="none"/>`,
    beach,
    coast: beach,
    tropical: beach,
    waterfall: () => `<path d="M560 170 L1040 170 L950 830 L650 830 Z" fill="${light}" opacity="0.55"/><path d="M0 720 C310 620 520 760 800 680 C1080 600 1300 720 1600 650 L1600 900 L0 900 Z" fill="${dark}" opacity="0.5"/>`,
    eiffel: tower,
    tower,
    'great-wall': () => `${mountains()}<path d="M0 690 C230 590 410 720 610 620 C840 505 1030 655 1240 555 C1390 485 1500 520 1600 470" stroke="${accent}" stroke-width="56" fill="none" opacity="0.9"/>`,
    torii: () => `<rect x="520" y="330" width="72" height="430" fill="${dark}"/><rect x="1008" y="330" width="72" height="430" fill="${dark}"/><rect x="430" y="300" width="740" height="70" rx="16" fill="${accent}"/><rect x="500" y="245" width="600" height="54" rx="16" fill="${accent}"/><circle cx="800" cy="190" r="95" fill="${light}" opacity="0.42"/>`,
    opera: () => `<path d="M440 700 C560 360 710 330 840 700 Z" fill="${light}" opacity="0.78"/><path d="M690 700 C815 300 1010 330 1160 700 Z" fill="${light}" opacity="0.7"/><path d="M260 740 C610 650 980 650 1360 740" stroke="${dark}" stroke-width="42" fill="none"/>`,
    plaza: () => skyline(),
    mosque: () => `<circle cx="800" cy="405" r="180" fill="${dark}"/><rect x="560" y="405" width="480" height="320" fill="${dark}"/><rect x="410" y="340" width="58" height="420" fill="${dark}"/><rect x="1132" y="340" width="58" height="420" fill="${dark}"/><circle cx="410" cy="315" r="34" fill="${accent}"/><circle cx="1190" cy="315" r="34" fill="${accent}"/>`,
    'old-town': skyline,
    islands: beach,
    'desert-arch': () => `<path d="M0 710 C260 590 510 760 800 650 C1100 540 1340 690 1600 585 L1600 900 L0 900 Z" fill="${accent}" opacity="0.72"/><path d="M520 760 L520 520 Q800 250 1080 520 L1080 760 L960 760 L960 560 Q800 410 640 560 L640 760 Z" fill="${dark}" opacity="0.74"/>`,
    pyramids: () => `<path d="M220 760 L610 320 L990 760 Z" fill="${accent}" opacity="0.9"/><path d="M760 760 L1065 430 L1360 760 Z" fill="${dark}" opacity="0.62"/><path d="M610 320 L760 760 L990 760 Z" fill="rgba(0,0,0,0.16)"/>`,
    rio: () => `${beach()}<path d="M760 270 L760 570 M620 390 L900 390" stroke="${dark}" stroke-width="42" stroke-linecap="round"/><circle cx="760" cy="232" r="44" fill="${dark}"/>`,
    bay: water,
    ship: () => `${water()}<path d="M430 555 L1160 555 L1020 735 L560 735 Z" fill="${dark}"/><rect x="630" y="420" width="320" height="135" rx="10" fill="${light}" opacity="0.55"/>`,
    ski: mountains,
    jungle: () => `${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 110} 850 C${i * 110 + 35} 620 ${i * 110 + 40} 430 ${i * 110 + 90} 230" stroke="${dark}" stroke-width="26" fill="none"/><circle cx="${i * 110 + 95}" cy="${230 + (i * 31) % 180}" r="${85 + (i * 11) % 55}" fill="${mid}" opacity="0.55"/>`).join('')}`,
    scuba: () => `${water()}<circle cx="760" cy="430" r="74" fill="${light}" opacity="0.62"/><path d="M640 520 C760 455 880 455 1000 520" stroke="${light}" stroke-width="32" fill="none" opacity="0.6"/>`,
    tundra: mountains,
    museum: () => `<rect x="410" y="410" width="780" height="330" fill="${dark}" opacity="0.78"/><polygon points="350,410 800,220 1250,410" fill="${accent}" opacity="0.9"/><rect x="500" y="480" width="80" height="260" fill="${light}" opacity="0.38"/><rect x="760" y="480" width="80" height="260" fill="${light}" opacity="0.38"/><rect x="1020" y="480" width="80" height="260" fill="${light}" opacity="0.38"/>`,
    wildlife: () => `${mountains()}<circle cx="820" cy="580" r="110" fill="${dark}"/><rect x="715" y="660" width="210" height="80" rx="40" fill="${dark}"/>`,
    shopping: () => skyline(),
    concert: () => `<path d="M0 800 L520 390 L650 800 Z" fill="${dark}" opacity="0.55"/><path d="M1600 800 L1080 390 L950 800 Z" fill="${dark}" opacity="0.55"/><circle cx="800" cy="500" r="170" fill="${accent}" opacity="0.75"/>`,
    road: () => `${mountains()}<path d="M680 900 L790 520 L850 520 L990 900 Z" fill="${dark}" opacity="0.82"/><path d="M820 580 L835 650 M850 720 L872 815" stroke="${light}" stroke-width="12"/>`,
    yoga: () => `${beach()}<circle cx="800" cy="440" r="56" fill="${dark}"/><path d="M680 660 Q800 520 920 660 M800 500 L800 680" stroke="${dark}" stroke-width="34" stroke-linecap="round" fill="none"/>`,
    landscape: mountains,
    hiking: mountains,
    camping: () => `${mountains()}<path d="M610 760 L800 470 L990 760 Z" fill="${accent}" opacity="0.86"/><path d="M800 470 L800 760" stroke="${dark}" stroke-width="16"/>`,
  };

  return (special[type] || skyline)();
}

function svgFor(slug, type, colors) {
  const [c1, c2, c3] = colors;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${esc(c1)}"/>
          <stop offset="0.58" stop-color="${esc(c2)}"/>
          <stop offset="1" stop-color="${esc(c3)}"/>
        </linearGradient>
        <radialGradient id="glow" cx="74%" cy="24%" r="52%">
          <stop offset="0" stop-color="#fff7d6" stop-opacity="0.58"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer>
        </filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
      ${circles('#ffffff')}
      ${motif(type, colors)}
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#000" opacity="0.08"/>
      <rect width="${WIDTH}" height="${HEIGHT}" filter="url(#grain)" opacity="0.32"/>
    </svg>`;
}

async function renderSet(kind, items) {
  const dir = path.join(OUT_ROOT, kind);
  await fs.mkdir(dir, { recursive: true });

  for (const [slug, type, colors] of items) {
    const pngOut = path.join(dir, `${slug}.png`);
    const svgOut = path.join(dir, `${slug}.svg`);
    try {
      await fs.access(pngOut);
      continue;
    } catch {
      // Generate missing assets only. AI/photo outputs copied in earlier stay intact.
    }

    await fs.writeFile(svgOut, svgFor(slug, type, colors));
  }
}

async function main() {
  await renderSet('locations', locations);
  await renderSet('themes', themes);

  const manifest = {
    basePath: '/images/trip-defaults',
    locations: Object.fromEntries(await Promise.all(locations.map(async ([slug]) => {
      const pngPath = path.join(OUT_ROOT, 'locations', `${slug}.png`);
      try {
        await fs.access(pngPath);
        return [slug, `/images/trip-defaults/locations/${slug}.png`];
      } catch {
        return [slug, `/images/trip-defaults/locations/${slug}.svg`];
      }
    }))),
    themes: Object.fromEntries(await Promise.all(themes.map(async ([slug]) => {
      const pngPath = path.join(OUT_ROOT, 'themes', `${slug}.png`);
      try {
        await fs.access(pngPath);
        return [slug, `/images/trip-defaults/themes/${slug}.png`];
      } catch {
        return [slug, `/images/trip-defaults/themes/${slug}.svg`];
      }
    }))),
  };

  await fs.writeFile(
    path.join(OUT_ROOT, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
