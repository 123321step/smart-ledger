const STORAGE_KEY = "smart-ledger-v1";

const CATEGORY_MAP = {
  food: { label: "餐饮", className: "tag-food", keywords: ["早餐", "午饭", "晚饭", "夜宵", "咖啡", "奶茶", "餐", "吃饭", "外卖", "买菜", "水果", "零食"] },
  transport: { label: "交通", className: "tag-transport", keywords: ["地铁", "公交", "高铁", "机票", "打车", "滴滴", "出租车", "停车", "加油", "过路费"] },
  shopping: { label: "购物", className: "tag-shopping", keywords: ["购物", "买衣服", "淘宝", "日用品", "超市", "京东", "拼多多", "鞋", "护肤", "化妆品"] },
  housing: { label: "居住", className: "tag-housing", keywords: ["房租", "物业", "水费", "电费", "燃气", "网费", "宽带", "家居"] },
  entertainment: { label: "娱乐", className: "tag-entertainment", keywords: ["电影", "游戏", "旅游", "聚会", "演出", "唱歌", "景点", "会员"] },
  medical: { label: "医疗", className: "tag-medical", keywords: ["挂号", "药", "医院", "体检", "看病", "牙", "诊所"] },
  learning: { label: "学习", className: "tag-learning", keywords: ["书", "课程", "培训", "学费", "知识星球", "学习", "考试"] },
  salary: { label: "收入", className: "tag-salary", keywords: ["工资", "薪资", "奖金", "报销", "退款", "收入", "到账", "转账给我"] },
  other: { label: "其他", className: "tag-other", keywords: [] }
};

const TYPE_LABEL = {
  expense: "支出",
  income: "收入"
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const els = {
  entryDate: document.querySelector("#entryDate"),
  payerName: document.querySelector("#payerName"),
  entryInput: document.querySelector("#entryInput"),
  voiceBtn: document.querySelector("#voiceBtn"),
  voiceStatus: document.querySelector("#voiceStatus"),
  saveEntryBtn: document.querySelector("#saveEntryBtn"),
  previewBtn: document.querySelector("#previewBtn"),
  previewList: document.querySelector("#previewList"),
  recordsContainer: document.querySelector("#recordsContainer"),
  reportTabs: document.querySelector("#reportTabs"),
  reportDate: document.querySelector("#reportDate"),
  statsGrid: document.querySelector("#statsGrid"),
  categoryChart: document.querySelector("#categoryChart"),
  timelineChart: document.querySelector("#timelineChart"),
  summaryTable: document.querySelector("#summaryTable"),
  reportText: document.querySelector("#reportText"),
  clearAllBtn: document.querySelector("#clearAllBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportHtmlBtn: document.querySelector("#exportHtmlBtn"),
  printBtn: document.querySelector("#printBtn"),
  loadTodayBtn: document.querySelector("#loadTodayBtn"),
  monthExpense: document.querySelector("#monthExpense"),
  monthCount: document.querySelector("#monthCount"),
  activeCategories: document.querySelector("#activeCategories"),
  recordTemplate: document.querySelector("#recordTemplate")
};

let recognition = null;
let isListening = false;

let state = {
  records: loadRecords(),
  reportType: "monthly"
};

init();

function init() {
  const today = formatDate(new Date());
  els.entryDate.value = today;
  els.reportDate.value = today;
  setupVoiceRecognition();
  bindEvents();
  loadEntryForDate(today);
  renderPreview();
  renderRecords();
  renderDashboard();
}

function bindEvents() {
  els.previewBtn.addEventListener("click", renderPreview);
  els.saveEntryBtn.addEventListener("click", saveCurrentEntry);
  els.entryInput.addEventListener("input", debounce(renderPreview, 180));
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
  els.printBtn.addEventListener("click", () => window.print());
  els.voiceBtn.addEventListener("click", handleVoiceInput);

  els.reportTabs.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.reportType = tab.dataset.type;
      els.reportTabs.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderDashboard();
    });
  });
}

