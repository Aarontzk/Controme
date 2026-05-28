import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { evaluateSample, GINGER_POWDER } from "@/lib/domain";

import { analyzeSampleImage } from "./image-pipeline.server";

async function solidImage(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({
    create: { width: 240, height: 240, channels: 3, background: { r, g, b } },
  })
    .png()
    .toBuffer();
}

describe("analyzeSampleImage", () => {
  it("measures a ginger-coloured sample as a colour pass", async () => {
    const buffer = await solidImage(207, 162, 102);
    const result = await analyzeSampleImage(buffer, { whiteBalance: false });
    const verdict = evaluateSample(GINGER_POWDER, result.lab);

    expect(result.imageWidth).toBe(240);
    expect(result.imageHeight).toBe(240);
    expect(verdict.status).toBe("pass");
  });

  it("measures an off-colour blue sample as a colour reject", async () => {
    const buffer = await solidImage(80, 110, 180);
    const result = await analyzeSampleImage(buffer, { whiteBalance: false });
    const verdict = evaluateSample(GINGER_POWDER, result.lab);

    expect(verdict.status).toBe("reject");
  });

  it("rejects a small foreign object even when the powder colour is fine", async () => {
    const stone = await sharp({
      create: { width: 26, height: 26, channels: 3, background: { r: 40, g: 40, b: 46 } },
    })
      .png()
      .toBuffer();
    const buffer = await sharp({
      create: { width: 600, height: 400, channels: 3, background: { r: 207, g: 162, b: 102 } },
    })
      .composite([{ input: stone, gravity: "center" }])
      .png()
      .toBuffer();

    const result = await analyzeSampleImage(buffer, { whiteBalance: false });

    // Colour of the powder itself is fine...
    expect(evaluateSample(GINGER_POWDER, result.lab).status).toBe("pass");
    // ...but the foreign object trips the contamination blob lane despite a tiny global ratio.
    expect(result.analysis.contamination.status).toBe("reject");
    expect(result.analysis.contamination.largestBlob).toBeGreaterThan(24);
    expect(result.analysis.metrics.contaminantRatio).toBeLessThan(0.025);
  });

  it("downscales oversized images below the dimension cap", async () => {
    const big = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: { r: 207, g: 162, b: 102 } },
    })
      .png()
      .toBuffer();
    const result = await analyzeSampleImage(big, { whiteBalance: false });
    expect(Math.max(result.imageWidth, result.imageHeight)).toBeLessThanOrEqual(1024);
  });
});
