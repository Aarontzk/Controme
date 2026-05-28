# Vision Color QC PoC

The Day 1 vision spike lives at `/poc/vision`. It is intentionally isolated from
auth-gated workflows, DaaS persistence, file storage, and lot records.

## Scope

- Runs in the browser as a client component.
- Loads a user-supplied image into a hidden canvas.
- Samples the center 50% x 50% ROI with `getImageData`.
- Converts averaged sRGB to CIE L*a*b* with `chroma-js`.
- Delegates Delta E and pass/reject verdicts to `lib/domain/evaluateSample`.

## Verification

Unit tests cover the pure color helpers in `lib/vision/sample-color.ts`.
Playwright covers the browser canvas/upload path with deterministic SVG fixtures:

```bash
pnpm test
pnpm exec playwright test e2e/vision-poc.spec.ts
```

The Playwright config uses port `3100` so it does not collide with another local
Next.js server on `3000`.
