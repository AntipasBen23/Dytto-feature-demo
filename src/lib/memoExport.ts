import type { Trace } from "@/lib/traceSchema";

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildMemoHtml(trace: Trace, draft: string) {
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
  .h{background:#fff; border:1px solid rgba(0,0,0,.1); border-radius:18px; padding:18px;}
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