function setupVoiceRecognition() {
  if (!SpeechRecognition) {
    els.voiceBtn.disabled = true;
    els.voiceStatus.textContent = "当前浏览器不支持语音识别，请使用 Chrome/Edge 新版浏览器。";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    els.voiceBtn.textContent = "停止语音录入";
    els.voiceBtn.classList.add("is-listening");
    els.voiceStatus.textContent = "正在听写，请直接说出消费内容。";
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join("");

    if (!transcript.trim()) {
      return;
    }

    const currentText = els.entryInput.value.trim();
    const nextText = currentText ? `${currentText}\n${transcript.trim()}` : transcript.trim();
    els.entryInput.value = nextText;
    renderPreview();
  };

  recognition.onerror = (event) => {
    els.voiceStatus.textContent = `语音识别失败：${event.error || "未知错误"}`;
    resetVoiceButton();
  };

  recognition.onend = () => {
    if (isListening) {
      els.voiceStatus.textContent = "语音录入结束，已追加到输入框。";
    }
    resetVoiceButton();
  };
}

function handleVoiceInput() {
  if (!recognition) {
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  recognition.start();
}

function resetVoiceButton() {
  isListening = false;
  els.voiceBtn.textContent = "开始语音录入";
  els.voiceBtn.classList.remove("is-listening");
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch (error) {
    console.error("读取本地记账数据失败", error);
    return [];
  }
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function loadEntryForDate(date) {
  const record = state.records.find((item) => item.date === date);
  els.payerName.value = record?.payer ?? "";
  els.entryInput.value = record ? record.items.map((item) => item.text).join("\n") : "";
  renderPreview();
}

function parseLedgerInput(rawText) {
  return splitRawText(rawText)
    .map((line) => parseLineToLedgerItem(line))
    .filter(Boolean);
}

function splitRawText(rawText) {
  return rawText
    .split(/\n|；|;|。|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLineToLedgerItem(line) {
  const amountMatch = line.match(/(-?\d+(?:\.\d{1,2})?)\s*(元|块|块钱|rmb|RMB)?/);
  if (!amountMatch) {
    return null;
  }

  const amount = Math.abs(Number(amountMatch[1]));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const type = inferLedgerType(line);
  const category = classifyLedgerText(line, type);
  const cleanedText = line.replace(/\s+/g, " ").trim();

  return {
    id: createId(),
    text: cleanedText,
    amount,
    type,
    category
  };
}

function inferLedgerType(text) {
  const incomeKeywords = ["工资", "薪资", "奖金", "退款", "报销", "收入", "到账", "收到", "进账", "返现"];
  return incomeKeywords.some((word) => text.includes(word)) ? "income" : "expense";
}

function classifyLedgerText(text, type) {
  if (type === "income") {
    return "salary";
  }

  const normalized = text.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORY_MAP)) {
    if (config.keywords.some((word) => normalized.includes(word.toLowerCase()))) {
      return key;
    }
  }
  return "other";
}

function renderPreview() {
  const items = parseLedgerInput(els.entryInput.value);
  if (!items.length) {
    els.previewList.className = "preview-list empty-state";
    els.previewList.textContent = "输入内容后，这里会展示自动识别结果。";
    return;
  }

  els.previewList.className = "preview-list";
  els.previewList.innerHTML = items.map((item) => `
    <div class="preview-item">
      <p>${escapeHtml(item.text)}</p>
      ${renderTypePill(item.type)}
      <div class="amount-text ${item.type}">${formatCurrency(item.amount)}</div>
      ${renderTag(item.category)}
    </div>
  `).join("");
}

function saveCurrentEntry() {
  const date = els.entryDate.value;
  const payer = els.payerName.value.trim();
  const items = parseLedgerInput(els.entryInput.value);

  if (!date || !items.length) {
    window.alert("请选择日期，并至少输入一条包含金额的记账内容。");
    return;
  }

  const record = { date, payer, items };
  const existingIndex = state.records.findIndex((item) => item.date === date);
  if (existingIndex >= 0) {
    state.records[existingIndex] = record;
  } else {
    state.records.push(record);
  }

  state.records.sort((a, b) => b.date.localeCompare(a.date));
  persistRecords();
  renderRecords();
  renderDashboard();
  window.alert("记账记录已保存。");
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
      row.innerHTML = `
        <div class="record-main">
          <strong>${escapeHtml(item.text)}</strong>
          <span>${TYPE_LABEL[item.type]} · ${escapeHtml(CATEGORY_MAP[item.category].label)}</span>
        </div>
        ${renderTypePill(item.type)}
        <div class="amount-text ${item.type}">${formatCurrency(item.amount)}</div>
        ${renderCategorySelect(item.category, item.id)}
        ${renderTag(item.category)}
      `;
      itemsContainer.appendChild(row);
    });

    fragment.querySelector(".record-delete").addEventListener("click", () => deleteRecord(record.date));
    els.recordsContainer.appendChild(fragment);
  });

  bindRecordEvents();
  updateHeroStats();
}

