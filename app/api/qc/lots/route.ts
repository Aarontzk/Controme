/**
 * Authoritative QC lot creation.
 *
 * POST /api/qc/lots  (multipart: photo, productId, qcStage)
 *   1. Auth required (operator's Supabase JWT, forwarded to DaaS).
 *   2. ΔE + contamination + consistency are recomputed server-side from the uploaded photo —
 *      the browser preview is advisory and is never trusted for the stored verdict.
 *   3. Photo is uploaded to DaaS Files; an immutable qc_lots record is created.
 *
 * Lot reads use the generic /api/items/qc_lots proxy — no GET here.
 */

import { type NextRequest, NextResponse } from "next/server";

import { getAuthHeaders, getDaaSUrl } from "@/lib/api/auth-headers";
import {
  evaluateSample,
  mapDaasProduct,
  round,
  type DaasProductRow,
} from "@/lib/domain";
import { analyzeSampleImage } from "@/lib/vision/image-pipeline.server";
import { qcLotUploadSchema, validatePhoto } from "@/lib/vision/validation";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const headers = await getAuthHeaders();
    if (!headers["Authorization"]) {
      return jsonError("Authentication required.", 401);
    }
    const daasUrl = getDaaSUrl();

    const form = await request.formData();
    const productId = String(form.get("productId") ?? "");
    const qcStage = String(form.get("qcStage") ?? "incoming");
    const lotCode = String(form.get("lotCode") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    const photo = form.get("photo");

    const parsed = qcLotUploadSchema.safeParse({ productId, qcStage, lotCode, note });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid productId.", 400);
    }
    if (!(photo instanceof File)) {
      return jsonError("A photo file is required.", 400);
    }
    const photoCheck = validatePhoto({ type: photo.type, size: photo.size });
    if (!photoCheck.ok) {
      return jsonError(photoCheck.error, 400);
    }

    // Resolve the product reference (permission-gated by the operator's JWT).
    const productRes = await fetch(
      `${daasUrl}/api/items/products/${parsed.data.productId}`,
      { headers, cache: "no-store" }
    );
    if (productRes.status === 403) {
      return jsonError("Not allowed to read this product.", 403);
    }
    if (!productRes.ok) {
      return jsonError("Product not found.", 404);
    }
    const productJson = (await productRes.json()) as { data?: DaasProductRow };
    if (!productJson.data) {
      return jsonError("Product not found.", 404);
    }
    const product = mapDaasProduct(productJson.data);
    const referenceVersion =
      typeof productJson.data.version === "number" ? productJson.data.version : 1;

    // Server-authoritative recompute from the photo bytes.
    const buffer = Buffer.from(await photo.arrayBuffer());
    const sample = await analyzeSampleImage(buffer);
    const evaluation = evaluateSample(product, sample.lab);

    const failedLanes: string[] = [];
    if (evaluation.status === "reject") failedLanes.push("color");
    if (sample.analysis.contamination.status === "reject") failedLanes.push("contamination");
    if (sample.analysis.consistency.status === "reject") failedLanes.push("consistency");
    const finalStatus = failedLanes.length > 0 ? "reject" : "pass";

    // Upload the photo to DaaS Files (Authorization only — fetch sets the multipart boundary).
    const fileForm = new FormData();
    fileForm.append("file", photo, photo.name || "qc-sample");
    const fileRes = await fetch(`${daasUrl}/api/files`, {
      method: "POST",
      headers: { Authorization: headers["Authorization"] },
      body: fileForm,
      cache: "no-store",
    });
    if (!fileRes.ok) {
      return jsonError("Photo upload failed.", 502);
    }
    const fileJson = (await fileRes.json()) as { data?: { id?: string } };
    const photoId = fileJson.data?.id ?? null;

    // Resolve the operator (the authenticated user).
    let operatorId: string | null = null;
    const meRes = await fetch(`${daasUrl}/api/users/me`, { headers, cache: "no-store" });
    if (meRes.ok) {
      const meJson = (await meRes.json()) as { data?: { id?: string } };
      operatorId = meJson.data?.id ?? null;
    }

    // Core fields the live DaaS schema is guaranteed to accept — used as the fallback body
    // if the extended fields below are not yet present on the collection.
    const baseLotBody = {
      product_id: parsed.data.productId,
      l_value: round(sample.lab.L),
      a_value: round(sample.lab.a),
      b_value: round(sample.lab.b),
      delta_e: evaluation.deltaE,
      status: finalStatus,
      channel_flags: evaluation.channelFlags,
      contaminant_ratio: round(sample.analysis.metrics.contaminantRatio, 4),
      brightness_stddev: round(sample.analysis.metrics.brightnessStdDev),
      texture_contrast: round(sample.analysis.metrics.textureContrast),
      reject_reason: failedLanes.length > 0 ? failedLanes.join(" + ") : null,
      photo: photoId,
      operator_id: operatorId,
      checked_at: new Date().toISOString(),
    };
    const lotBody = {
      ...baseLotBody,
      qc_stage: parsed.data.qcStage,
      warning_flag: evaluation.warningFlag,
      reference_version: referenceVersion,
      note: parsed.data.note || null,
      lot_code: parsed.data.lotCode || null,
    };

    let lotRes = await fetch(`${daasUrl}/api/items/qc_lots`, {
      method: "POST",
      headers,
      body: JSON.stringify(lotBody),
      cache: "no-store",
    });
    if (!lotRes.ok && [400, 422].includes(lotRes.status)) {
      lotRes = await fetch(`${daasUrl}/api/items/qc_lots`, {
        method: "POST",
        headers,
        body: JSON.stringify(baseLotBody),
        cache: "no-store",
      });
    }
    if (!lotRes.ok) {
      const detail = await lotRes.text();
      return jsonError(`Failed to save lot: ${detail.slice(0, 200)}`, lotRes.status);
    }
    const lotJson = (await lotRes.json()) as { data?: unknown };

    return NextResponse.json(
      {
        success: true,
        data: lotJson.data,
        result: {
          status: finalStatus,
          deltaE: evaluation.deltaE,
          qcStage: parsed.data.qcStage,
          referenceVersion,
          lab: {
            L: round(sample.lab.L),
            a: round(sample.lab.a),
            b: round(sample.lab.b),
          },
          channelFlags: evaluation.channelFlags,
          warningFlag: evaluation.warningFlag,
          failedLanes,
          lightingWarnings: sample.analysis.metrics.lightingWarnings,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return jsonError(message, 500);
  }
}
