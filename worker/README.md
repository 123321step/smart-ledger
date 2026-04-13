# Smart Ledger AI Worker

这个 Worker 用来代理 OpenAI Responses API，避免在前端暴露 API Key。

## 准备

1. 安装依赖：`npm install`
2. 登录 Cloudflare：`npx wrangler login`
3. 设置 OpenAI 密钥：`npx wrangler secret put OPENAI_API_KEY`

## 本地调试

`npm run dev`

## 部署

`npm run deploy`

部署后会得到一个 Workers 域名，把完整地址填回网页中的“AI 服务地址”，例如：

`https://smart-ledger-ai.<your-subdomain>.workers.dev/api/month-report`
