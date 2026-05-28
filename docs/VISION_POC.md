# Vision QC PoC

The vision spike lives at `/poc/vision`. It is intentionally isolated from
auth-gated workflows, DaaS persistence, file storage, model training, and lot
records.

## Scope

- Runs in the browser as a client component.
- Loads a user-supplied image into a hidden canvas.
- Samples the center 50% x 50% ROI with `getImageData`.
- Filters obvious tray/background pixels out of the measurement.
- Flags dark foreign-object pixels as a contamination lane.
- Reports basic lighting warnings from the accepted powder pixels.
- Converts averaged sRGB to CIE L*a*b* with `chroma-js`.
- Delegates colour Delta E and pass/reject verdicts to
  `lib/domain/evaluateSample`.
- Produces a final reject if either the colour lane or contamination lane fails.

This is still a rule-based PoC. It does not train a classifier and does not claim
full production-grade visual inspection.

## Verification

Unit tests cover the pure color helpers in `lib/vision/sample-color.ts`.
Playwright covers the browser canvas/upload path with deterministic SVG fixtures:

```bash
pnpm test
pnpm exec playwright test e2e/vision-poc.spec.ts
```

The Playwright config uses port `3100` so it does not collide with another local
Next.js server on `3000`.

## Testing Image Justification

The PoC uses deterministic synthetic fixtures for automated acceptance testing.
This is intentional for Day 1 because the goal is to prove the browser pipeline:

1. image upload,
2. canvas draw,
3. center ROI pixel extraction,
4. sRGB to Lab conversion,
5. powder-only masking and contamination counting,
6. domain-owned Delta E evaluation,
7. pass/reject rendering.

Real photos are still useful for manual demos, but they are not stable enough for
automated tests because lighting, shadows, camera white balance, compression, and
background spill can change the center ROI average. Synthetic solid-color images
keep the test focused on the software pipeline rather than the photography setup.

## Fixture Strategy

`e2e/fixtures/ginger-pass.svg` is a solid color near the Lab reference for
`GINGER_POWDER`, converted back to sRGB with `chroma-js`. The color is
`rgb(199, 161, 109)`, which produces a measured Lab value close enough to the
domain reference to pass.

`e2e/fixtures/blue-reject.svg` is intentionally off-color at
`rgb(80, 110, 180)`. It produces a large Delta E against the ginger reference
and must reject.

`e2e/fixtures/ginger-contaminated.svg` keeps the powder colour near the ginger
reference but adds dark foreign objects near the center ROI. This fixture proves
that the final status can reject from the contamination lane even when colour QC
passes.

The fixtures are SVG instead of photos so the expected center ROI color remains
deterministic across browser runs. They validate the same browser APIs as user
photos because Playwright uploads them through the same file input and the
component reads them through the same `<img>` and `<canvas>` path.

## Manual Demo Image Prompts

Use generated images only for manual presentation screenshots or exploratory
testing. Automated tests should keep using the deterministic fixtures above.

### Pass Sample Prompt

```text
A realistic top-down quality control photo of spray-dried ginger powder spread
evenly on a clean white ceramic tray. The center area of the powder should be a
consistent warm beige ginger color close to sRGB rgb(199,161,109). Soft diffused
studio lighting, neutral white background, minimal shadows, no spoon, no
packaging, no labels, no text, high resolution, color-accurate.
```

### Reject Sample Prompt

```text
A realistic top-down quality control photo of spray-dried ginger powder spread
evenly on a clean white ceramic tray, but the powder is visibly off-color with a
dull gray-blue cast close to sRGB rgb(80,110,180). Soft diffused studio lighting,
neutral white background, minimal shadows, no spoon, no packaging, no labels, no
text, high resolution, color-accurate.
```

## Rule-Based Pre-Processing

The PoC now contains minimal Day 2 robustness:

- **Powder-only mask:** excludes very bright, low-saturation pixels that are
  likely tray or background.
- **Contamination lane:** counts very dark, low-spread pixels as foreign-object
  candidates and rejects when the contaminant ratio exceeds the threshold.
- **Lighting guard:** reports under-lit or over-lit powder averages as warnings.

These rules make the demo more realistic, but they are intentionally simple and
auditable. They should be replaced or augmented by calibrated capture hardware,
white-reference cards, or trained segmentation/detection only if real samples
show the rule-based approach is insufficient.

## Known Limitations

- The PoC has lighting warnings, but no full white-balance correction yet.
- The ROI is fixed to the center 50% x 50%; there is no manual ROI selection yet.
- `product.rgbApprox` is UI preview metadata, not the QC reference itself.
- Delta E and the pass/reject verdict must remain owned by `evaluateSample`.
- The Day 1 demo does not persist images, lots, or QC records to DaaS.
- Contamination detection is a classical CV heuristic, not a trained object
  detector.

## Justification Summary

This test setup is defensible because it separates two concerns:

- Software correctness: deterministic fixtures verify the browser and domain
  evaluation path reliably in CI.
- Real-world capture quality: manual generated or camera photos can demonstrate
  the intended workflow, but should not be used as the only acceptance proof
  until lighting normalization and capture guidance exist.
