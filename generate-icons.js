const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicIconsDir = path.join(__dirname, 'public', 'icons');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// Crisp, modern SVG icon with glowing 3D isometric inventory cubes
const createSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const contentSize = size - padding * 2;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0b0f19" />
    </linearGradient>

    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>

    <linearGradient id="brandGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>

    <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>

    <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#6366f1" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background container -->
  <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)" />

  <!-- Inner border -->
  ${!isMaskable ? `<rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.22 - 2}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />` : ''}

  <!-- Icon Graphic -->
  <g transform="translate(${padding}, ${padding}) scale(${contentSize / 100})" filter="url(#glow)">
    <!-- Main Isometric Cube / Box -->
    <!-- Top Face -->
    <polygon points="50,15 84,33 50,51 16,33" fill="url(#cubeTop)" />
    <!-- Left Face -->
    <polygon points="16,33 50,51 50,85 16,67" fill="url(#cubeLeft)" />
    <!-- Right Face -->
    <polygon points="50,51 84,33 84,67 50,85" fill="url(#cubeRight)" />

    <!-- Isometric Box Seam & Accent Lines -->
    <line x1="50" y1="51" x2="50" y2="85" stroke="#312e81" stroke-width="1.5" />
    <line x1="50" y1="51" x2="16" y2="33" stroke="#818cf8" stroke-width="1" opacity="0.6" />
    <line x1="50" y1="51" x2="84" y2="33" stroke="#4f46e5" stroke-width="1" opacity="0.8" />

    <!-- Open Top Flap / Ribbon Highlight -->
    <path d="M 50 15 L 68 25 L 50 35 L 32 25 Z" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.4" />

    <!-- Glowing pulse / dot indicating live status -->
    <circle cx="78" cy="22" r="5" fill="#10b981" />
    <circle cx="78" cy="22" r="7" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.6" />
  </g>
</svg>
  `.trim();
};

async function generate() {
  const sizes = [
    { name: 'icon-192x192.png', size: 192, maskable: false },
    { name: 'icon-512x512.png', size: 512, maskable: false },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-16x16.png', size: 16, maskable: false },
  ];

  for (const { name, size, maskable } of sizes) {
    const svg = createSvg(size, maskable);
    const dest = path.join(publicIconsDir, name);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(dest);
    console.log(`Generated ${name}`);
  }

  // Also create favicon.ico in public/
  const favSvg = createSvg(32, false);
  await sharp(Buffer.from(favSvg))
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');

  // Also save SVG master in public/icons/icon.svg
  fs.writeFileSync(path.join(publicIconsDir, 'icon.svg'), createSvg(512, false));
  console.log('Generated icon.svg');
}

generate().catch(console.error);
