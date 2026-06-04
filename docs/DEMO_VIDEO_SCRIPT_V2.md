# Controme — Demo Video Script V2
### CyberHack 2026 · Tim Retas Siber Imut · PT Indo Aneka Atsiri (Sima Arome)

---

> **Target Duration:** Under 3 minutes (2:50–2:58 recommended)
> **Language:** English
> **Audience:** CyberHack 2026 judges and Sima Arome stakeholders
> **Narrator:** One person narrates throughout (off-screen voice-over or on-screen)

---

## PART 0 — PREPARATION BEFORE RECORDING

### App Setup

| Step | Command / Action |
|---|---|
| Start the app | `pnpm dev` → open `http://localhost:3000` |
| Or use live URL | `https://main.dpvw4kb04hrwl.amplifyapp.com` |
| Verify backend is ready | `pnpm daas:readiness` → must print `ready: true` |

### Files to Prepare

Prepare these **before** you hit record. Having them ready avoids live typing and awkward pauses.

| File | Purpose | How to Get It |
|---|---|---|
| `demo-dragon-reject.jpg` | Dragon Fruit powder — off-color (to trigger REJECT) | Any reddish-orange image that looks "oxidized" — even a solid-color PNG works |
| `demo-ginger-pass.jpg` | Ginger powder — warm yellow-brown (to trigger PASS) | Use `e2e/fixtures/ginger-pass.svg` if no real photo available |
| Lot code typed in advance | So you don't type live | Pre-type `LOT-DRG-2026-0531` in a notepad |

### Browser Setup

- Full screen, zoom 100%
- Close all other tabs
- Turn off desktop notifications
- Hide bookmarks bar
- Pre-load `/login` so it is already open when recording starts

---

## PART 1 — SCENE-BY-SCENE FLOW

---

### ▶ SCENE 1 · THE PROBLEM
**Time:** `0:00 – 0:18` (18 seconds)
**Screen:** `/login` — the split-screen login page

On the **left panel** of the login page, the hero image of a QC lab is visible with the tagline:
*"AI-Powered QC & Operations Platform — Objective consistency and automated audit trails for Sima Arome's export quality standards."*

Keep the screen still. No clicking yet.

**NARRATION:**
> *"Sima Arome processes over five hundred natural extract variants — including Dragon Fruit Powder and Ginger Powder for global export. But every quality check still depends on a human eye, a printed colour card, and a spreadsheet. One inconsistent call can cost a shipment. Controme fixes that."*

---

### ▶ SCENE 2 · LOGIN AS QC OPERATOR
**Time:** `0:18 – 0:30` (12 seconds)
**Screen:** `/login` — right panel, sign-in form

**What to point at first:**
The **"Demo quick login"** dropdown near the top of the form. It reads *"Pick a role to sign in."*

**ACTION:**
1. Click the **Demo quick login** dropdown
2. Select **"QC Operator"** (Rudi — the QC lab persona)
3. App auto-fills credentials and logs in immediately
4. Page redirects to `/qc/capture`

**NARRATION:**
> *"Controme uses role-based access. Each user only sees their own workflow. With one click, Rudi — our QC Operator — is in, and he lands directly on the Color Analysis Terminal."*

---

### ▶ SCENE 3 · QC CAPTURE — DRAGON FRUIT REJECT
**Time:** `0:30 – 1:20` (50 seconds)
**Screen:** `/qc/capture` — "Color Analysis Terminal"

This is the **most important scene**. Walk through it clearly and slowly.

**STEP 3a — Select product** `(0:30 – 0:38)`

Click the **"Product Reference"** dropdown → select **"Dragon Fruit Powder"**

**NARRATION:**
> *"Today's lot is Dragon Fruit Powder. This batch has been stored longer than normal — we suspect oxidation."*

---

**STEP 3b — Set stage and lot code** `(0:38 – 0:46)`

- Click **"QC Stage"** dropdown → select **"Finish"**
- Click **"Lot Number"** field → type `LOT-DRG-2026-0531`

**NARRATION:**
> *"We are checking the finished goods. Lot number entered."*

---

**STEP 3c — Upload the photo** `(0:46 – 0:58)`

Click **"Take / Upload Photo"** button → upload `demo-dragon-reject.jpg`

The photo appears in the **Camera Viewfinder** panel on the left.

**NARRATION:**
> *"Rudi places the sample under the standard light box and captures the image. The system analyses it in real time — color difference, contamination, and texture consistency."*

*(Wait ~2–3 seconds for the analysis to complete)*

---

**STEP 3d — Show the REJECT result** `(0:58 – 1:12)`

The right panel — **"2. Analysis Results"** — now shows:

- A large **red REJECT badge** at the top right
- The big **ΔE number** (e.g., `7.43`) in the center
- A **color status badge** reading `reject`
- In the color diagnosis panel: channel flags showing `a* low` (redness dropped)
- The diagnosis text: *"REJECT — out of spec on a*."*

**Point at each element as you narrate.**

