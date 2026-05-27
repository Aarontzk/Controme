/**
 * Controme QC domain model + evaluation (FR-01 colour QC, FR-02 lot record).
 *
 * A sample's measured L*a*b* is compared to its product reference: ΔE drives the
 * PASS/REJECT verdict (reject when ΔE exceeds the product's `deltaEMax`), and per-channel
 * tolerances produce explanatory flags ("too dark", "shifted to blue", ...).
 */

import { deltaE76, round, type LabChannel, type LabColor, type RgbColor } from "./colorimetry";

export type QCStatus = "pass" | "reject";

/** RBAC roles (PRD non-functional requirements). */
export type Role = "admin" | "qc_operator" | "ppic" | "manager";

/** ± allowed deviation per L*a*b* channel before the channel is flagged. */
export interface ChannelTolerance {
  L: number;
  a: number;
  b: number;
}

/** A product's colour-QC reference. Editing this is versioned (FR-03). */
export interface ProductReference {
  id: string;
  name: string;
  /** Target colour. */
  reference: LabColor;
  /** ± tolerance per channel. */
  tolerance: ChannelTolerance;
  /** Reject when measured ΔE exceeds this. */
  deltaEMax: number;
  /** Approximate sRGB for UI preview only. */
  rgbApprox?: RgbColor;
}

/** A single channel that fell outside its ± tolerance. */
export interface ChannelFlag {
  channel: LabChannel;
  value: number;
  reference: number;
  tolerance: number;
  direction: "low" | "high";
}

/** Result of evaluating one measured sample against a product reference. */
export interface QCEvaluation {
  deltaE: number;
  status: QCStatus;
  /** Channels outside tolerance — the human-readable "why", independent of the ΔE verdict. */
  channelFlags: ChannelFlag[];
}

/**
 * Immutable QC lot record (FR-02). Once written it is never edited — corrections create a
 * new record. Matches the seed schema in PRD §4.3.
 */
export interface QCLot {
  lotId: string;
  productId: string;
  /** ISO-8601 timestamp of the check. */
  timestamp: string;
  measured: LabColor;
  deltaE: number;
  status: QCStatus;
  photoUrl: string;
  /** User id of the QC operator (or the automated check). */
  operatorId?: string;
}

const CHANNELS: readonly LabChannel[] = ["L", "a", "b"];

/**
 * Evaluate a measured colour against a product reference.
 *
 * Verdict: REJECT when ΔE > `deltaEMax`, otherwise PASS (PRD §4 tables). `channelFlags`
 * lists channels outside ± tolerance regardless of the ΔE verdict, so the UI can explain a
 * borderline pass or a reject.
 */
export function evaluateSample(product: ProductReference, measured: LabColor): QCEvaluation {
  const deltaE = round(deltaE76(product.reference, measured));

  const channelFlags: ChannelFlag[] = [];
  for (const channel of CHANNELS) {
    const value = measured[channel];
    const reference = product.reference[channel];
    const tolerance = product.tolerance[channel];
    if (value < reference - tolerance) {
      channelFlags.push({ channel, value, reference, tolerance, direction: "low" });
    } else if (value > reference + tolerance) {
      channelFlags.push({ channel, value, reference, tolerance, direction: "high" });
    }
  }

  const status: QCStatus = deltaE > product.deltaEMax ? "reject" : "pass";
  return { deltaE, status, channelFlags };
}

/**
 * Build an immutable QC lot record from an evaluation. The caller supplies identity and the
 * stored photo URL; ΔE and status come from the evaluation so they cannot drift apart.
 */
export function buildQCLot(params: {
  lotId: string;
  productId: string;
  measured: LabColor;
  evaluation: QCEvaluation;
  photoUrl: string;
  operatorId?: string;
  timestamp?: string;
}): QCLot {
  return {
    lotId: params.lotId,
    productId: params.productId,
    timestamp: params.timestamp ?? new Date().toISOString(),
    measured: params.measured,
    deltaE: params.evaluation.deltaE,
    status: params.evaluation.status,
    photoUrl: params.photoUrl,
    operatorId: params.operatorId,
  };
}
