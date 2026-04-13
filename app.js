const STORAGE_KEY = "smart-ledger-v2-records";
const SYNC_KEY = "smart-ledger-v2-sync";
const GIST_FILENAME = "smart-ledger-sync.json";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const CATEGORY_KEYWORDS = {
  food: ["早餐", "午饭", "晚饭", "夜宵", "咖啡", "奶茶", "外卖", "买菜", "水果", "零食"],
  transport: ["地铁", "公交", "高铁", "机票", "打车", "滴滴", "出租车", "停车", "加油"],
  shopping: ["购物", "淘宝", "京东", "超市", "日用品", "衣服", "鞋", "护肤", "化妆品"],
  housing: ["房租", "物业", "水费", "电费", "燃气", "网费", "宽带", "家居"],
  entertainment: ["电影", "游戏", "旅游", "聚会", "演出", "KTV", "会员"],
  medical: ["挂号", "药", "医院", "体检", "看病", "牙", "诊所"],
  learning: ["书", "课程", "培训", "学费", "学习", "考试"],
  salary: ["工资", "薪资", "奖金", "报销", "退款", "收入", "到账", "收到", "返现"],
  other: []
};

const CATEGORY_META = {
  food: { label: "餐饮", className: "tag-food" },
  transport: { label: "交通", className: "tag-transport" },
  shopping: { label: "购物", className: "tag-shopping" },
  housing: { label: "居住", className: "tag-housing" },
  entertainment: { label: "娱乐", className: "tag-entertainment" },
  medical: { label: "医疗", className: "tag-medical" },
  learning: { label: "学习", className: "tag-learning" },
  salary: { label: "收入", className: "tag-salary" },
  other: { label: "其他", className: "tag-other" }
};

const TYPE_LABEL = { expense: "支出", income: "收入" };

const els = {
  entrySection: q("#entrySection"),
  entryDate: q("#entryDate"),
  payerName: q("#payerName"),
  entryInput: q("#entryInput"),
  voiceBtn: q("#voiceBtn"),
  mobileVoiceBtn: q("#mobileVoiceBtn"),
  voiceStatus: q("#voiceStatus"),
  saveEntryBtn: q("#saveEntryBtn"),
  mobileSaveBtn: q("#mobileSaveBtn"),
  previewBtn: q("#previewBtn"),
  previewList: q("#previewList"),
  recordsContainer: q("#recordsContainer"),
  reportTabs: q("#reportTabs"),
  reportDate: q("#reportDate"),
  statsGrid: q("#statsGrid"),
  categoryChart: q("#categoryChart"),
  timelineChart: q("#timelineChart"),
  summaryTable: q("#summaryTable"),
  reportText: q("#reportText"),
  insightCards: q("#insightCards"),
  clearAllBtn: q("#clearAllBtn"),
  exportCsvBtn: q("#exportCsvBtn"),
  exportHtmlBtn: q("#exportHtmlBtn"),
  exportJsonBtn: q("#exportJsonBtn"),
  importJsonBtn: q("#importJsonBtn"),
  importJsonInput: q("#importJsonInput"),
  printBtn: q("#printBtn"),
  loadTodayBtn: q("#loadTodayBtn"),
  monthExpense: q("#monthExpense"),
  monthIncome: q("#monthIncome"),
  monthBalance: q("#monthBalance"),
  activeCategories: q("#activeCategories"),
  recordTemplate: q("#recordTemplate"),
  gistTokenInput: q("#gistTokenInput"),
  gistIdInput: q("#gistIdInput"),
  saveSyncConfigBtn: q("#saveSyncConfigBtn"),
  pushCloudBtn: q("#pushCloudBtn"),
  pullCloudBtn: q("#pullCloudBtn"),
  syncStatus: q("#syncStatus"),
  scrollToEntryBtn: q("#scrollToEntryBtn"),
  installBtn: q("#installBtn")
};

const state = {
  records: loadJson(STORAGE_KEY, []),
  sync: loadJson(SYNC_KEY, { token: "", gistId: "" }),
  reportType: "monthly"
};

let recognition = null;
let isListening = false;
let deferredInstallPrompt = null;

init();

