import type { Trace } from "@/lib/traceSchema";

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error: string };

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `Non-JSON response (${res.status})` };
  }
}

export async function createTrace(trace: Trace): Promise<ApiOk<{ trace: Trace }> | ApiErr> {
  const res = await fetch("/api/traces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(trace),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || `Failed to create trace (${res.status})` };
  }
  return { ok: true, trace: data.trace as Trace };
}

export async function listTraces(params?: {
  docId?: string;
  clientId?: string;
}): Promise<ApiOk<{ traces: Trace[] }> | ApiErr> {
  const q = new URLSearchParams();
  if (params?.docId) q.set("docId", params.docId);
  if (params?.clientId) q.set("clientId", params.clientId);

  const res = await fetch(`/api/traces${q.toString() ? `?${q.toString()}` : ""}`, {
    method: "GET",
  });

  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || `Failed to list traces (${res.status})` };
  }
  return { ok: true, traces: (data.traces || []) as Trace[] };
}

export async function getTraceById(
  id: string
): Promise<ApiOk<{ trace: Trace }> | ApiErr> {
  const res = await fetch(`/api/traces/${encodeURIComponent(id)}`, { method: "GET" });

  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || `Failed to fetch trace (${res.status})` };
  }
  return { ok: true, trace: data.trace as Trace };
}