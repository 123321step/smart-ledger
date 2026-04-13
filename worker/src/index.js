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
    if (url.pathname !== "/api/month-report") {
      return json({ error: "Not found" }, 404, corsHeaders);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    try {
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
    } catch (error) {
      return json({ error: error.message || "Unknown worker error" }, 500, corsHeaders);
    }
  }
};

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