function init() {
  const today = formatDate(new Date());
  els.entryDate.value = today;
  els.reportDate.value = today;
  els.gistTokenInput.value = state.sync.token || "";
  els.gistIdInput.value = state.sync.gistId || "";
  bindEvents();
  setupVoice();
  setupInstallPrompt();
  registerServiceWorker();
  loadEntryForDate(today);
  renderAll();
  updateSyncStatus();
}

function bindEvents() {
  els.previewBtn.addEventListener("click", renderPreview);
  els.entryInput.addEventListener("input", debounce(renderPreview, 150));
  els.saveEntryBtn.addEventListener("click", saveCurrentEntry);
  els.mobileSaveBtn.addEventListener("click", saveCurrentEntry);
  els.voiceBtn.addEventListener("click", toggleVoice);
  els.mobileVoiceBtn.addEventListener("click", toggleVoice);
  els.loadTodayBtn.addEventListener("click", () => {
    const today = formatDate(new Date());
    els.entryDate.value = today;
    loadEntryForDate(today);
  });
  els.entryDate.addEventListener("change", () => loadEntryForDate(els.entryDate.value));
  els.reportDate.addEventListener("change", renderDashboard);
  els.clearAllBtn.addEventListener("click", clearAllData);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportHtmlBtn.addEventListener("click", exportHtml);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.importJsonBtn.addEventListener("click", () => els.importJsonInput.click());
  els.importJsonInput.addEventListener("change", importJson);
  els.printBtn.addEventListener("click", () => window.print());
  els.saveSyncConfigBtn.addEventListener("click", saveSyncConfig);
  els.pushCloudBtn.addEventListener("click", pushCloudBackup);
  els.pullCloudBtn.addEventListener("click", pullCloudBackup);
  els.scrollToEntryBtn.addEventListener("click", () => els.entrySection.scrollIntoView({ behavior: "smooth" }));
  els.installBtn.addEventListener("click", installApp);
  document.querySelectorAll(".chip-button").forEach((button) => {
    button.addEventListener("click", () => {
      els.entryInput.value = els.entryInput.value.trim() ? `${els.entryInput.value.trim()}\n${button.dataset.template}` : button.dataset.template;
      renderPreview();
    });
  });
  els.reportTabs.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.reportType = tab.dataset.type;
      els.reportTabs.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderDashboard();
    });
  });
}

function setupVoice() {
  if (!SpeechRecognition) {
    els.voiceBtn.disabled = true;
    els.mobileVoiceBtn.disabled = true;
    els.voiceStatus.textContent = "当前浏览器不支持语音识别，请使用 Chrome 或 Edge。";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.onstart = () => {
    isListening = true;
    setVoiceButtons(true);
    els.voiceStatus.textContent = "正在听写，请直接说出消费内容。";
  };
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((item) => item[0].transcript).join("").trim();
    if (!transcript) return;
    els.entryInput.value = els.entryInput.value.trim() ? `${els.entryInput.value.trim()}\n${transcript}` : transcript;
    renderPreview();
  };
  recognition.onerror = (event) => {
    els.voiceStatus.textContent = `语音识别失败：${event.error || "未知错误"}`;
    setVoiceButtons(false);
  };
  recognition.onend = () => {
    if (isListening) els.voiceStatus.textContent = "语音录入结束，文本已追加到输入框。";
    setVoiceButtons(false);
  };
}

function toggleVoice() {
  if (!recognition) return;
  if (isListening) recognition.stop();
  else recognition.start();
}

function setVoiceButtons(listening) {
  isListening = listening;
  [[els.voiceBtn, listening ? "停止语音录入" : "开始语音录入"], [els.mobileVoiceBtn, listening ? "停止" : "语音"]].forEach(([button, text]) => {
    button.textContent = text;
    button.classList.toggle("is-listening", listening);
  });
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    els.installBtn.hidden = true;
  });
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installBtn.hidden = true;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}

function saveSyncConfig() {
  state.sync = { token: els.gistTokenInput.value.trim(), gistId: els.gistIdInput.value.trim() };
  localStorage.setItem(SYNC_KEY, JSON.stringify(state.sync));
  updateSyncStatus("同步配置已保存在当前浏览器。");
}