**NARRATION:**
> *"Delta E seven point four three — well above the four-point-five threshold for this product. The a-star channel dropped significantly. That is betacyanin degradation — oxidation. Rejected. Automatically. Objectively. No human judgment, no printed colour card."*

---

**STEP 3e — Save the lot** `(1:12 – 1:20)`

Click the **"Save Record & Next Lot"** button at the bottom of the right panel.

A green/red alert banner appears at the bottom:
*"Saved — server verdict: REJECT · ΔE 7.43"*

Then click the **"View lot"** button inside that banner.

**NARRATION:**
> *"One click saves the result. The verdict is recomputed server-side from the photo — the browser preview cannot be manipulated."*

---

### ▶ SCENE 4 · LOT DETAIL + EXPORT
**Time:** `1:20 – 1:45` (25 seconds)
**Screen:** `/qc/lots/[id]` — "QC Lot Detail"

The page opens with a **red header panel** (REJECT) at the top.

**Point at these elements:**

| Element | Location | What it proves |
|---|---|---|
| **REJECT badge** (top right) | Header panel | Clear verdict |
| **Sample photo** | Left column | Photo evidence attached |
| **L\*a\*b\* values + ΔE** | Right "Color diagnosis" panel | Exact measured values |
| **Timestamp + Operator** | "Lot identity" panel | Who, when, what |
| The grey text at top | Below the title | *"Immutable inspection record. Corrections are made by creating a new record, not editing this one."* |

**NARRATION:**
> *"Every check creates a permanent, immutable record. Photo, colour values, Delta E, timestamp, operator — all locked. No one can edit or delete this. Not even an admin."*

**ACTION:** Click **"Export PDF"** button (top right of the page) → PDF file downloads

**NARRATION:**
> *"One click. This is the Certificate of Analysis ready for an international buyer audit — not two hours of spreadsheet hunting."*

---

### ▶ SCENE 5 · PPIC DASHBOARD
**Time:** `1:45 – 2:05` (20 seconds)
**Screen:** `/dashboard/ppic` — "PPIC Dashboard"

**To switch role:** Click logout icon in the sidebar → back to `/login` → Demo quick login → select **"PPIC"** → auto-redirects to `/dashboard/ppic`

**Point at:**

- The **clearance status list** — lots split by: Pending QC · QC-Cleared · Rejected
- The **Dragon Fruit lot** just captured — appearing as **REJECT** in real time
- Other lots showing **QC-Cleared** (green) — ready for production

**NARRATION:**
> *"Anita, the PPIC Supervisor, no longer needs to send a WhatsApp message every morning to know which batches are cleared. The clearance status is live. Production scheduling starts the moment a lot clears — zero delay, zero phone tag."*

---

### ▶ SCENE 6 · MANAGER DASHBOARD + EXPORT CSV
**Time:** `2:05 – 2:40` (35 seconds)
**Screen:** `/dashboard/manager` — "Manager Dashboard"

**To switch role:** Logout → Demo quick login → select **"Manager"** → auto-redirects to `/dashboard/manager`

**Point at (in order):**

1. The **overall pass rate** metric card (e.g., `60.8%`)

   **NARRATION:**
   > *"Sinta, the QC and Operations Manager, sees the full picture at a glance — sixty percent pass rate this period."*

2. The **ΔE trend chart** (colour deviation over time)

   **NARRATION:**
   > *"And the colour deviation trend — she can spot a degrading batch before it becomes a customer complaint."*

3. The **list of REJECT lots** and any **WARNING lots** flagged

   **NARRATION:**
   > *"Every flagged lot is here. No end-of-week email summaries. No hunting through spreadsheets."*

4. **ACTION:** Click **"Export CSV"** → CSV file downloads

   **NARRATION:**
   > *"When a European buyer requests a full lot history for their compliance audit — one click. Every lot, every measurement, every timestamp. Exported instantly."*

---

### ▶ SCENE 7 · ADMIN — PRODUCT REFERENCE VERSIONING
**Time:** `2:40 – 2:55` (15 seconds)
**Screen:** `/admin/products` — "Product References"

**To switch role:** Logout → Demo quick login → select **"Admin"** → navigate via sidebar → **"Product References"**

**Point at:**

- The two products: **Spray-Dried Ginger Powder** and **Dragon Fruit Powder**
- The columns: `ref_l`, `ref_a`, `ref_b`, `delta_e_max`
- The note under the title: *"Admin-only product reference management. Reference changes are versioned by the backend workflow."*

**NARRATION:**
> *"Reference values are managed here — and every change is versioned. If R&D updates the colour standard, all new measurements use the new reference. But every historical record still points to the standard that was in effect at the time. The audit trail never breaks."*

---

### ▶ SCENE 8 · CLOSING
**Time:** `2:55 – 3:00` (5 seconds)
**Screen:** Stay on `/admin/products` or cut to the login hero screen

**NARRATION:**
> *"Controme — objective, immutable, traceable. Built for Sima Arome's export quality standards. Thank you."*

---

## PART 2 — TIMING SUMMARY

