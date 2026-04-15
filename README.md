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

## 安卓 App

项目已接入 Capacitor，可打包为安卓 APK，并支持在 App 内检测更新。

### 本地构建

1. `npm install`
2. `npm run android:debug`

构建完成后，APK 默认在：

- `android/app/build/outputs/apk/debug/app-debug.apk`

### 正式签名版

正式签名使用本机私有密钥：

- `android/keystore.properties`
- `android/signing/smart-ledger-release.jks`

这两个文件不会提交到仓库，但后续升级必须保留，否则新版本无法覆盖安装旧版本。

构建命令：

1. `npm run android:release`

构建完成后，正式安装包默认在：

- `android/app/build/outputs/apk/release/app-release.apk`

### 更新检测

- 更新清单：`android-app/latest.json`
- App 启动后会自动检查该清单
- 当 `versionCode` 或 `versionName` 更高时，App 会提示下载安装新 APK

发布新版本时，更新这两个内容即可：

1. 把新 APK 放到 `android-app/downloads/`
2. 修改 `android-app/latest.json` 中的版本号、下载地址和说明

## AI 模式

### 方式 1：浏览器直连 OpenAI

适合个人临时使用。把 OpenAI API Key 填到网页里即可生成 AI 月报，但 Key 会保存在浏览器本地，不适合公开给其他人使用。

### 方式 2：安全代理模式（推荐）

仓库内置了 Cloudflare Worker 代理，目录在 `worker/`。

部署步骤：

1. 进入 `worker/`
2. `npm install`
3. `npx wrangler login`
4. `npx wrangler kv namespace create LEDGER_STORE`
5. 把返回的 KV `id` 填到 `worker/wrangler.jsonc`
6. `npx wrangler secret put OPENAI_API_KEY`
7. `npm run deploy`

部署成功后，把 Worker 地址填回网页中的：

- `AI 服务地址`：`https://smart-ledger-ai.<your-subdomain>.workers.dev/api/month-report`
- `云账本服务地址`：`https://smart-ledger-ai.<your-subdomain>.workers.dev`

这样前端就不需要再保存 OpenAI Key，也可以直接使用“云账本空间”做多设备同步。