async function pushCloudBackup() {
  const token = els.gistTokenInput.value.trim();
  if (!token) return window.alert("请先填写 GitHub Token。");
  updateSyncStatus("正在上传到云端...");
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), records: state.records }, null, 2);
  try {
    let gistId = els.gistIdInput.value.trim();
    if (gistId) {
      await gistRequest(`https://api.github.com/gists/${gistId}`, token, "PATCH", { files: { [GIST_FILENAME]: { content } } });
    } else {
      const created = await gistRequest("https://api.github.com/gists", token, "POST", { description: "Smart Ledger cloud backup", public: false, files: { [GIST_FILENAME]: { content } } });
      gistId = created.id;
      els.gistIdInput.value = gistId;
    }
    state.sync = { token, gistId };
    localStorage.setItem(SYNC_KEY, JSON.stringify(state.sync));
    updateSyncStatus(`云端同步成功，Gist ID：${gistId}`);
  } catch (error) {
    updateSyncStatus(`云端上传失败：${error.message}`);
  }
}

async function pullCloudBackup() {
  const token = els.gistTokenInput.value.trim();
  const gistId = els.gistIdInput.value.trim();
  if (!token || !gistId) return window.alert("请先填写 GitHub Token 和 Gist ID。");
  updateSyncStatus("正在从云端拉取数据...");
  try {
    const gist = await gistRequest(`https://api.github.com/gists/${gistId}`, token, "GET");
    const data = JSON.parse(gist.files?.[GIST_FILENAME]?.content || "{}");
    state.records = normalizeRecords(data.records || []);
    persistRecords();
    renderAll();
    updateSyncStatus(`云端数据已拉取，共 ${state.records.length} 天记录。`);
  } catch (error) {
    updateSyncStatus(`云端拉取失败：${error.message}`);
  }
}

function gistRequest(url, token, method, body) {
  return fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(async (response) => {
    if (!response.ok) throw new Error(await response.text() || `请求失败 (${response.status})`);
    return response.json();
  });
}

function exportJson() {
  downloadFile(`智能记账备份-${formatDate(new Date())}.json`, JSON.stringify({ records: state.records }, null, 2), "application/json;charset=utf-8;");
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    state.records = normalizeRecords(data.records || []);
    persistRecords();
    renderAll();
    window.alert("JSON 备份已导入。");
  } catch (error) {
    window.alert(`导入失败：${error.message}`);
  }
  event.target.value = "";
}

function loadEntryForDate(date) {
  const record = state.records.find((item) => item.date === date);
  els.payerName.value = record?.payer || "";
  els.entryInput.value = record ? record.items.map((item) => item.text).join("\n") : "";
  renderPreview();
}

function parseLedgerInput(rawText) {
  return rawText.split(/\n|；|;|。|，/).map((line) => line.trim()).filter(Boolean).map(parseLine).filter(Boolean);
}

function parseLine(line) {
  const amountMatch = line.match(/(-?\d+(?:\.\d{1,2})?)\s*(元|块|块钱|rmb|RMB)?/);
  if (!amountMatch) return null;
  const amount = Math.abs(Number(amountMatch[1]));
  if (!amount) return null;
  const type = /(工资|薪资|奖金|报销|退款|收入|到账|收到|返现|红包)/.test(line) ? "income" : "expense";
  return { id: createId(), text: line.replace(/\s+/g, " ").trim(), amount, type, category: classify(line, type) };
}

function classify(text, type) {
  if (type === "income") return "salary";
  const lower = text.toLowerCase();
  return Object.keys(CATEGORY_KEYWORDS).find((key) => CATEGORY_KEYWORDS[key].some((word) => lower.includes(word.toLowerCase()))) || "other";
}

function saveCurrentEntry() {
  const items = parseLedgerInput(els.entryInput.value);
  if (!els.entryDate.value || !items.length) return window.alert("请选择日期，并至少输入一条包含金额的记账内容。");
  const next = { date: els.entryDate.value, payer: els.payerName.value.trim(), items };
  const index = state.records.findIndex((item) => item.date === next.date);
  if (index >= 0) state.records[index] = next;
  else state.records.push(next);
  state.records = normalizeRecords(state.records);
  persistRecords();
  renderAll();
  window.alert("记账记录已保存。");
}

function renderAll() {
  renderPreview();
  renderRecords();
  renderDashboard();
}

