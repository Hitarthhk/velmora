// Optimize the transparent copies of the supplied Velmora identity artwork.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/media/identity', { recursive: true });
const logo = await sharp('.source-assets/velmora/logo.png').trim({ threshold: 5 }).toBuffer();
const symbol = await sharp('.source-assets/velmora/symbol.png').trim({ threshold: 5 }).toBuffer();
await Promise.all([
  sharp(logo).resize({ width: 1024 }).png().toFile('public/media/identity/velmora-logo.png'),
  sharp(logo).resize({ width: 640 }).webp({ quality: 94, alphaQuality: 100 }).toFile('public/media/identity/velmora-logo.webp'),
  sharp(logo).resize({ width: 320 }).webp({ quality: 94, alphaQuality: 100 }).toFile('public/media/identity/velmora-logo-small.webp'),
  sharp(symbol).resize(384, 384, { fit: 'contain', background: '#00000000' }).webp({ quality: 94, alphaQuality: 100 }).toFile('public/media/identity/velmora-symbol.webp'),
  sharp(symbol).resize(256, 256, { fit: 'contain', background: '#00000000' }).png().toFile('src/app/icon.png'),
  sharp(symbol).resize(180, 180, { fit: 'contain', background: '#00000000' }).png().toFile('src/app/apple-icon.png'),
]);
console.log('Velmora wordmark, symbol and browser icons prepared.');
