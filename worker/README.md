# Smart Ledger AI Worker

这个 Worker 用来代理 OpenAI Responses API，避免在前端暴露 API Key。

## 准备

1. 安装依赖：`npm install`
2. 登录 Cloudflare：`npx wrangler login`
3. 创建 KV：`npx wrangler kv namespace create LEDGER_STORE`
4. 把返回的 `id` 填到 `wrangler.jsonc` 的 `kv_namespaces`
5. 设置 OpenAI 密钥：`npx wrangler secret put OPENAI_API_KEY`

## 本地调试

`npm run dev`

## 部署

`npm run deploy`

部署后会得到一个 Workers 域名。

网页中两个地址这样填：

- `AI 服务地址`：`https://smart-ledger-ai.<your-subdomain>.workers.dev/api/month-report`
- `云账本服务地址`：`https://smart-ledger-ai.<your-subdomain>.workers.dev`

这样前端就能同时使用安全 AI 月报和云账本空间。
