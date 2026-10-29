// Measures label regions in the supplied reference photos (development aid).
import sharp from "sharp";

const load = async (f) => {
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  return { ...info, px };
};
const corners = (img, box, test) => {
  let tl = [0, 0, Infinity], tr = [0, 0, -Infinity], br = [0, 0, -Infinity], bl = [0, 0, Infinity], n = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let y = box[1]; y < box[3]; y++) for (let x = box[0]; x < box[2]; x++) {
    if (!test(img.px(x, y))) continue;
    n++;
    if (x + y < tl[2]) tl = [x, y, x + y];
    if (x - y > tr[2]) tr = [x, y, x - y];
    if (x + y > br[2]) br = [x, y, x + y];
    if (x - y < bl[2]) bl = [x, y, x - y];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { n, tl: tl.slice(0, 2), tr: tr.slice(0, 2), br: br.slice(0, 2), bl: bl.slice(0, 2), bbox: [minX, minY, maxX, maxY] };
};

const dir = "public/media";
const pe = await load(`${dir}/bottle/Gamber Valley Amber Whisky Decanter.png`);
const vault = await load(`${dir}/bottle/Gamber Valley Whisky Bottle Cutout.png`);
const emblem = await load(`${dir}/brand/Gamber Valley Golden Emblem.png`);

const green = ([r, g, b, a]) => a > 200 && g > r + 12 && g > 40 && g < 140 && b < g + 10 && r < 90;
const gold = ([r, g, b, a]) => a > 200 && r > 170 && g > 120 && b < 120 && r > b + 80;
const pink = ([r, g, b, a]) => a > 200 && r > 205 && g > 170 && b > 165 && r - g < 60;

console.log("PE label (green)", corners(pe, [200, 700, 1000, 1150], green));
console.log("PE neck band (gold)", corners(pe, [480, 240, 800, 460], gold));
console.log("PE emblem (gold)", corners(pe, [380, 540, 760, 800], gold));
console.log("Vault label (pink)", corners(vault, [330, 700, 700, 1340], pink));
console.log("Vault capsule (pink)", corners(vault, [380, 10, 650, 300], pink));
console.log("Vault emblem (gold)", corners(vault, [380, 580, 650, 800], gold));

// Emblem: find the transparent gap between the mark and the tagline beneath it.
const rows = [];
for (let y = 0; y < emblem.height; y++) { let c = 0; for (let x = 0; x < emblem.width; x += 2) if (emblem.px(x, y)[3] > 40) c++; rows.push(c); }
const gaps = []; let start = -1;
rows.forEach((c, y) => { if (c < 3 && start < 0) start = y; if (c >= 3 && start >= 0) { if (y - start > 8) gaps.push([start, y]); start = -1; } });
console.log("Emblem row gaps", gaps);

// Vault silhouette half-widths every 20px (profile for the 3D model).
const prof = [];
for (let y = 15; y <= 1510; y += 15) { let l = -1, r = -1; for (let x = 0; x < vault.width; x++) if (vault.px(x, y)[3] > 128) { if (l < 0) l = x; r = x; } prof.push([y, l < 0 ? 0 : (r - l) / 2, l < 0 ? 0 : (r + l) / 2]); }
console.log("Vault profile [y, halfWidth, centre]", JSON.stringify(prof));
