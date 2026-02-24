import { NextResponse } from "next/server";
import type { Trace } from "@/lib/traceSchema";

type Store = Map<string, Trace>;

function getStore(): Store {
  const g = globalThis as unknown as { __TRACE_STORE__?: Store };
  if (!g.__TRACE_STORE__) g.__TRACE_STORE__ = new Map<string, Trace>();
  return g.__TRACE_STORE__!;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function simulateNetwork() {
  const ms = 200 + Math.floor(Math.random() * 700);
  await sleep(ms);

  const fail = Math.random() < 0.02; // 2%
  if (fail) throw new Error("Temporary backend hiccup. Please retry.");
}

function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, init as any);
}

// GET /api/traces/:id
// Response: { ok: true, trace } or 404
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await simulateNetwork();

    const { id } = await ctx.params;
    const store = getStore();
    const trace = store.get(id);

    if (!trace) {
      return json({ ok: false, error: "Trace not found" }, { status: 404 });
    }

    return json({ ok: true, trace });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Server error";
    return json({ ok: false, error: message }, { status: 500 });
  }
}