const ALLOWED_HEADERS = "Content-Type";

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    try {
      if (url.pathname === "/api/month-report") {
        const body = await request.json();
        const promptPayload = buildPromptPayload(body, env);
        const upstream = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(promptPayload)
        });

        if (!upstream.ok) {
          const errorText = await upstream.text();
          return json({ error: errorText || `Upstream failed (${upstream.status})` }, upstream.status, corsHeaders);
        }

        const data = await upstream.json();
        const text = extractResponseText(data);
        return json({
          text,
          model: env.OPENAI_MODEL || "gpt-5"
        }, 200, corsHeaders);
      }

      if (url.pathname === "/api/ledger/push") {
        const body = await request.json();
        const validated = await validateLedgerAccess(body, env);
        if (!validated.ok) {
          return json({ error: validated.error }, validated.status, corsHeaders);
        }

        await env.LEDGER_STORE.put(validated.key, JSON.stringify({
          updatedAt: new Date().toISOString(),
          records: Array.isArray(body.records) ? body.records : []
        }));
        return json({ ok: true, space: body.space }, 200, corsHeaders);
      }

      if (url.pathname === "/api/ledger/pull") {
        const body = await request.json();
        const validated = await validateLedgerAccess(body, env);
        if (!validated.ok) {
          return json({ error: validated.error }, validated.status, corsHeaders);
        }

        const raw = await env.LEDGER_STORE.get(validated.key);
        const data = raw ? JSON.parse(raw) : { records: [] };
        return json({ ok: true, space: body.space, records: data.records || [] }, 200, corsHeaders);
      }

      return json({ error: "Not found" }, 404, corsHeaders);
    } catch (error) {
      return json({ error: error.message || "Unknown worker error" }, 500, corsHeaders);
    }
  }
};

async function validateLedgerAccess(body, env) {
  const space = String(body.space || "").trim();
  const passphrase = String(body.passphrase || "").trim();
  if (!space || !passphrase) {
    return { ok: false, status: 400, error: "Missing space or passphrase" };
  }
  if (!env.LEDGER_STORE) {
    return { ok: false, status: 500, error: "Missing KV binding" };
  }

  const hash = await sha256(passphrase);
  return {
    ok: true,
    key: `ledger:${space}:${hash}`
  };
}

function buildPromptPayload(body, env) {
  const model = env.OPENAI_MODEL || body.model || "gpt-5";
  const categoryLines = Array.isArray(body.categoryCounts) ? body.categoryCounts.map((item) => `- ${item.label}：${formatCurrency(item.amount)}`) : [];
  const timelineLines = Array.isArray(body.timeline) ? body.timeline.map((item) => `- ${item.label}：${formatCurrency(item.amount)}`) : [];
  const detailLines = Array.isArray(body.summaryRows)
    ? body.summaryRows.map((row) => `${row.date} / ${row.payer}\n${row.items}`)
    : [];

  return {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "你是一名中文个人财务分析助手。请基于用户提供的账单统计，输出简洁、具体、可执行的消费月报。内容包含：整体总结、主要支出点、异常提醒、下月建议。不要输出 markdown 标题，直接用自然中文分段。"
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `统计区间：${body.rangeText || "-"}`,
              `总支出：${formatCurrency(body.totalExpense)}`,
              `总收入：${formatCurrency(body.totalIncome)}`,
              `结余：${formatCurrency(body.net)}`,
              "分类支出：",
              ...categoryLines,
              "每日支出走势：",
              ...timelineLines,
              "账单明细：",
              ...detailLines
            ].join("\n")
          }
        ]
      }
    ]
  };
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = env.ALLOWED_ORIGIN || "*";
  const allowOrigin = allowedOrigin === "*" ? "*" : (origin === allowedOrigin ? origin : allowedOrigin);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Vary": "Origin"
  };
}

async function sha256(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
