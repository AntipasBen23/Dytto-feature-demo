"use client";

import { useMemo, useState } from "react";
import { makeSeedTrace, type Trace } from "@/lib/traceSchema";

export default function ProofDemo() {
  const [proofMode, setProofMode] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const trace = useMemo<Trace>(() => makeSeedTrace(), []);
  const draftEmail = useMemo(
    () => `Subject: Quick check-in on VAT + cash runway

Hi ACME team,

Based on recent activity, it looks like VAT payable may increase this quarter due to higher sales volume. I’d also like to flag that cash runway could tighten in the next 6–8 weeks if the current burn continues.

Two quick actions I recommend:
1) Review payment terms and follow-ups for slow-paying customers (especially invoices >45 days).
2) Confirm whether any refunds/credit notes are expected that are not yet reflected.

If you’d like, I can prepare a short advisory memo with the key numbers and references.

Best,
(Accountant)`,
    []
  );

  function pop(msg: string) {
    setToast(msg);
    window.clearTimeout((pop as any)._t);
    (pop as any)._t = window.setTimeout(() => setToast(null), 2000);
  }

  async function copyTraceJson() {
    const json = JSON.stringify(trace, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      pop("Copied trace JSON");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      pop("Copied trace JSON");
    }
  }

  function exportMemoHtml() {
    const html = buildMemoHtml(trace, draftEmail);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `advisory-memo_${trace.clientId}_${trace.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    pop("Exported memo (HTML)");
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] text-black">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wide text-black/60">DYTTO • FEATURE DEMO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Proof Mode (Advisory Trace)
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            An audit-friendly trace panel attached to any AI-generated advisory draft.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Draft */}
          <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-sm font-medium">Generated advisory draft</p>
                <p className="text-xs text-black/60">
                  Doc: {trace.docId} • {trace.createdAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProofMode((v) => !v)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition",
                  proofMode
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-black hover:bg-black/5",
                ].join(" ")}
                aria-pressed={proofMode}
              >
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full",
                    proofMode ? "bg-emerald-400" : "bg-black/20",
                  ].join(" ")}
                />
                Proof Mode
              </button>
            </div>

            <div className="px-5 py-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/70">
                  Confidence: {trace.confidence}
                </span>
                {trace.riskFlags.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900"
                    title="Risk flag"
                  >
                    {f.replaceAll("_", " ")}
                  </span>
                ))}
              </div>

              <textarea
                readOnly
                value={draftEmail}
                className="h-[360px] w-full resize-none rounded-xl border border-black/10 bg-[#fffdf9] p-4 text-sm leading-6 text-black/90 outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => pop("Send draft (demo)")}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Send draft (demo)
                </button>
                <button
                  type="button"
                  onClick={() => pop("Regenerate (demo)")}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                >
                  Regenerate (demo)
                </button>
              </div>
            </div>
          </section>

          {/* Proof Panel */}
          <aside
            className={[
              "rounded-2xl border border-black/10 bg-white shadow-sm transition",
              proofMode ? "opacity-100" : "opacity-60",
            ].join(" ")}
          >
            <div className="border-b border-black/10 px-5 py-4">
              <p className="text-sm font-medium">Advisory Trace</p>
              <p className="text-xs text-black/60">
                Trace ID: {trace.id} • Client: {trace.clientId}
              </p>
            </div>

            <div className="space-y-5 px-5 py-5">
              <Block title="Claims">
                <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
                  {trace.claims.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Block>

              <Block title="Evidence">
                <div className="space-y-2">
                  {trace.evidence.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-xl border border-black/10 bg-[#fffdf9] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-black/60">
                            {e.source} • {e.timestamp}
                          </p>
                        </div>
                        <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] text-black/70">
                          source
                        </span>
                      </div>
                      <p className="mt-2 break-all text-xs text-black/60">{e.reference}</p>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="Calculations">
                <div className="space-y-2">
                  {trace.calculations.map((c) => (
                    <div key={c.id} className="rounded-xl border border-black/10 p-3">
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="mt-1 text-xs text-black/60">{c.formula}</p>
                      <p className="mt-2 text-sm text-black/80">{c.result}</p>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="Assumptions">
                <ul className="space-y-2 text-sm text-black/80">
                  {trace.assumptions.map((a, i) => (
                    <li key={i} className="rounded-xl bg-black/5 p-3">
                      {a}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Citations">
                <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
                  {trace.citations.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Block>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportMemoHtml}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Export memo (HTML)
                </button>
                <button
                  type="button"
                  onClick={copyTraceJson}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                >
                  Copy trace JSON
                </button>
              </div>

              <p className="text-xs text-black/50">
                Frontend-only demo with a strict Trace schema (Zod). Next: wire page.tsx to render
                this component.
              </p>
            </div>
          </aside>
        </div>

        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Block(props: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold tracking-wide text-black/60">
        {props.title.toUpperCase()}
      </p>
      {props.children}
    </section>
  );
}

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildMemoHtml(trace: Trace, draft: string) {
  const claims = trace.claims.map((c) => `<li>${esc(c)}</li>`).join("");
  const assumptions = trace.assumptions.map((a) => `<li>${esc(a)}</li>`).join("");
  const citations = trace.citations.map((c) => `<li>${esc(c)}</li>`).join("");
  const evidence = trace.evidence
    .map(
      (e) => `
      <div class="card">
        <div class="row">
          <div>
            <div class="t">${esc(e.title)}</div>
            <div class="m">${esc(e.source)} • ${esc(e.timestamp)}</div>
          </div>
          <div class="pill">source</div>
        </div>
        <div class="ref">${esc(e.reference)}</div>
      </div>`
    )
    .join("");

  const calcs = trace.calculations
    .map(
      (c) => `
      <div class="card">
        <div class="t">${esc(c.label)}</div>
        <div class="m">${esc(c.formula)}</div>
        <div class="r">${esc(c.result)}</div>
      </div>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Advisory Memo • ${esc(trace.clientId)} • ${esc(trace.id)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; background:#faf7f2; color:#111; margin:0; padding:24px;}
  .wrap{max-width:920px; margin:0 auto;}
  .h{background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:18px; padding:18px 18px;}
  .k{font-size:12px; opacity:.65; letter-spacing:.08em;}
  h1{margin:8px 0 0; font-size:22px;}
  .meta{margin-top:6px; font-size:12px; opacity:.65;}
  .grid{display:grid; grid-template-columns:1fr; gap:14px; margin-top:14px;}
  .card{background:#fffdf9; border:1px solid rgba(0,0,0,.1); border-radius:14px; padding:12px;}
  .sec{background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:18px; padding:14px;}
  .t{font-weight:600; font-size:14px;}
  .m{font-size:12px; opacity:.7; margin-top:4px;}
  .r{margin-top:8px; font-size:14px;}
  .pill{font-size:11px; background:rgba(0,0,0,.05); padding:4px 8px; border-radius:999px;}
  .row{display:flex; justify-content:space-between; gap:12px; align-items:flex-start;}
  .ref{margin-top:8px; font-size:12px; opacity:.7; word-break:break-all;}
  pre{white-space:pre-wrap; background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:18px; padding:14px; margin:0;}
  ul{margin:8px 0 0; padding-left:18px;}
</style>
</head>
<body>
  <div class="wrap">
    <div class="h">
      <div class="k">DYTTO • ADVISORY MEMO (DEMO EXPORT)</div>
      <h1>Proof Mode Trace</h1>
      <div class="meta">Client: ${esc(trace.clientId)} • Trace: ${esc(trace.id)} • Doc: ${esc(
    trace.docId
  )} • ${esc(trace.createdAt)}</div>
    </div>

    <div class="grid">
      <div class="sec">
        <div class="t">Draft advisory</div>
        <div class="m">Generated message</div>
        <pre>${esc(draft)}</pre>
      </div>

      <div class="sec">
        <div class="t">Claims</div>
        <ul>${claims}</ul>
      </div>

      <div class="sec">
        <div class="t">Evidence</div>
        <div class="grid">${evidence}</div>
      </div>

      <div class="sec">
        <div class="t">Calculations</div>
        <div class="grid">${calcs}</div>
      </div>

      <div class="sec">
        <div class="t">Assumptions</div>
        <ul>${assumptions}</ul>
      </div>

      <div class="sec">
        <div class="t">Citations</div>
        <ul>${citations}</ul>
      </div>
    </div>
  </div>
</body>
</html>`;
}