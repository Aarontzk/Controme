# Vision QC

The **production** capture flow is auth-gated at `/qc/capture` with an immutable
history at `/qc/lots`. The original browser-only **spike** still lives at
`/poc/vision` for quick experimentation.

## Production architecture (`/qc/capture`)

- Auth-gated under the `(authenticated)` route group; products are fetched from
  the DaaS `products` collection (permission-gated by the operator's JWT).
- The browser shows an **advisory** preview (same `lib/vision` code).
- On **Save QC lot**, the photo + `productId` are posted to `POST /api/qc/lots`,
  which is **server-authoritative**: it decodes the photo with `sharp`
  (EXIF auto-orientation, downscale to ≤1024px), applies full-frame gray-world
  white balance, samples the same center ROI, then recomputes ΔE + contamination
  + consistency via `lib/vision/image-pipeline.server.ts` and
  `lib/domain/evaluateSample`. A tampered client request cannot forge a verdict.
- The photo is uploaded to DaaS Files and an **immutable** `qc_lots` record is
  created (create + read only via RBAC). DaaS `daas_activity` provides the audit
  trail automatically — no custom audit table.
- Uploads are validated at the boundary with zod (`lib/vision/validation.ts`):
  image MIME type and an 8 MB size cap.

## Spike scope (`/poc/vision`)

The spike is intentionally isolated from auth, DaaS persistence, and file
storage — it is browser-only and advisory.

## Scope

- Runs in the browser as a client component.
- Loads a user-supplied image into a hidden canvas.
- Samples the center 50% x 50% ROI with `getImageData`.
- Filters obvious tray/background pixels out of the measurement.
- Flags dark foreign-object pixels as a contamination lane.
- Checks powder texture consistency with brightness variance and local contrast
  over powder pixels.
- Reports basic lighting warnings from the accepted powder pixels.
- Allows temporary session calibration from a known-good sample under the same
  lighting setup.
- Converts averaged sRGB to CIE L*a*b* with `chroma-js`.
- Delegates colour Delta E and pass/reject verdicts to
  `lib/domain/evaluateSample`.
- Produces a final reject if the colour, contamination, or consistency lane
  fails.

This is still a rule-based PoC. It does not train a classifier and does not claim
full production-grade visual inspection.

## Verification

Unit tests cover the pure color helpers in `lib/vision/sample-color.ts`.
Playwright covers the browser canvas/upload path with deterministic SVG fixtures
and downscaled PNG fixtures from generated tray photos:

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
6. texture/consistency variance checks,
7. domain-owned Delta E evaluation,
8. pass/reject rendering.

The SVG fixtures keep the color/math expectations deterministic. The PNG
fixtures prove that the same browser path can handle photo-style tray inputs
with realistic texture, shadows, and compression.

## Fixture Strategy

`e2e/fixtures/ginger-pass.svg` is a solid color near the Lab reference for
`GINGER_POWDER`, converted back to sRGB with `chroma-js`. The color is
`rgb(207, 162, 102)`, which produces a measured Lab value close enough to the
domain reference to pass.

`e2e/fixtures/blue-reject.svg` is intentionally off-color at
`rgb(80, 110, 180)`. It produces a large Delta E against the ginger reference
and must reject.

`e2e/fixtures/ginger-contaminated.svg` keeps the powder colour near the ginger
reference but adds dark foreign objects near the center ROI. This fixture proves
that the final status can reject from the contamination lane even when colour QC
passes.

`e2e/fixtures/ginger-clumpy.svg` keeps the product broadly ginger-coloured but
mixes darker and lighter powder patches in the center ROI. This fixture proves
that uneven texture or clumping can reject through the consistency lane.

`e2e/fixtures/ginger-near-reference.svg` represents a generated or camera sample
that is close to ginger but shifted by lighting. It first rejects against the
stored Lab reference, then passes after the operator uses it as a temporary
session reference for the current capture setup.

The photo-style fixtures cover four generated tray inputs:

- `ginger-photo-smooth-pass.png`: smooth ginger powder, expected pass.
- `ginger-photo-bright-pass.png`: brighter ginger powder, expected pass.
- `ginger-photo-blue-reject.png`: blue-gray powder, expected colour reject.
- `ginger-photo-rough-texture-reject.png`: ginger-coloured but rough powder,
  expected consistency reject.

All fixtures validate the same browser APIs as user photos because Playwright
uploads them through the same file input and the component reads them through
the same `<img>` and `<canvas>` path.

## Manual Demo Image Prompts

Use generated images only for manual presentation screenshots or exploratory
testing. Automated tests should keep using the deterministic fixtures above.

### Pass Sample Prompt

```text
A realistic top-down quality control photo of spray-dried ginger powder spread
evenly on a clean white ceramic tray. The center area of the powder should be a
consistent warm beige ginger color close to sRGB rgb(207,162,102). Soft diffused
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
- **Consistency lane:** computes brightness standard deviation and adjacent
  pixel local contrast across powder pixels, then rejects when the powder
  texture is too uneven.
- **Lighting guard:** reports under-lit or over-lit powder averages as warnings.
- **Session calibration:** lets the operator set the current measured Lab as a
  temporary browser-only reference for the selected product. This is useful for
  demos and lighting setup checks, but it is not persisted and does not replace
  product master data.

These rules make the demo more realistic, but they are intentionally simple and
auditable. They should be replaced or augmented by calibrated capture hardware,
white-reference cards, or trained segmentation/detection only if real samples
show the rule-based approach is insufficient.

## Known Limitations

- White balance is full-frame gray-world (assumes the tray/background averages
  neutral). It is not a true white-reference-card correction, so a tightly
  cropped, fully coloured frame can still be over/under-corrected.
- The ROI is fixed to the center 50% x 50%; there is no manual ROI selection yet.
- `product.rgbApprox` is UI preview metadata, not the QC reference itself.
- Delta E and the pass/reject verdict are owned by `evaluateSample`, recomputed
  server-side — the client preview is advisory.
- Contamination detection is a classical CV heuristic, not a trained object
  detector.
- Texture detection is a simple variance/local-contrast heuristic, not
  particle-size analysis or a trained consistency model.

## Justification Summary

This test setup is defensible because it separates two concerns:

- Software correctness: deterministic fixtures verify the browser and domain
  evaluation path reliably in CI.
- Real-world capture quality: manual generated or camera photos can demonstrate
  the intended workflow, but should not be used as the only acceptance proof
  until lighting normalization and capture guidance exist.
