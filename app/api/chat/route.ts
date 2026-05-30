/**
 * Ask AI — chat endpoint (Gemini streamText)
 *
 * Powers the Manager Dashboard "Ask AI" panel. Streams an LLM answer about
 * the user's QC data, calling the DaaS data tools when it needs rows.
 *
 * Pattern from the Buildpad "chat with your data" tutorial:
 * https://app.buildpad.ai/docs/tutorials/ai/chat-with-your-data
 * (adapted to Google Gemini instead of Bedrock — free tier, no AWS billing.)
 *
 * Required env (see .env.local):
 *   GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_MODEL_ID
 */

import { google } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { NextResponse } from "next/server";
import { dataTools } from "./tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the QC & Operations assistant embedded in the Controme Manager Dashboard for PT Indo Aneka Atsiri (Sima Arome).

The manager asks natural-language questions about quality-control lots. Use the provided tools to read live data — never invent numbers.

Domain notes:
- The main collection is "qc_lots". Each lot has: lot_code, product_id, qc_stage (incoming/finish), status (pass/reject), warning_flag, delta_e (color deviation ΔE), reject_reason, checked_at.
- "qc_products" holds reference color standards (ref_l, ref_a, ref_b, delta_e_max). A lot rejects when its ΔE exceeds the product's delta_e_max (typically around 4.5).
- Managers care about: overall pass rate, ΔE trend over time, and which lots are reject or warning flagged.

Behaviour:
- Call list_collections first if you do not already know the schema.
- Use query_collection (sort '-checked_at' for newest) to fetch the rows you need before answering.
- Answer concisely in the manager's language. Lead with the verdict, then 2-4 supporting bullets citing real lot_codes and ΔE values. Flag any reject/warning lots needing attention.`;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Ask AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.",
      },
      { status: 503 }
    );
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google(process.env.GEMINI_MODEL_ID ?? "gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: dataTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