function bindRecordEvents() {
  document.querySelectorAll(".record-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const itemId = event.target.dataset.itemId;
      const newCategory = event.target.value;
      state.records = state.records.map((record) => ({
        ...record,
        items: record.items.map((item) => item.id === itemId ? { ...item, category: newCategory } : item)
      }));
      persistRecords();
      renderRecords();
      renderDashboard();
    });
  });
}

function deleteRecord(date) {
  if (!window.confirm(`确认删除 ${date} 的记账记录吗？`)) {
    return;
  }

  state.records = state.records.filter((record) => record.date !== date);
  persistRecords();
  if (els.entryDate.value === date) {
    els.entryInput.value = "";
    els.payerName.value = "";
    renderPreview();
  }
  renderRecords();
  renderDashboard();
}

function clearAllData() {
  if (!window.confirm("确认清空所有本地记账数据吗？此操作不可撤销。")) {
    return;
  }

  state.records = [];
  persistRecords();
  els.entryInput.value = "";
  els.payerName.value = "";
  renderPreview();
  renderRecords();
  renderDashboard();
}

function updateHeroStats() {
  const currentMonth = els.reportDate.value.slice(0, 7);
  const monthItems = state.records
    .filter((record) => record.date.startsWith(currentMonth))
    .flatMap((record) => record.items);
  const expenseItems = monthItems.filter((item) => item.type === "expense");
  const activeCategories = new Set(expenseItems.map((item) => item.category));

  els.monthExpense.textContent = formatCurrency(sumAmount(expenseItems));
  els.monthCount.textContent = String(monthItems.length);
  els.activeCategories.textContent = String(activeCategories.size);
}

function renderDashboard() {
  const report = buildReport(state.reportType, els.reportDate.value);
  renderStats(report);
  renderCategoryChart(report.categoryCounts);
  renderTimelineChart(report.timeline);
  renderSummaryTable(report);
  els.reportText.value = report.text;
  updateHeroStats();
}

