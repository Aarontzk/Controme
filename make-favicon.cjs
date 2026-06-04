const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const SOURCE = path.join("assets", "contromefavicon.png");
const OUTPUTS = [
  {
    file: path.join("app", "icon.png"),
    size: 512,
    contentRatio: 0.76,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  },
  {
    file: path.join("app", "apple-icon.png"),
    size: 180,
    contentRatio: 0.76,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  }
];

function componentBounds(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let largest = null;

  for (let startY = 0; startY < height; startY++) {
    for (let startX = 0; startX < width; startX++) {
      const startIndex = startY * width + startX;
      if (seen[startIndex]) continue;

      seen[startIndex] = 1;
      if (data[startIndex * 4 + 3] <= 8) continue;

      let head = 0;
      let tail = 0;
      let count = 0;
      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;

      queueX[tail] = startX;
      queueY[tail] = startY;
      tail += 1;

      while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head += 1;
        count += 1;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        for (const [nextX, nextY] of [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1]
        ]) {
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;
          if (seen[nextIndex]) continue;

          seen[nextIndex] = 1;
          if (data[nextIndex * 4 + 3] > 8) {
            queueX[tail] = nextX;
            queueY[tail] = nextY;
            tail += 1;
          }
        }
      }

      if (!largest || count > largest.count) {
        largest = { count, minX, minY, maxX, maxY };
      }
    }
  }

  if (!largest) throw new Error(`No visible pixels found in ${SOURCE}`);
  return largest;
}

async function main() {
  const sourceBuffer = await fs.readFile(SOURCE);
  const { data, info } = await sharp(sourceBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bounds = componentBounds(data, info.width, info.height);
  const cropped = sharp(sourceBuffer).extract({
    left: bounds.minX,
    top: bounds.minY,
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1
  });

  for (const output of OUTPUTS) {
    const contentSize = Math.round(output.size * output.contentRatio);
    const mark = await cropped
      .clone()
      .resize(contentSize, contentSize, {
        fit: "inside",
        withoutEnlargement: false
      })
      .png()
      .toBuffer({ resolveWithObject: true });

    const canvas = sharp({
      create: {
        width: output.size,
        height: output.size,
        channels: 4,
        background: output.background
      }
    })
      .composite([
        {
          input: mark.data,
          left: Math.floor((output.size - mark.info.width) / 2),
          top: Math.floor((output.size - mark.info.height) / 2)
        }
      ]);

    if (output.background.alpha === 1) {
      canvas.flatten({ background: output.background });
    }

    await canvas.png().toFile(output.file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
