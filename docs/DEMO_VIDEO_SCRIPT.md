# Controme Demo Video Script

Target duration: under 3 minutes  
Language: English  
Audience: CyberHack judges and Sima Arome stakeholders

## Demo Objective

Show that Controme is an enterprise-ready quality control platform for PT Indo Aneka Atsiri
(Sima Arome). The demo should prove five things:

- QC operators can inspect product quality with computer vision.
- QC records are immutable after submission.
- Managers can monitor production quality from dashboards.
- Admins can manage versioned product references.
- The backend supports enterprise readiness: RBAC, audit trail, secure proxy routes, and DaaS readiness checks.

## Pre-Recording Checklist

- Run the app locally: `http://localhost:3000`
- Prepare at least one sample QC image for upload/capture.
- Make sure demo accounts or role quick-login options are available.
- Keep the browser zoom at 90-100%.
- Close unrelated tabs and notifications.
- Optional backend proof in terminal: `pnpm daas:readiness`

## Recommended Flow

| Time | Screen | Purpose |
|---|---|---|
| 0:00-0:15 | `/login` | Introduce Controme and the problem. |
| 0:15-0:35 | Login as QC Operator | Show RBAC entry point. |
| 0:35-1:15 | `/qc/capture` | Demonstrate QC image analysis. |
| 1:15-1:40 | `/qc/lots` and lot detail | Show immutable QC records. |
| 1:40-2:05 | `/dashboard/manager` | Show manager insight and quality monitoring. |
| 2:05-2:25 | `/admin/products` | Show versioned product reference management. |
| 2:25-2:45 | readiness endpoints or terminal | Show backend readiness evidence. |
| 2:45-3:00 | final screen | Close with enterprise-readiness summary. |

## Full Demo Script

### 1. Login Page Introduction

Open:

```text
http://localhost:3000/login
```

Narration:

```text
Hi, we are Tim Retas Siber Imut, and this is Controme, an enterprise-ready quality control platform for PT Indo Aneka Atsiri, also known as Sima Arome.

Controme helps production teams verify powder and aromatic product quality using computer vision, color analysis, and a secure Buildpad DaaS backend.
```

What to show:

- Login page.
- Brand or app name.
- Role quick-login area if available.

### 2. Login As QC Operator

Action:

```text
Choose QC Operator from the demo login option.
```

Narration:

```text
I will start as a QC Operator. This role can create QC inspection records, but cannot edit product references or access admin-only data.

This demonstrates role-based access control, where each user only sees the workflows they are allowed to use.
```

What to show:

- Successful login.
- Role-scoped navigation.
- QC capture menu or page access.

### 3. QC Capture Workflow

Open:

```text
/qc/capture
```

Action:

- Select a product reference.
- Choose QC stage: incoming or finish.
- Enter a lot code.
- Upload or capture a product image.
- Show the generated pass, warning, or reject result.

Narration:

```text
Here is the QC Capture workflow. The operator selects a product reference, chooses whether this is incoming or finish QC, enters a lot code, and captures or uploads a product image.

The system analyzes color difference, contamination, and texture consistency. The browser preview helps the operator, but the final stored result is recomputed server-side, so users cannot fake a pass result from the frontend.

The result is classified as pass, warning, or reject based on the product's reference standard.
```

What to show:

- Product selector.
- QC stage and lot code fields.
- Image preview.
- Color status badge.
- Delta E or pass/reject result.

### 4. Immutable Lot History

Open:

```text
/qc/lots
```

Optional:

```text
Click one lot detail page.
```

Narration:

```text
After submission, the QC result is stored as an immutable lot record. Operators can create and read records, but they cannot update or delete previous QC results.

This is important for buyer trust and auditability, because every decision is preserved with its measured values, status, reference version, and supporting image.
```

What to show:

- Lot history list.
- One lot detail page if time allows.
- Lot code, status, measured values, reference version, and photo evidence.

### 5. Manager Dashboard

Action:

```text
Switch to a Manager account or use role quick-login.
```

Open:

```text
/dashboard/manager
```

Narration:

```text
Now I switch to the Manager view. Managers can monitor overall production quality, pass rate, reject trends, warnings, and recent QC activity.

This dashboard turns raw inspection records into decision support, so managers can quickly identify product quality risks before shipment.
```

What to show:

- Manager dashboard.
- Pass rate.
- Reject or warning cards.
- Trend or summary panels.

### 6. Admin Product References

Action:

```text
Switch to an Admin account if needed.
```

Open:

```text
/admin/products
```

Narration:

```text
Admins can manage product references, including color tolerance and Delta E thresholds.

Reference updates are versioned through a dedicated backend workflow. This means a QC lot always stores which reference version was used, keeping historical decisions explainable even after standards change.
```

What to show:

- Product reference list.
- Product detail page if time allows.
- Reference version history.
- Avoid spending too long editing values during the recording.

### 7. Backend Readiness Evidence

Option A, open routes in the browser:

```text
/api/health
/api/qc/schema-readiness
/api/qc/demo-readiness
```

Option B, show terminal:

```bash
pnpm daas:readiness
```

Narration:

```text
For enterprise readiness, Controme includes backend health checks, DaaS schema readiness, seeded demo data verification, role-based permissions, and immutable DaaS activity logs.

The frontend never talks directly to Supabase or the DaaS backend. All requests go through secure Next.js API proxy routes.
```

What to show:

- `ready: true` from readiness checks.
- Health endpoint response.
- Terminal output if the browser JSON is too small to read.

### 8. Closing

Recommended final screen:

```text
/dashboard/manager
```

Narration:

```text
In summary, Controme provides fast visual QC for Sima Arome while still meeting enterprise requirements: RBAC, audit trail, immutable records, secure backend proxying, readiness checks, and deployable architecture.

Thank you.
```

## Short 2-Minute Version

Use this version if recording time is tight:

| Time | Screen | Narration Focus |
|---|---|---|
| 0:00-0:15 | `/login` | Introduce Controme and Sima Arome QC problem. |
| 0:15-0:30 | QC Operator login | Explain role-based access. |
| 0:30-1:10 | `/qc/capture` | Show image analysis and server-authoritative result. |
| 1:10-1:30 | `/qc/lots` | Show immutable QC record. |
| 1:30-1:50 | `/dashboard/manager` | Show quality monitoring dashboard. |
| 1:50-2:00 | readiness endpoint or terminal | Close with enterprise readiness. |

## Recording Tips

- Start recording only after the app has loaded.
- Do not type long text live; prepare lot code and image file beforehand.
- Move the cursor slowly and deliberately.
- Keep each screen under 30 seconds.
- If a live capture fails, use a prepared image upload.
- If a login session gets stuck, refresh and use the quick-login option again.
- If a backend route returns JSON, zoom in before recording that part.

## Suggested PR/Submission Note

```text
Demo video covers QC Operator capture, immutable lot history, Manager dashboard, Admin reference versioning, and backend readiness evidence.
```