function buildReport(type, baseDate) {
  const filtered = filterRecordsByType(type, baseDate);
  const items = filtered.flatMap((record) => record.items.map((item) => ({ ...item, date: record.date, payer: record.payer })));
  const expenseItems = items.filter((item) => item.type === "expense");
  const incomeItems = items.filter((item) => item.type === "income");

  const categoryCounts = Object.keys(CATEGORY_MAP)
    .map((key) => ({
      key,
      label: CATEGORY_MAP[key].label,
      amount: sumAmount(expenseItems.filter((item) => item.category === key))
    }))
    .filter((item) => item.amount > 0);

  const timeline = filtered.map((record) => ({
    label: formatShortDate(record.date),
    amount: sumAmount(record.items.filter((item) => item.type === "expense"))
  }));

  const summaryRows = filtered.map((record) => {
    const expenseAmount = sumAmount(record.items.filter((item) => item.type === "expense"));
    const incomeAmount = sumAmount(record.items.filter((item) => item.type === "income"));
    return {
      date: record.date,
      payer: record.payer || "-",
      expenseAmount,
      incomeAmount,
      categories: summarizeCategories(record.items),
      items: record.items
        .map((item) => `[${TYPE_LABEL[item.type]}][${CATEGORY_MAP[item.category].label}] ${item.text} ${formatCurrency(item.amount)}`)
        .join("\n")
    };
  });

  const topCategory = [...categoryCounts].sort((a, b) => b.amount - a.amount)[0];
  const totalExpense = sumAmount(expenseItems);
  const totalIncome = sumAmount(incomeItems);
  const net = totalIncome - totalExpense;
  const dateRangeText = getDateRangeText(type, baseDate);

  const text = [
    `${getReportTypeLabel(type)}消费摘要`,
    `统计区间：${dateRangeText}`,
    `记录天数：${filtered.length} 天`,
    `总支出：${formatCurrency(totalExpense)}`,
    `总收入：${formatCurrency(totalIncome)}`,
    `结余：${formatCurrency(net)}`,
    `最高支出分类：${topCategory ? `${topCategory.label}（${formatCurrency(topCategory.amount)}）` : "暂无数据"}`,
    "",
    "分类支出：",
    ...categoryCounts.map((item) => `- ${item.label}：${formatCurrency(item.amount)}`),
    "",
    "明细：",
    ...summaryRows.map((row) => `${formatDisplayDate(row.date)}${row.payer !== "-" ? ` / ${row.payer}` : ""}\n${row.items}`)
  ].join("\n");

  return {
    type,
    dateRangeText,
    filtered,
    items,
    expenseItems,
    incomeItems,
    categoryCounts,
    timeline,
    summaryRows,
    totalExpense,
    totalIncome,
    net,
    text
  };
}

