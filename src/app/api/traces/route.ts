import { NextResponse } from "next/server";
import { parseTrace, type Trace } from "@/lib/traceSchema";

type Store = Map<string, Trace>;

function getStore(): Store {
  // In-memory store (works great for demo; may reset on redeploy/serverless cold starts)
  const g = globalThis as unknown as { __TRACE_STORE__?: Store };
  if (!g.__TRACE_STORE__) g.__TRACE_STORE__ = new Map<string, Trace>();
  return g.__TRACE_STORE__!;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function simulateNetwork() {
  // Random-ish latency so it feels like a real backend
  const ms = 200 + Math.floor(Math.random() * 700);
  await sleep(ms);

  // Small failure rate to force real UI states (optional but “realistic”)
  const fail = Math.random() < 0.02; // 2%
  if (fail) throw new Error("Temporary backend hiccup. Please retry.");
}

function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, init as any);
}

// POST /api/traces
// Body: Trace object (frontend sends it)
// Response: { ok: true, trace }
export async function POST(req: Request) {
  try {
    await simulateNetwork();

    const body = await req.json();
    const trace = parseTrace(body);

    const store = getStore();
    store.set(trace.id, trace);

    return json({ ok: true, trace });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Bad request";
    return json({ ok: false, error: message }, { status: 400 });
  }
}

// GET /api/traces?docId=...&clientId=...
// Response: { ok: true, traces: Trace[] }
export async function GET(req: Request) {
  try {
    await simulateNetwork();

    const url = new URL(req.url);
    const docId = url.searchParams.get("docId");
    const clientId = url.searchParams.get("clientId");

    const store = getStore();
    let traces = Array.from(store.values());

    if (docId) traces = traces.filter((t) => t.docId === docId);
    if (clientId) traces = traces.filter((t) => t.clientId === clientId);

    // Sort newest-ish (we only have strings now, so keep stable by insertion order)
    traces = traces.slice().reverse();

    return json({ ok: true, traces });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Server error";
    return json({ ok: false, error: message }, { status: 500 });
  }
}