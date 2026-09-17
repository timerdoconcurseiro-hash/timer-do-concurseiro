import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SOURCE = path.resolve("docs/IMG-20260917-WA0000.jpg");
const ICONS_DIR = path.resolve("public/icons");
const APP_DIR = path.resolve("app");

const sizes = [192, 256, 384, 512];

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  for (const size of sizes) {
    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}.png`));
    console.log(`gerado public/icons/icon-${size}.png`);
  }

  // Maskable: mesma arte, o fundo solido da logo ja cobre a safe zone recomendada.
  await sharp(SOURCE)
    .resize(512, 512)
    .png()
    .toFile(path.join(ICONS_DIR, "icon-maskable-512.png"));
  console.log("gerado public/icons/icon-maskable-512.png");

  // Favicon (convencao de arquivo do Next.js App Router)
  await sharp(SOURCE)
    .resize(256, 256)
    .png()
    .toFile(path.join(APP_DIR, "icon.png"));
  console.log("gerado app/icon.png");

  // Apple touch icon
  await sharp(SOURCE)
    .resize(180, 180)
    .png()
    .toFile(path.join(APP_DIR, "apple-icon.png"));
  console.log("gerado app/apple-icon.png");

  // Logo para uso na UI (header, splash, home)
  await sharp(SOURCE)
    .resize(512, 512)
    .png()
    .toFile(path.join(path.resolve("public"), "logo.png"));
  console.log("gerado public/logo.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