| # | Scene | Duration | Screen | Key Action |
|---|---|---|---|---|
| 1 | The Problem | 0:00–0:18 | `/login` (hero) | No click, narrate only |
| 2 | Login as QC Operator | 0:18–0:30 | `/login` → `/qc/capture` | Demo quick login |
| 3a | Select product + lot | 0:30–0:46 | `/qc/capture` | Choose Dragon Fruit, enter lot code |
| 3b | Upload photo | 0:46–0:58 | `/qc/capture` | Upload `demo-dragon-reject.jpg` |
| 3c | Show REJECT result | 0:58–1:12 | `/qc/capture` | Point at ΔE, badges, diagnosis |
| 3d | Save lot | 1:12–1:20 | `/qc/capture` | Save Record, click View lot |
| 4 | Lot Detail + Export PDF | 1:20–1:45 | `/qc/lots/[id]` | Point at record, export PDF |
| 5 | PPIC Dashboard | 1:45–2:05 | `/dashboard/ppic` | Switch role, show clearance status |
| 6 | Manager Dashboard + CSV | 2:05–2:40 | `/dashboard/manager` | Switch role, pass rate, export CSV |
| 7 | Admin Reference | 2:40–2:55 | `/admin/products` | Switch role, show version note |
| 8 | Closing | 2:55–3:00 | Any | Final line |

---

## PART 3 — FULL NARRATION (CONTINUOUS READ-THROUGH)

Use this for rehearsal. Read at a calm, steady pace — approximately **2 words per second**.

> *"Sima Arome processes over five hundred natural extract variants — including Dragon Fruit Powder and Ginger Powder for global export. But every quality check still depends on a human eye, a printed colour card, and a spreadsheet. One inconsistent call can cost a shipment. Controme fixes that.*
>
> *Controme uses role-based access. Each user only sees their own workflow. With one click, Rudi — our QC Operator — is in, and he lands directly on the Color Analysis Terminal.*
>
> *Today's lot is Dragon Fruit Powder. This batch has been stored longer than normal — we suspect oxidation. We are checking the finished goods. Lot number entered.*
>
> *Rudi places the sample under the standard light box and captures the image. The system analyses it in real time — color difference, contamination, and texture consistency.*
>
> *Delta E seven point four three — well above the four-point-five threshold for this product. The a-star channel dropped significantly. That is betacyanin degradation — oxidation. Rejected. Automatically. Objectively. No human judgment, no printed colour card.*
>
> *One click saves the result. The verdict is recomputed server-side from the photo — the browser preview cannot be manipulated.*
>
> *Every check creates a permanent, immutable record. Photo, colour values, Delta E, timestamp, operator — all locked. No one can edit or delete this. Not even an admin. One click. This is the Certificate of Analysis ready for an international buyer audit — not two hours of spreadsheet hunting.*
>
> *Anita, the PPIC Supervisor, no longer needs to send a WhatsApp message every morning to know which batches are cleared. The clearance status is live. Production scheduling starts the moment a lot clears — zero delay, zero phone tag.*
>
> *Sinta, the QC and Operations Manager, sees the full picture at a glance — sixty percent pass rate this period. And the colour deviation trend — she can spot a degrading batch before it becomes a customer complaint. Every flagged lot is here. No end-of-week email summaries. When a European buyer requests a full lot history for their compliance audit — one click. Every lot, every measurement, every timestamp. Exported instantly.*
>
> *Reference values are managed here — and every change is versioned. If R&D updates the colour standard, all new measurements use the new reference. But every historical record still points to the standard that was in effect at the time. The audit trail never breaks.*
>
> *Controme — objective, immutable, traceable. Built for Sima Arome's export quality standards. Thank you."*

---

## PART 4 — RECORDING TIPS

| Situation | What to Do |
|---|---|
| Role switching is slow | Use the **Demo quick login** dropdown — one click, auto-submits, no typing |
| Analysis takes longer than 3s | This is expected — server-side recompute. Actually good to mention |
| No real powder photo available | Use `e2e/fixtures/blue-reject.svg` for a clear REJECT result |
| Login session expires | Refresh the page, use quick-login again |
| Live JSON visible (e.g. health endpoint) | Zoom in on browser before continuing |
| Mistake during recording | Pause, cut, retake the scene — edit together in post |
| Dragon Fruit REJECT not dramatic enough | Pick an image with more blue/orange tones — contrasts against the red-pink reference |

---

## PART 5 — ENTERPRISE READINESS EVIDENCE (Optional, if time allows)

If you have 20 extra seconds, open this in the browser **as admin** and show it briefly:

```
/api/health             → { "status": "ok" }
/api/qc/schema-readiness → { "ready": true }
/api/qc/demo-readiness   → { "data": { "ready": true } }
```

Or run in terminal:

```bash
pnpm daas:readiness
```

**NARRATION (optional add-on):**
> *"The backend includes health checks, schema readiness verification, and an immutable DaaS activity log. All requests go through secure Next.js proxy routes — the browser never calls Supabase or the DaaS backend directly."*

---

*Document: `docs/DEMO_VIDEO_SCRIPT_V2.md` · Controme · CyberHack 2026 · Tim Retas Siber Imut*
