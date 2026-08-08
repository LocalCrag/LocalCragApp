// Generates placeholder launcher icon and light/dark splash source images from the
// existing LocalCrag logo (client/src/assets/lc_logo.svg), written into client/assets/.
//
// These are explicit placeholders (D-03) — final brand assets land before a Play
// release. Re-run this script any time the source logo changes:
//   cd client && node scripts/generate-placeholder-assets.mjs
//
// Consumed by `npx @capacitor/assets generate --android`, which turns these five
// source images into the full Android density matrix (mipmap-*, drawable-*,
// drawable-night-*) under client/android/app/src/main/res.

import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const LIGHT_BACKGROUND = "#ffffff";
const DARK_BACKGROUND = "#18181b";

const logoSvg = await readFile("src/assets/lc_logo.svg");
await mkdir("assets", { recursive: true });

async function compose({ out, canvas, background, logoSize }) {
  const base = sharp({
    create: { width: canvas, height: canvas, channels: 4, background },
  });
  if (!logoSize) {
    await base.png().toFile(`assets/${out}`);
    return;
  }
  const logo = await sharp(logoSvg, { density: 512 })
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await base
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(`assets/${out}`);
}

await compose({
  out: "icon-only.png",
  canvas: 1024,
  background: LIGHT_BACKGROUND,
  logoSize: 640,
});

await compose({
  out: "icon-foreground.png",
  canvas: 1024,
  background: { r: 0, g: 0, b: 0, alpha: 0 },
  logoSize: 560,
});

await compose({
  out: "icon-background.png",
  canvas: 1024,
  background: LIGHT_BACKGROUND,
});

await compose({
  out: "splash.png",
  canvas: 2732,
  background: LIGHT_BACKGROUND,
  logoSize: 800,
});

await compose({
  out: "splash-dark.png",
  canvas: 2732,
  // Matches the Aura dark surface painted behind .site-header, so the handoff
  // from splash to first paint has no color jump.
  background: DARK_BACKGROUND,
  logoSize: 800,
});

console.log("Generated placeholder assets in client/assets/");