function renderPreview() {
  const items = parseLedgerInput(els.entryInput.value);
  if (!items.length) {
    els.previewList.className = "preview-list empty-state";
    els.previewList.textContent = "输入内容后，这里会展示自动识别结果。";
    return;
  }
  els.previewList.className = "preview-list";
  els.previewList.innerHTML = items.map((item) => `<div class="preview-item"><p>${escapeHtml(item.text)}</p>${renderTypePill(item.type)}<div class="amount-text ${item.type}">${formatCurrency(item.amount)}</div>${renderTag(item.category)}</div>`).join("");
}

function renderRecords() {
  if (!state.records.length) {
    els.recordsContainer.className = "records-list empty-state";
    els.recordsContainer.textContent = "还没有记账记录，先新增一笔试试。";
    updateHeroStats();
    return;
  }
  els.recordsContainer.className = "records-list";
  els.recordsContainer.innerHTML = "";
  state.records.forEach((record) => {
    const fragment = els.recordTemplate.content.cloneNode(true);
    fragment.querySelector(".record-date").textContent = formatDisplayDate(record.date);
    fragment.querySelector(".record-payer").textContent = record.payer ? `付款人：${record.payer}` : "未填写付款人";
    const itemsContainer = fragment.querySelector(".record-items");
    record.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "record-item";
      row.innerHTML = `<div class="record-main"><strong>${escapeHtml(item.text)}</strong><span>${TYPE_LABEL[item.type]} · ${CATEGORY_META[item.category].label}</span></div>${renderTypePill(item.type)}<div class="amount-text ${item.type}">${formatCurrency(item.amount)}</div>${renderCategorySelect(item.category, item.id)}${renderTag(item.category)}`;
      itemsContainer.appendChild(row);
    });
    fragment.querySelector(".record-delete").addEventListener("click", () => deleteRecord(record.date));
    els.recordsContainer.appendChild(fragment);
  });
  document.querySelectorAll(".record-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const itemId = event.target.dataset.itemId;
      state.records = state.records.map((record) => ({ ...record, items: record.items.map((item) => item.id === itemId ? { ...item, category: event.target.value } : item) }));
      persistRecords();
      renderAll();
    });
  });
  updateHeroStats();
}

function deleteRecord(date) {
  if (!window.confirm(`确认删除 ${date} 的记账记录吗？`)) return;
  state.records = state.records.filter((record) => record.date !== date);
  persistRecords();
  if (els.entryDate.value === date) {
    els.entryInput.value = "";
    els.payerName.value = "";
  }
  renderAll();
}

function clearAllData() {
  if (!window.confirm("确认清空所有本地记账数据吗？此操作不可撤销。")) return;
  state.records = [];
  persistRecords();
  els.entryInput.value = "";
  els.payerName.value = "";
  renderAll();
}