function filterRecordsByType(type, baseDate) {
  if (!baseDate) {
    return [];
  }

  const target = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return [];
  }

  return state.records
    .filter((record) => {
      const date = new Date(`${record.date}T00:00:00`);
      if (type === "daily") {
        return record.date === baseDate;
      }
      if (type === "weekly") {
        const start = new Date(target);
        const day = start.getDay() || 7;
        start.setDate(start.getDate() - day + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return date >= stripTime(start) && date <= stripTime(end);
      }
      return record.date.slice(0, 7) === baseDate.slice(0, 7);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function renderStats(report) {
  const stats = [
    { label: "统计区间", value: report.dateRangeText },
    { label: "总支出", value: formatCurrency(report.totalExpense) },
    { label: "总收入", value: formatCurrency(report.totalIncome) },
    { label: "结余", value: formatCurrency(report.net) }
  ];

  els.statsGrid.innerHTML = stats.map((item) => `
    <div class="stat-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join("");
}

function renderCategoryChart(categoryCounts) {
  if (!categoryCounts.length) {
    els.categoryChart.innerHTML = `<div class="empty-state">当前区间还没有可展示的支出分类数据。</div>`;
    return;
  }

  const max = Math.max(...categoryCounts.map((item) => item.amount));
  els.categoryChart.innerHTML = categoryCounts.map((item) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(item.label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.amount / max) * 100}%"></div></div>
      <div class="bar-value">${escapeHtml(formatCurrency(item.amount))}</div>
    </div>
  `).join("");
}

function renderTimelineChart(timeline) {
  const validTimeline = timeline.filter((item) => item.amount > 0);
  if (!validTimeline.length) {
    els.timelineChart.innerHTML = `<div class="empty-state">当前区间还没有可展示的日期消费走势。</div>`;
    return;
  }

  const max = Math.max(...validTimeline.map((item) => item.amount));
  els.timelineChart.innerHTML = validTimeline.map((item) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(item.label)}</div>
      <div class="bar-track"><div class="bar-fill alt" style="width:${(item.amount / max) * 100}%"></div></div>
      <div class="bar-value">${escapeHtml(formatCurrency(item.amount))}</div>
    </div>
  `).join("");
}

function renderSummaryTable(report) {
  const thead = els.summaryTable.querySelector("thead");
  const tbody = els.summaryTable.querySelector("tbody");

  thead.innerHTML = "<tr><th>日期</th><th>付款人</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr>";

  if (!report.summaryRows.length) {
    tbody.innerHTML = '<tr><td colspan="6">当前区间还没有记账记录。</td></tr>';
    return;
  }

  tbody.innerHTML = report.summaryRows.map((row) => `
    <tr>
      <td>${escapeHtml(formatDisplayDate(row.date))}</td>
      <td>${escapeHtml(row.payer)}</td>
      <td>${escapeHtml(formatCurrency(row.expenseAmount))}</td>
      <td>${escapeHtml(formatCurrency(row.incomeAmount))}</td>
      <td>${escapeHtml(row.categories)}</td>
      <td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td>
    </tr>
  `).join("");
}

function summarizeCategories(items) {
  const expenseGroups = items
    .filter((item) => item.type === "expense")
    .reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + item.amount;
      return accumulator;
    }, {});

  if (!Object.keys(expenseGroups).length) {
    return "仅收入";
  }

  return Object.entries(expenseGroups)
    .sort((a, b) => b[1] - a[1])
    .map(([key, amount]) => `${CATEGORY_MAP[key].label} ${formatCurrency(amount)}`)
    .join(" / ");
}

function renderTag(category) {
  const config = CATEGORY_MAP[category] || CATEGORY_MAP.other;
  return `<span class="tag ${config.className}">${config.label}</span>`;
}

function renderTypePill(type) {
  return `<span class="type-pill ${type}">${TYPE_LABEL[type]}</span>`;
}

function renderCategorySelect(category, itemId) {
  const options = Object.entries(CATEGORY_MAP).map(([key, config]) => `
    <option value="${key}" ${key === category ? "selected" : ""}>${config.label}</option>
  `).join("");
  return `<select class="record-select" data-item-id="${itemId}">${options}</select>`;
}

function exportCsv() {
  const report = buildReport(state.reportType, els.reportDate.value);
  if (!report.summaryRows.length) {
    window.alert("当前报表没有可导出的数据。");
    return;
  }

  const rows = [
    ["日期", "付款人", "支出", "收入", "分类概览", "明细"],
    ...report.summaryRows.map((row) => [
      formatDisplayDate(row.date),
      row.payer,
      row.expenseAmount.toFixed(2),
      row.incomeAmount.toFixed(2),
      row.categories,
      row.items.replace(/\n/g, " | ")
    ])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8;");
}

function exportHtml() {
  const report = buildReport(state.reportType, els.reportDate.value);
  if (!report.summaryRows.length) {
    window.alert("当前报表没有可导出的数据。");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${getReportTypeLabel(report.type)}消费摘要</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; padding: 32px; color: #222; }
    h1 { margin-bottom: 6px; }
    p { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    .meta { margin: 14px 0; line-height: 1.8; }
    .report-text { white-space: pre-wrap; margin-top: 24px; background: #fafafa; padding: 16px; border: 1px solid #eee; }
  </style>
</head>
<body>
  <h1>${getReportTypeLabel(report.type)}消费摘要</h1>
  <p>统计区间：${report.dateRangeText}</p>
  <div class="meta">
    <div>总支出：${formatCurrency(report.totalExpense)}</div>
    <div>总收入：${formatCurrency(report.totalIncome)}</div>
    <div>结余：${formatCurrency(report.net)}</div>
  </div>
  <table>
    <thead><tr><th>日期</th><th>付款人</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr></thead>
    <tbody>${report.summaryRows.map((row) => `
      <tr>
        <td>${formatDisplayDate(row.date)}</td>
        <td>${escapeHtml(row.payer)}</td>
        <td>${escapeHtml(formatCurrency(row.expenseAmount))}</td>
        <td>${escapeHtml(formatCurrency(row.incomeAmount))}</td>
        <td>${escapeHtml(row.categories)}</td>
        <td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="report-text">${escapeHtml(report.text)}</div>
</body>
</html>`;

  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.html`, html, "text/html;charset=utf-8;");
}

function getReportTypeLabel(type) {
  return ({ daily: "日", weekly: "周", monthly: "月" })[type] || "报表";
}

function getDateRangeText(type, baseDate) {
  const target = new Date(`${baseDate}T00:00:00`);
  if (type === "daily") {
    return formatDisplayDate(baseDate);
  }
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

function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
