# 智能记账板 Pro

一个支持语音录入、云同步、AI 月报和移动端体验的智能记账网页。

## 功能

- 语音识别录入
- 自然语言识别金额与分类
- 日 / 周 / 月消费看板
- GitHub Gist 云同步
- OpenAI AI 月报
- CSV / HTML / JSON / PDF 导出
- PWA 安装与基础离线缓存

## 本地使用

直接在浏览器中打开 `index.html` 即可使用。

## 公网静态站

项目已包含 GitHub Pages 自动部署工作流，推送到 `main` 后会自动发布静态站点。

## AI 模式

### 方式 1：浏览器直连 OpenAI

适合个人临时使用。把 OpenAI API Key 填到网页里即可生成 AI 月报，但 Key 会保存在浏览器本地，不适合公开给其他人使用。

### 方式 2：安全代理模式（推荐）

仓库内置了 Cloudflare Worker 代理，目录在 `worker/`。

部署步骤：

1. 进入 `worker/`
2. `npm install`
3. `npx wrangler login`
4. `npx wrangler secret put OPENAI_API_KEY`
5. `npm run deploy`

部署成功后，把 Worker 地址填回网页中的“AI 服务地址”，例如：

`https://smart-ledger-ai.<your-subdomain>.workers.dev/api/month-report`

这样前端就不需要再保存 OpenAI Key。