function renderDashboard() {
  const report = buildReport();
  els.statsGrid.innerHTML = [
    ["统计区间", report.rangeText],
    ["总支出", formatCurrency(report.totalExpense)],
    ["总收入", formatCurrency(report.totalIncome)],
    ["结余", formatCurrency(report.net)]
  ].map(([label, value]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join("");
  els.insightCards.innerHTML = report.insights.map((item) => `<article class="insight-card"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body)}</p></article>`).join("");
  renderBarChart(els.categoryChart, report.categoryCounts, "当前区间还没有可展示的支出分类数据。");
  renderBarChart(els.timelineChart, report.timeline, "当前区间还没有可展示的日期消费走势。", true);
  renderSummaryTable(report);
  els.reportText.value = report.text;
  updateHeroStats();
}

function buildReport() {
  const filtered = filterRecords(state.reportType, els.reportDate.value);
  const items = filtered.flatMap((record) => record.items.map((item) => ({ ...item, date: record.date, payer: record.payer })));
  const expenseItems = items.filter((item) => item.type === "expense");
  const incomeItems = items.filter((item) => item.type === "income");
  const totalExpense = sumAmount(expenseItems);
  const totalIncome = sumAmount(incomeItems);
  const categoryCounts = Object.entries(CATEGORY_META)
    .map(([key, meta]) => ({ label: meta.label, amount: sumAmount(expenseItems.filter((item) => item.category === key)) }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const timeline = filtered
    .map((record) => ({ label: formatShortDate(record.date), amount: sumAmount(record.items.filter((item) => item.type === "expense")) }))
    .filter((item) => item.amount > 0);
  const topCategory = categoryCounts[0];
  const topDay = [...timeline].sort((a, b) => b.amount - a.amount)[0];
  const insights = !filtered.length
    ? [{ title: "等待数据", body: "当前区间还没有记录，先记几笔账，系统就会生成月报洞察。" }]
    : [
        { title: "消费焦点", body: topCategory ? `${topCategory.label} 是当前最高支出分类，占总支出的 ${(topCategory.amount / Math.max(totalExpense, 1) * 100).toFixed(1)}%。` : "本期没有支出数据。" },
        { title: "异常提醒", body: topDay ? `${topDay.label} 是支出峰值日，建议重点复盘当天消费。` : "本期没有明显波动。" },
        { title: "结构建议", body: totalIncome >= totalExpense ? "当前收支保持正向结余，建议给高频分类设置预算上限。" : "当前结余为负，建议先收紧餐饮、购物等弹性支出。" }
      ];
  const summaryRows = filtered.map((record) => ({
    date: record.date,
    payer: record.payer || "-",
    expenseAmount: sumAmount(record.items.filter((item) => item.type === "expense")),
    incomeAmount: sumAmount(record.items.filter((item) => item.type === "income")),
    categories: summarizeCategories(record.items),
    items: record.items.map((item) => `[${TYPE_LABEL[item.type]}][${CATEGORY_META[item.category].label}] ${item.text} ${formatCurrency(item.amount)}`).join("\n")
  }));
  const rangeText = getDateRangeText(state.reportType, els.reportDate.value);
  const text = [
    `${getReportTypeLabel(state.reportType)}消费摘要`,
    `统计区间：${rangeText}`,
    `总支出：${formatCurrency(totalExpense)}`,
    `总收入：${formatCurrency(totalIncome)}`,
    `结余：${formatCurrency(totalIncome - totalExpense)}`,
    "",
    "AI 洞察：",
    ...insights.map((item) => `- ${item.title}：${item.body}`),
    "",
    "明细：",
    ...summaryRows.map((row) => `${formatDisplayDate(row.date)}${row.payer !== "-" ? ` / ${row.payer}` : ""}\n${row.items}`)
  ].join("\n");
  return { summaryRows, rangeText, totalExpense, totalIncome, net: totalIncome - totalExpense, insights, categoryCounts, timeline, text };
}

function filterRecords(type, baseDate) {
  if (!baseDate) return [];
  const target = new Date(`${baseDate}T00:00:00`);
  return state.records.filter((record) => {
    const date = new Date(`${record.date}T00:00:00`);
    if (type === "daily") return record.date === baseDate;
    if (type === "weekly") {
      const start = new Date(target);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return date >= stripTime(start) && date <= stripTime(end);
    }
    return record.date.slice(0, 7) === baseDate.slice(0, 7);
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function renderBarChart(root, rows, emptyText, alt = false) {
  if (!rows.length) {
    root.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }
  const max = Math.max(...rows.map((item) => item.amount));
  root.innerHTML = rows.map((item) => `<div class="bar-row"><div class="bar-label">${escapeHtml(item.label)}</div><div class="bar-track"><div class="bar-fill${alt ? " alt" : ""}" style="width:${item.amount / max * 100}%"></div></div><div class="bar-value">${formatCurrency(item.amount)}</div></div>`).join("");
}

function renderSummaryTable(report) {
  els.summaryTable.querySelector("thead").innerHTML = "<tr><th>日期</th><th>付款人</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr>";
  els.summaryTable.querySelector("tbody").innerHTML = report.summaryRows.length
    ? report.summaryRows.map((row) => `<tr><td>${formatDisplayDate(row.date)}</td><td>${escapeHtml(row.payer)}</td><td>${formatCurrency(row.expenseAmount)}</td><td>${formatCurrency(row.incomeAmount)}</td><td>${escapeHtml(row.categories)}</td><td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td></tr>`).join("")
    : '<tr><td colspan="6">当前区间还没有记账记录。</td></tr>';
}

function updateHeroStats() {
  const monthItems = filterRecords("monthly", els.reportDate.value).flatMap((record) => record.items);
  const expenses = monthItems.filter((item) => item.type === "expense");
  const incomes = monthItems.filter((item) => item.type === "income");
  els.monthExpense.textContent = formatCurrency(sumAmount(expenses));
  els.monthIncome.textContent = formatCurrency(sumAmount(incomes));
  els.monthBalance.textContent = formatCurrency(sumAmount(incomes) - sumAmount(expenses));
  els.activeCategories.textContent = String(new Set(expenses.map((item) => item.category)).size);
}

function summarizeCategories(items) {
  const groups = {};
  items.filter((item) => item.type === "expense").forEach((item) => {
    groups[item.category] = (groups[item.category] || 0) + item.amount;
  });
  return Object.keys(groups).length
    ? Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${CATEGORY_META[key].label} ${formatCurrency(value)}`).join(" / ")
    : "仅收入";
}

function normalizeRecords(records) {
  return records
    .map((record) => ({
      date: record.date,
      payer: record.payer || "",
      items: (record.items || [])
        .map((item) => ({
          id: item.id || createId(),
          text: String(item.text || "").trim(),
          amount: Number(item.amount || 0),
          type: item.type === "income" ? "income" : "expense",
          category: CATEGORY_META[item.category] ? item.category : "other"
        }))
        .filter((item) => item.text && item.amount > 0)
    }))
    .filter((record) => record.date && record.items.length)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function updateSyncStatus(message) {
  els.syncStatus.textContent = message || (!state.sync.token ? "还没有配置云同步。" : !state.sync.gistId ? "Token 已保存，首次上传时会自动创建 Gist。" : `已连接云端账本：${state.sync.gistId}`);
}

function renderTag(category) {
  return `<span class="tag ${CATEGORY_META[category].className}">${CATEGORY_META[category].label}</span>`;
}

function renderTypePill(type) {
  return `<span class="type-pill ${type}">${TYPE_LABEL[type]}</span>`;
}

function renderCategorySelect(category, itemId) {
  return `<select class="record-select" data-item-id="${itemId}">${Object.entries(CATEGORY_META).map(([key, meta]) => `<option value="${key}" ${key === category ? "selected" : ""}>${meta.label}</option>`).join("")}</select>`;
}

function exportCsv() {
  const report = buildReport();
  if (!report.summaryRows.length) return window.alert("当前报表没有可导出的数据。");
  const rows = [["日期", "付款人", "支出", "收入", "分类概览", "明细"], ...report.summaryRows.map((row) => [formatDisplayDate(row.date), row.payer, row.expenseAmount.toFixed(2), row.incomeAmount.toFixed(2), row.categories, row.items.replace(/\n/g, " | ")])];
  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.csv`, `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`, "text/csv;charset=utf-8;");
}

function exportHtml() {
  const report = buildReport();
  if (!report.summaryRows.length) return window.alert("当前报表没有可导出的数据。");
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${getReportTypeLabel(state.reportType)}消费摘要</title><style>body{font-family:"Microsoft YaHei",sans-serif;padding:32px;color:#222}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #ddd;padding:10px;text-align:left;vertical-align:top}th{background:#f5f5f5}.report-text{white-space:pre-wrap;margin-top:24px;background:#fafafa;padding:16px;border:1px solid #eee}</style></head><body><h1>${getReportTypeLabel(state.reportType)}消费摘要</h1><p>统计区间：${report.rangeText}</p><table><thead><tr><th>日期</th><th>付款人</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr></thead><tbody>${report.summaryRows.map((row) => `<tr><td>${formatDisplayDate(row.date)}</td><td>${escapeHtml(row.payer)}</td><td>${formatCurrency(row.expenseAmount)}</td><td>${formatCurrency(row.incomeAmount)}</td><td>${escapeHtml(row.categories)}</td><td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td></tr>`).join("")}</tbody></table><div class="report-text">${escapeHtml(report.text)}</div></body></html>`;
  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.html`, html, "text/html;charset=utf-8;");
}

function getReportTypeLabel(type) {
  return ({ daily: "日", weekly: "周", monthly: "月" })[type] || "报表";
}

function getDateRangeText(type, baseDate) {
  const target = new Date(`${baseDate}T00:00:00`);
  if (type === "daily") return formatDisplayDate(baseDate);
  if (type === "weekly") {
    const start = new Date(target);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatDisplayDate(formatDate(start))} - ${formatDisplayDate(formatDate(end))}`;
  }
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function q(selector) {
  return document.querySelector(selector);
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateString) {
  return formatDate(new Date(`${dateString}T00:00:00`));
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
