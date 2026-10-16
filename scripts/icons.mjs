import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/icons", { recursive: true });
const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#305b49"/><circle cx="256" cy="256" r="142" fill="none" stroke="#f5f4ee" stroke-width="16"/><circle cx="256" cy="256" r="58" fill="#f5f4ee"/></svg>',
);
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["maskable-512", 512],
  ["apple-touch", 180],
])
  await sharp(svg).resize(size, size).png().toFile(`public/icons/${name}.png`);
await mkdir("src-tauri/icons", { recursive: true });
await sharp(svg).resize(512, 512).png().toFile("src-tauri/icons/icon.png");
const png = await sharp(svg).resize(256, 256).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
const { writeFile } = await import("node:fs/promises");
await writeFile("src-tauri/icons/icon.ico", Buffer.concat([header, png]));
