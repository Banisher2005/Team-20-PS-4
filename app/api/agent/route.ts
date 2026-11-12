import { NextResponse } from "next/server";
import { agentRequestSchema } from "@/lib/schemas";
import { runAgent } from "@/lib/agent/runAgent";
import { errorResponse, requireActor } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/agent  body: { messages: [{ role: "user" | "model", text: string }] } */
export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireActor();
  } catch (err) {
    return errorResponse(err, "agent");
  }

  // Protects the Gemini quota: 10 agent messages per minute per user.
  if (!rateLimit(`agent:${actor.userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "You're sending messages too fast. Wait a minute and try again." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await runAgent(parsed.data.messages, actor);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    console.error("[agent]", message);
    const quota = /429|quota|RESOURCE_EXHAUSTED/i.test(message);
    const busy = /503|UNAVAILABLE|overloaded|high demand/i.test(message);
    return NextResponse.json(
      {
        error: quota
          ? "Gemini quota reached. Wait a minute and try again."
          : busy
            ? "DeskBot's AI service is busy right now. Please try again in a few seconds."
            : "DeskBot ran into a problem. Please try again.",
      },
      { status: quota ? 429 : busy ? 503 : 500 }
    );
  }
}
