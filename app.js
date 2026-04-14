const STORAGE_KEYS = {
  records: "smart-ledger-v3-records",
  budgets: "smart-ledger-v3-budgets",
  gist: "smart-ledger-v3-gist",
  ai: "smart-ledger-v3-ai",
  ledger: "smart-ledger-v3-ledger",
  ui: "smart-ledger-v3-ui"
};

const GIST_FILENAME = "smart-ledger-sync.json";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const CATEGORIES = {
  food: { label: "餐饮", className: "tag-food", keywords: ["早餐", "午饭", "晚饭", "夜宵", "咖啡", "奶茶", "外卖", "买菜", "水果", "零食"] },
  transport: { label: "交通", className: "tag-transport", keywords: ["地铁", "公交", "高铁", "机票", "打车", "滴滴", "出租车", "停车", "加油"] },
  shopping: { label: "购物", className: "tag-shopping", keywords: ["购物", "淘宝", "京东", "超市", "日用品", "衣服", "鞋", "护肤", "化妆品"] },
  housing: { label: "居住", className: "tag-housing", keywords: ["房租", "物业", "水费", "电费", "燃气", "网费", "宽带", "家居"] },
  entertainment: { label: "娱乐", className: "tag-entertainment", keywords: ["电影", "游戏", "旅游", "聚会", "演出", "KTV", "会员"] },
  medical: { label: "医疗", className: "tag-medical", keywords: ["挂号", "药", "医院", "体检", "看病", "牙", "诊所"] },
  learning: { label: "学习", className: "tag-learning", keywords: ["书", "课程", "培训", "学费", "学习", "考试"] },
  salary: { label: "收入", className: "tag-salary", keywords: ["工资", "薪资", "奖金", "报销", "退款", "收入", "到账", "收到", "返现"] },
  other: { label: "其他", className: "tag-other", keywords: [] }
};

const BUDGET_CATEGORIES = ["food", "transport", "shopping", "housing", "entertainment", "medical", "learning"];
const TYPE_LABEL = { expense: "支出", income: "收入" };

const els = {
  entrySection: q("#entrySection"),
  entryDate: q("#entryDate"),
  payerName: q("#payerName"),
  entryInput: q("#entryInput"),
  voiceBtn: q("#voiceBtn"),
  mobileVoiceBtn: q("#mobileVoiceBtn"),
  voiceStatus: q("#voiceStatus"),
  continuousVoiceBtn: q("#continuousVoiceBtn"),
  autoVoiceSaveBtn: q("#autoVoiceSaveBtn"),
  saveEntryBtn: q("#saveEntryBtn"),
  mobileSaveBtn: q("#mobileSaveBtn"),
  undoBtn: q("#undoBtn"),
  mobileUndoBtn: q("#mobileUndoBtn"),
  previewBtn: q("#previewBtn"),
  previewList: q("#previewList"),
  amountPad: q("#amountPad"),
  loadTodayBtn: q("#loadTodayBtn"),
  monthExpense: q("#monthExpense"),
  budgetAlerts: q("#budgetAlerts"),
  recordStreak: q("#recordStreak"),
  budgetForm: q("#budgetForm"),
  budgetSummary: q("#budgetSummary"),
  saveBudgetBtn: q("#saveBudgetBtn"),
  recordSearchInput: q("#recordSearchInput"),
  recordFilterSelect: q("#recordFilterSelect"),
  todayExpense: q("#todayExpense"),
  todaySummary: q("#todaySummary"),
  smartHomeSummary: q("#smartHomeSummary"),
  smartShortcutRail: q("#smartShortcutRail"),
  recordsContainer: q("#recordsContainer"),
  clearAllBtn: q("#clearAllBtn"),
  gistTokenInput: q("#gistTokenInput"),
  gistIdInput: q("#gistIdInput"),
  saveSyncConfigBtn: q("#saveSyncConfigBtn"),
  pushCloudBtn: q("#pushCloudBtn"),
  pullCloudBtn: q("#pullCloudBtn"),
  syncStatus: q("#syncStatus"),
  aiServiceUrlInput: q("#aiServiceUrlInput"),
  openaiApiKeyInput: q("#openaiApiKeyInput"),
  openaiModelInput: q("#openaiModelInput"),
  saveAiConfigBtn: q("#saveAiConfigBtn"),
  generateAiReportBtn: q("#generateAiReportBtn"),
  aiStatus: q("#aiStatus"),
  ledgerServiceUrlInput: q("#ledgerServiceUrlInput"),
  ledgerSpaceInput: q("#ledgerSpaceInput"),
  ledgerPassphraseInput: q("#ledgerPassphraseInput"),
  saveLedgerConfigBtn: q("#saveLedgerConfigBtn"),
  pushLedgerBtn: q("#pushLedgerBtn"),
  pullLedgerBtn: q("#pullLedgerBtn"),
  ledgerStatus: q("#ledgerStatus"),
  exportJsonBtn: q("#exportJsonBtn"),
  importJsonBtn: q("#importJsonBtn"),
  importJsonInput: q("#importJsonInput"),
  exportCsvBtn: q("#exportCsvBtn"),
  exportHtmlBtn: q("#exportHtmlBtn"),
  printBtn: q("#printBtn"),
  reportTabs: q("#reportTabs"),
  reportDate: q("#reportDate"),
  statsGrid: q("#statsGrid"),
  insightModeBadge: q("#insightModeBadge"),
  insightCards: q("#insightCards"),
  categoryChart: q("#categoryChart"),
  timelineChart: q("#timelineChart"),
  reportText: q("#reportText"),
  summaryTable: q("#summaryTable"),
  recordTemplate: q("#recordTemplate"),
  scrollToEntryBtn: q("#scrollToEntryBtn"),
  installBtn: q("#installBtn"),
  mobileNav: q("#mobileNav"),
  itemEditor: q("#itemEditor"),
  closeItemEditorBtn: q("#closeItemEditorBtn"),
  itemEditorDate: q("#itemEditorDate"),
  itemEditorPayer: q("#itemEditorPayer"),
  itemEditorText: q("#itemEditorText"),
  itemEditorAmount: q("#itemEditorAmount"),
  itemEditorType: q("#itemEditorType"),
  itemEditorCategory: q("#itemEditorCategory"),
  saveItemEditorBtn: q("#saveItemEditorBtn"),
  deleteItemBtn: q("#deleteItemBtn"),
  appToast: q("#appToast")
};

const state = {
  records: loadJson(STORAGE_KEYS.records, []),
  budgets: loadJson(STORAGE_KEYS.budgets, createDefaultBudgets()),
  gist: loadJson(STORAGE_KEYS.gist, { token: "", gistId: "" }),
  ai: loadJson(STORAGE_KEYS.ai, { serviceUrl: "", apiKey: "", model: "gpt-5" }),
  ledger: loadJson(STORAGE_KEYS.ledger, { serviceUrl: "", space: "", passphrase: "" }),
  ui: loadJson(STORAGE_KEYS.ui, { continuousVoiceEnabled: false, autoVoiceSaveEnabled: false }),
  reportType: "monthly",
  recordSearch: "",
  recordFilter: "all",
  mobileSection: "home",
  editingItemId: null,
  continuousVoiceEnabled: false,
  autoVoiceSaveEnabled: false,
  amountBuffer: "",
  history: []
};

let recognition = null;
let isListening = false;
let deferredInstallPrompt = null;
let voiceSessionText = "";
let manualVoiceStop = false;
let toastTimer = null;

init();

function init() {
  const today = formatDate(new Date());
  els.entryDate.value = today;
  els.reportDate.value = today;
  state.continuousVoiceEnabled = Boolean(state.ui.continuousVoiceEnabled);
  state.autoVoiceSaveEnabled = Boolean(state.ui.autoVoiceSaveEnabled);
  hydrateSettings();
  bindEvents();
  setupVoice();
  setupInstallPrompt();
  registerServiceWorker();
  loadEntryForDate(today);
  renderBudgetForm();
  renderItemEditorCategoryOptions();
  renderAll();
}

function bindEvents() {
  els.previewBtn.addEventListener("click", renderPreview);
  els.entryInput.addEventListener("input", debounce(renderPreview, 150));
  els.saveEntryBtn.addEventListener("click", () => saveCurrentEntry());
  els.mobileSaveBtn.addEventListener("click", () => saveCurrentEntry());
  els.voiceBtn.addEventListener("click", toggleVoice);
  els.mobileVoiceBtn.addEventListener("click", toggleVoice);
  els.continuousVoiceBtn.addEventListener("click", toggleContinuousVoice);
  els.autoVoiceSaveBtn.addEventListener("click", toggleAutoVoiceSave);
  els.undoBtn.addEventListener("click", undoLastAction);
  els.mobileUndoBtn.addEventListener("click", undoLastAction);
  els.loadTodayBtn.addEventListener("click", () => {
    const today = formatDate(new Date());
    els.entryDate.value = today;
    loadEntryForDate(today);
  });
  els.entryDate.addEventListener("change", () => loadEntryForDate(els.entryDate.value));
  els.saveBudgetBtn.addEventListener("click", saveBudgets);
  els.recordSearchInput.addEventListener("input", (event) => {
    state.recordSearch = event.target.value.trim().toLowerCase();
    renderRecords();
  });
  els.recordFilterSelect.addEventListener("change", (event) => {
    state.recordFilter = event.target.value;
    renderRecords();
  });
  els.clearAllBtn.addEventListener("click", clearAllData);
  els.saveSyncConfigBtn.addEventListener("click", saveGistConfig);
  els.pushCloudBtn.addEventListener("click", pushCloudBackup);
  els.pullCloudBtn.addEventListener("click", pullCloudBackup);
  els.saveAiConfigBtn.addEventListener("click", saveAiConfig);
  els.generateAiReportBtn.addEventListener("click", generateAiReport);
  els.saveLedgerConfigBtn.addEventListener("click", saveLedgerConfig);
  els.pushLedgerBtn.addEventListener("click", pushLedgerData);
  els.pullLedgerBtn.addEventListener("click", pullLedgerData);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.importJsonBtn.addEventListener("click", () => els.importJsonInput.click());
  els.importJsonInput.addEventListener("change", importJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportHtmlBtn.addEventListener("click", exportHtml);
  els.printBtn.addEventListener("click", () => window.print());
  els.reportDate.addEventListener("change", renderAll);
  els.scrollToEntryBtn?.addEventListener("click", () => showSection("entry", true));
  els.installBtn.addEventListener("click", installApp);
  document.querySelectorAll(".shortcut-card").forEach((button) => {
    button.addEventListener("click", () => {
      useTemplate(button.dataset.template);
    });
  });
  els.smartShortcutRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-smart-template]");
    if (!button) return;
    useTemplate(button.dataset.smartTemplate);
  });
  document.querySelectorAll("[data-amount-value]").forEach((button) => {
    button.addEventListener("click", () => applyQuickAmount(button.dataset.amountValue));
  });
  els.amountPad.addEventListener("click", (event) => {
    const key = event.target.dataset.key;
    if (!key) return;
    updateAmountBuffer(key);
  });
  els.reportTabs.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.reportType = tab.dataset.type;
      els.reportTabs.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderAll();
    });
  });
  els.mobileNav.querySelectorAll(".mobile-nav-btn").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.target));
  });
  els.recordsContainer.addEventListener("click", handleRecordActions);
  els.recordsContainer.addEventListener("change", handleRecordActions);
  els.closeItemEditorBtn.addEventListener("click", closeItemEditor);
  els.saveItemEditorBtn.addEventListener("click", saveEditedItem);
  els.deleteItemBtn.addEventListener("click", deleteEditingItem);
  els.itemEditorType.addEventListener("change", syncItemEditorCategory);
  els.itemEditor.addEventListener("click", (event) => {
    if (event.target === els.itemEditor) closeItemEditor();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.itemEditor.hidden) closeItemEditor();
  });
  window.addEventListener("resize", syncMobileSection);
}

function hydrateSettings() {
  els.gistTokenInput.value = state.gist.token || "";
  els.gistIdInput.value = state.gist.gistId || "";
  els.aiServiceUrlInput.value = state.ai.serviceUrl || "";
  els.openaiApiKeyInput.value = state.ai.apiKey || "";
  els.openaiModelInput.value = state.ai.model || "gpt-5";
  els.ledgerServiceUrlInput.value = state.ledger.serviceUrl || "";
  els.ledgerSpaceInput.value = state.ledger.space || "";
  els.ledgerPassphraseInput.value = state.ledger.passphrase || "";
}

function setupVoice() {
  if (!SpeechRecognition) {
    els.voiceBtn.disabled = true;
    els.mobileVoiceBtn.disabled = true;
    els.continuousVoiceBtn.disabled = true;
    els.autoVoiceSaveBtn.disabled = true;
    els.voiceStatus.textContent = "当前浏览器不支持语音识别，请使用 Chrome 或 Edge。";
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => {
    isListening = true;
    manualVoiceStop = false;
    voiceSessionText = "";
    setVoiceButtons(true);
    els.voiceStatus.textContent = "正在听写，请直接说出消费内容。";
  };
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .filter((item) => item.isFinal)
      .map((item) => item[0].transcript)
      .join("")
      .trim();
    if (!transcript) return;
    voiceSessionText = transcript;
    els.voiceStatus.textContent = `已识别：${transcript}`;
  };
  recognition.onerror = (event) => {
    els.voiceStatus.textContent = `语音识别失败：${event.error || "未知错误"}`;
    setVoiceButtons(false);
  };
  recognition.onend = () => {
    const transcript = voiceSessionText.trim();
    if (transcript) appendVoiceTranscript(transcript);

    if (state.continuousVoiceEnabled && !manualVoiceStop) {
      els.voiceStatus.textContent = transcript ? `已追加：${transcript}，继续说下一笔。` : "继续语音记账中，请说下一笔。";
      voiceSessionText = "";
      setTimeout(() => {
        if (state.continuousVoiceEnabled && !manualVoiceStop) {
          try {
            recognition.start();
          } catch {}
        }
      }, 250);
      return;
    }

    const shouldFinalizeContinuousDraft = state.continuousVoiceEnabled && manualVoiceStop;
    if (transcript || shouldFinalizeContinuousDraft) {
      const previewItems = parseLedgerInput(els.entryInput.value);
      const shouldSave = state.autoVoiceSaveEnabled
        ? previewItems.length > 0
        : previewItems.length > 0 && window.confirm(`识别到 ${previewItems.length} 条记录，是否立即保存到 ${els.entryDate.value}？`);
      els.voiceStatus.textContent = shouldSave
        ? state.autoVoiceSaveEnabled ? "识别完成，正在自动保存本次语音记账。" : "识别完成，正在保存本次语音记账。"
        : "识别完成，已加入输入框，你可以再检查一下。";
      if (shouldSave) saveCurrentEntry({ silent: true, fromVoice: true });
    } else if (isListening) {
      els.voiceStatus.textContent = "语音录入结束，没有识别到有效内容。";
    }
    voiceSessionText = "";
    manualVoiceStop = false;
    setVoiceButtons(false);
  };
}

function toggleVoice() {
  if (!recognition) return;
  if (isListening) {
    manualVoiceStop = true;
    recognition.stop();
  } else {
    manualVoiceStop = false;
    recognition.start();
  }
}

function setVoiceButtons(listening) {
  isListening = listening;
  const desktopText = listening ? (state.continuousVoiceEnabled ? "停止连续语音" : "停止语音录入") : "开始语音录入";
  const mobileText = listening ? "停止" : "语音";
  [[els.voiceBtn, desktopText], [els.mobileVoiceBtn, mobileText]].forEach(([button, text]) => {
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

function renderAll() {
  renderPreview();
  renderSmartShortcutRail();
  renderBudgetSummary();
  renderTodaySummary();
  renderRecords();
  renderReport();
  updateHeroStats();
  updateStatuses();
  updateQuickActionButtons();
  syncMobileSection();
}

function renderPreview() {
  const items = parseLedgerInput(els.entryInput.value);
  if (!items.length) {
    els.previewList.className = "preview-list empty-state";
    els.previewList.textContent = "输入账单后，这里会展示自动识别结果。";
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

function renderBudgetForm() {
  els.budgetForm.innerHTML = BUDGET_CATEGORIES.map((key) => `
    <label class="budget-input-grid">
      <span>${CATEGORIES[key].label} 预算</span>
      <input data-budget-key="${key}" type="number" min="0" step="0.01" value="${Number(state.budgets[key] || 0)}" placeholder="0">
    </label>
  `).join("");
}

function saveBudgets() {
  const next = {};
  els.budgetForm.querySelectorAll("[data-budget-key]").forEach((input) => {
    next[input.dataset.budgetKey] = Number(input.value || 0);
  });
  state.budgets = next;
  localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(state.budgets));
  renderAll();
}

function renderBudgetSummary() {
  const monthly = getMonthlyBudgetUsage(els.reportDate.value);
  els.budgetSummary.innerHTML = monthly.map((item) => {
    const ratio = item.budget > 0 ? item.spent / item.budget : 0;
    const isAlert = item.budget > 0 && item.spent > item.budget;
    return `
      <article class="budget-card ${isAlert ? "is-alert" : ""}">
        <div class="budget-card-head">
          <strong>${item.label}</strong>
          <span class="budget-pill ${isAlert ? "alert" : ""}">${item.budget > 0 ? `${Math.round(ratio * 100)}%` : "未设置"}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(ratio || 0, 1) * 100}%"></div></div>
        <div class="budget-meta">
          <span>已花 ${formatCurrency(item.spent)}</span>
          <span>预算 ${formatCurrency(item.budget)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderRecords() {
  const records = getFilteredRecords();
  if (!records.length) {
    els.recordsContainer.className = "records-list empty-state";
    els.recordsContainer.textContent = "当前筛选条件下没有账单记录。";
    return;
  }
  els.recordsContainer.className = "records-list";
  els.recordsContainer.innerHTML = "";
  records.forEach((record) => {
    const fragment = els.recordTemplate.content.cloneNode(true);
    fragment.querySelector(".record-date").textContent = formatDisplayDate(record.date);
    fragment.querySelector(".record-payer").textContent = record.payer ? `账户：${record.payer}` : "未填写账户";
    const itemsContainer = fragment.querySelector(".record-items");
    record.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "record-item";
      row.innerHTML = `
        <div class="record-main">
          <strong>${escapeHtml(item.text)}</strong>
          <span>${TYPE_LABEL[item.type]} · ${CATEGORIES[item.category].label}</span>
        </div>
        ${renderTypePill(item.type)}
        <div class="amount-text ${item.type}">${formatCurrency(item.amount)}</div>
        ${renderCategorySelect(item.category, item.id)}
        ${renderTag(item.category)}
        <div class="record-item-actions">
          <button class="ghost-button mini-button" data-action="edit-item" data-item-id="${item.id}" type="button">编辑</button>
          <button class="ghost-button mini-button danger-ghost" data-action="delete-item" data-item-id="${item.id}" type="button">删除</button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });
    fragment.querySelector(".record-delete").addEventListener("click", () => deleteRecord(record.date));
    els.recordsContainer.appendChild(fragment);
  });
}

function getFilteredRecords() {
  const overBudget = new Set(getMonthlyBudgetUsage(els.reportDate.value).filter((item) => item.budget > 0 && item.spent > item.budget).map((item) => item.key));
  return state.records.filter((record) => {
    const haystack = [record.date, record.payer, ...record.items.map((item) => `${item.text} ${item.amount}`)].join(" ").toLowerCase();
    if (state.recordSearch && !haystack.includes(state.recordSearch)) return false;
    if (state.recordFilter === "all") return true;
    if (state.recordFilter === "expense") return record.items.some((item) => item.type === "expense");
    if (state.recordFilter === "income") return record.items.some((item) => item.type === "income");
    if (state.recordFilter === "budget-alert") return record.items.some((item) => overBudget.has(item.category));
    return true;
  });
}

function handleRecordActions(event) {
  const itemId = event.target.dataset.itemId;
  if (!itemId) return;

  if (event.type === "change" && event.target.matches(".record-select")) {
    const targetCategory = event.target.value;
    state.records = state.records.map((record) => ({
      ...record,
      items: record.items.map((item) => item.id === itemId ? { ...item, category: targetCategory } : item)
    }));
    persistRecords();
    renderAll();
    return;
  }

  if (event.type !== "click") return;

  if (event.target.dataset.action === "edit-item") {
    openItemEditor(itemId);
  }

  if (event.target.dataset.action === "delete-item") {
    removeItem(itemId, true);
  }
}

function useTemplate(template) {
  state.amountBuffer = "";
  els.entryInput.value = els.entryInput.value.trim() ? `${els.entryInput.value.trim()}\n${template}` : template;
  renderPreview();
  showSection("entry");
  notify("已加入一条快捷记账。", { vibrate: false });
}

function renderSmartShortcutRail() {
  const suggestions = getSmartShortcutSuggestions();
  els.smartHomeSummary.textContent = suggestions.summary;
  els.smartShortcutRail.innerHTML = suggestions.items.length
    ? suggestions.items.map((item) => `<button class="smart-quick-pill" data-smart-template="${escapeHtml(item.template)}" type="button"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.hint)}</strong></button>`).join("")
    : `<div class="empty-state compact-empty">先记几笔常用消费，首页会自动把最顺手的快捷入口放到这里。</div>`;
}

function getSmartShortcutSuggestions() {
  const recentItems = state.records
    .flatMap((record) => record.items.map((item) => ({ ...item, date: record.date })))
    .filter((item) => item.type === "expense")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40);

  const usage = new Map();
  recentItems.forEach((item) => {
    const key = `${item.category}:${item.text}`;
    const current = usage.get(key) || { label: item.text, template: item.text, amount: item.amount, count: 0, category: item.category };
    current.count += 1;
    current.amount = item.amount;
    usage.set(key, current);
  });

  const ranked = [...usage.values()]
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, 4)
    .map((item) => ({
      label: item.label.length > 8 ? item.label.slice(0, 8) : item.label,
      hint: `${CATEGORIES[item.category].label} · ${formatCurrency(item.amount)}`,
      template: item.template
    }));

  if (ranked.length) {
    return {
      summary: `已根据最近使用频率，优先给你 ${ranked.length} 个最常用快捷记账。`,
      items: ranked
    };
  }

  return {
    summary: "先点一个模板开始记，系统会越来越懂你的常用场景。",
    items: [
      { label: "早餐", hint: "餐饮 · ¥12.00", template: "早餐 12 元" },
      { label: "地铁", hint: "交通 · ¥4.00", template: "地铁 4 元" },
      { label: "咖啡", hint: "餐饮 · ¥25.00", template: "咖啡 25 元" },
      { label: "买菜", hint: "餐饮 · ¥88.00", template: "买菜 88 元" }
    ]
  };
}

function toggleContinuousVoice() {
  state.continuousVoiceEnabled = !state.continuousVoiceEnabled;
  persistUiPrefs();
  updateQuickActionButtons();
  els.voiceStatus.textContent = state.continuousVoiceEnabled
    ? "连续语音已开启。每说完一笔会自动追加，点停止后统一确认保存。"
    : "连续语音已关闭。现在恢复为单次语音确认。";
  notify(state.voiceStatus?.textContent || "连续语音模式已切换。", { vibrate: false });
}

function toggleAutoVoiceSave() {
  state.autoVoiceSaveEnabled = !state.autoVoiceSaveEnabled;
  persistUiPrefs();
  updateQuickActionButtons();
  const message = state.autoVoiceSaveEnabled
    ? "语音自动保存已开启。说完后会直接入账。"
    : "语音自动保存已关闭。说完后会先让你确认。";
  els.voiceStatus.textContent = message;
  notify(message, { vibrate: false });
}

function applyQuickAmount(amountValue) {
  state.amountBuffer = String(amountValue);
  applyAmountBufferToEntry();
}

function updateAmountBuffer(key) {
  if (key === "backspace") {
    state.amountBuffer = state.amountBuffer.slice(0, -1);
  } else if (key === ".") {
    if (!state.amountBuffer || state.amountBuffer.includes(".")) return;
    state.amountBuffer += ".";
  } else {
    if (state.amountBuffer.includes(".") && state.amountBuffer.split(".")[1].length >= 2) return;
    state.amountBuffer += key;
  }

  if (!state.amountBuffer) {
    clearAmountFromEntry();
    els.voiceStatus.textContent = "金额输入已清空。";
    return;
  }

  applyAmountBufferToEntry();
}

function applyAmountBufferToEntry() {
  const amountValue = normalizeAmountBuffer(state.amountBuffer);
  if (!amountValue) return;
  const lines = els.entryInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    lines.push(`支出 ${amountValue} 元`);
  } else {
    const lastLine = lines[lines.length - 1];
    if (/(-?\d+(?:\.\d{1,2})?)/.test(lastLine)) {
      lines[lines.length - 1] = lastLine.replace(/(-?\d+(?:\.\d{1,2})?)(\s*(元|块|块钱|rmb|RMB))?/, `${amountValue} 元`);
    } else {
      lines[lines.length - 1] = `${lastLine} ${amountValue} 元`;
    }
  }
  els.entryInput.value = lines.join("\n");
  renderPreview();
  showSection("entry");
  els.voiceStatus.textContent = `已填入金额 ${amountValue} 元。`;
}

function appendVoiceTranscript(transcript) {
  state.amountBuffer = "";
  els.entryInput.value = els.entryInput.value.trim() ? `${els.entryInput.value.trim()}\n${transcript}` : transcript;
  renderPreview();
}

function clearAmountFromEntry() {
  const lines = els.entryInput.value.split("\n");
  if (!lines.length) return;
  const lastIndex = lines.length - 1;
  lines[lastIndex] = lines[lastIndex].replace(/\s*(-?\d+(?:\.\d{1,2})?)\s*(元|块|块钱|rmb|RMB)?/i, "").trim();
  els.entryInput.value = lines.filter((line) => line.trim()).join("\n");
  renderPreview();
}

function renderReport() {
  const report = buildReport();
  els.statsGrid.innerHTML = [
    ["统计区间", report.rangeText],
    ["总支出", formatCurrency(report.totalExpense)],
    ["总收入", formatCurrency(report.totalIncome)],
    ["结余", formatCurrency(report.net)]
  ].map(([label, value]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join("");
  els.insightModeBadge.textContent = state.ai.serviceUrl ? "AI" : "SMART";
  els.insightCards.innerHTML = report.insights.map((item) => `<article class="insight-card"><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body)}</p></article>`).join("");
  renderBarChart(els.categoryChart, report.categoryCounts, "当前区间还没有可展示的支出分类数据。");
  renderBarChart(els.timelineChart, report.timeline, "当前区间还没有可展示的日期消费走势。", true);
  renderSummaryTable(report);
  els.reportText.value = report.text;
}

function buildReport() {
  const filtered = filterRecordsByType(state.reportType, els.reportDate.value);
  const items = filtered.flatMap((record) => record.items.map((item) => ({ ...item, date: record.date, payer: record.payer })));
  const expenseItems = items.filter((item) => item.type === "expense");
  const incomeItems = items.filter((item) => item.type === "income");
  const totalExpense = sumAmount(expenseItems);
  const totalIncome = sumAmount(incomeItems);
  const categoryCounts = Object.entries(CATEGORIES).map(([key, meta]) => ({ key, label: meta.label, amount: sumAmount(expenseItems.filter((item) => item.category === key)) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  const timeline = filtered.map((record) => ({ label: formatShortDate(record.date), amount: sumAmount(record.items.filter((item) => item.type === "expense")) })).filter((item) => item.amount > 0);
  const budgetAlerts = getMonthlyBudgetUsage(els.reportDate.value).filter((item) => item.budget > 0 && item.spent > item.budget);
  const topCategory = categoryCounts[0];
  const peakDay = [...timeline].sort((a, b) => b.amount - a.amount)[0];
  const summaryRows = filtered.map((record) => ({
    date: record.date,
    payer: record.payer || "-",
    expenseAmount: sumAmount(record.items.filter((item) => item.type === "expense")),
    incomeAmount: sumAmount(record.items.filter((item) => item.type === "income")),
    categories: summarizeCategories(record.items),
    items: record.items.map((item) => `[${TYPE_LABEL[item.type]}][${CATEGORIES[item.category].label}] ${item.text} ${formatCurrency(item.amount)}`).join("\n")
  }));
  const insights = !filtered.length
    ? [{ title: "等待数据", body: "当前区间还没有记录，先记几笔账，系统就会生成预算和消费洞察。" }]
    : [
        { title: "消费焦点", body: topCategory ? `${topCategory.label} 是当前支出最高分类，共 ${formatCurrency(topCategory.amount)}。` : "本期没有支出数据。" },
        { title: "预算提醒", body: budgetAlerts.length ? `已有 ${budgetAlerts.length} 个分类超预算，优先检查 ${budgetAlerts[0].label}。` : "本期预算控制平稳，没有出现超预算分类。" },
        { title: "峰值日提醒", body: peakDay ? `${peakDay.label} 是支出峰值日，适合回看当天的消费场景。` : "本期还没有明显的支出高峰日。" }
      ];
  const rangeText = getDateRangeText(state.reportType, els.reportDate.value);
  const text = [
    `${getReportTypeLabel(state.reportType)}消费摘要`,
    `统计区间：${rangeText}`,
    `总支出：${formatCurrency(totalExpense)}`,
    `总收入：${formatCurrency(totalIncome)}`,
    `结余：${formatCurrency(totalIncome - totalExpense)}`,
    "",
    "本期洞察：",
    ...insights.map((item) => `- ${item.title}：${item.body}`),
    "",
    "明细：",
    ...summaryRows.map((row) => `${formatDisplayDate(row.date)}${row.payer !== "-" ? ` / ${row.payer}` : ""}\n${row.items}`)
  ].join("\n");
  return { rangeText, totalExpense, totalIncome, net: totalIncome - totalExpense, categoryCounts, timeline, summaryRows, insights, text };
}

function updateHeroStats() {
  const monthRecords = filterRecordsByType("monthly", els.reportDate.value);
  const monthItems = monthRecords.flatMap((record) => record.items);
  const todayRecords = filterRecordsByType("daily", els.entryDate.value || formatDate(new Date()));
  const todayItems = todayRecords.flatMap((record) => record.items).filter((item) => item.type === "expense");
  const expenses = monthItems.filter((item) => item.type === "expense");
  const budgetAlerts = getMonthlyBudgetUsage(els.reportDate.value).filter((item) => item.budget > 0 && item.spent > item.budget).length;
  els.todayExpense.textContent = formatCurrency(sumAmount(todayItems));
  els.monthExpense.textContent = formatCurrency(sumAmount(expenses));
  els.budgetAlerts.textContent = String(budgetAlerts);
  els.recordStreak.textContent = `${calculateStreak()}天`;
}

function renderTodaySummary() {
  const today = els.entryDate.value || formatDate(new Date());
  const todayRecords = filterRecordsByType("daily", today);
  const todayItems = todayRecords.flatMap((record) => record.items);
  const expenseItems = todayItems.filter((item) => item.type === "expense");
  const incomeItems = todayItems.filter((item) => item.type === "income");
  const latest = state.records.slice(0, 3).flatMap((record) => record.items.map((item) => ({ ...item, date: record.date }))).slice(0, 3);
  els.todaySummary.innerHTML = `
    <article class="today-card">
      <span>今天共记录 ${todayItems.length} 笔</span>
      <strong>${formatCurrency(sumAmount(expenseItems))}</strong>
      <span>收入 ${formatCurrency(sumAmount(incomeItems))}</span>
    </article>
    <article class="today-card">
      <span>最近三笔</span>
      <strong>${latest.length ? latest.map((item) => `${item.text} ${formatCurrency(item.amount)}`).join(" · ") : "还没有记录"}</strong>
    </article>
  `;
}

function calculateStreak() {
  const dates = [...new Set(state.records.map((item) => item.date))].sort((a, b) => b.localeCompare(a));
  if (!dates.length) return 0;
  let streak = 0;
  let cursor = new Date(`${dates[0]}T00:00:00`);
  for (const date of dates) {
    const current = new Date(`${date}T00:00:00`);
    if (formatDate(cursor) === formatDate(current)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getMonthlyBudgetUsage(baseDate) {
  const monthItems = filterRecordsByType("monthly", baseDate).flatMap((record) => record.items).filter((item) => item.type === "expense");
  return BUDGET_CATEGORIES.map((key) => ({
    key,
    label: CATEGORIES[key].label,
    budget: Number(state.budgets[key] || 0),
    spent: sumAmount(monthItems.filter((item) => item.category === key))
  }));
}

function filterRecordsByType(type, baseDate) {
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

function saveCurrentEntry(options = {}) {
  const { silent = false, fromVoice = false } = options;
  const date = els.entryDate.value;
  const payer = els.payerName.value.trim();
  const items = parseLedgerInput(els.entryInput.value);
  if (!date || !items.length) return window.alert("请选择日期，并至少输入一条包含金额的账单内容。");
  pushHistory("save-entry");
  const next = { date, payer, items };
  const index = state.records.findIndex((item) => item.date === date);
  if (index >= 0) state.records[index] = next;
  else state.records.push(next);
  state.records = normalizeRecords(state.records);
  persistRecords();
  renderAll();
  if (fromVoice && window.matchMedia("(max-width: 720px)").matches) {
    showSection("today");
  }
  state.amountBuffer = "";
  if (fromVoice) {
    els.voiceStatus.textContent = `语音记账已保存，共 ${items.length} 条。`;
  }
  notify(fromVoice ? `已保存 ${items.length} 条语音记账。` : `已保存 ${items.length} 条记录。`);
  return true;
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
  return { id: createId(), text: line.replace(/\s+/g, " ").trim(), amount, type, category: classifyLine(line, type) };
}

function classifyLine(text, type) {
  if (type === "income") return "salary";
  const lower = text.toLowerCase();
  return Object.keys(CATEGORIES).find((key) => CATEGORIES[key].keywords.some((word) => lower.includes(word.toLowerCase()))) || "other";
}

function loadEntryForDate(date) {
  const record = state.records.find((item) => item.date === date);
  els.payerName.value = record?.payer || "";
  els.entryInput.value = record ? record.items.map((item) => item.text).join("\n") : "";
  state.amountBuffer = "";
  renderPreview();
}

function deleteRecord(date) {
  if (!window.confirm(`确认删除 ${date} 的记账记录吗？`)) return;
  pushHistory("delete-day");
  state.records = state.records.filter((record) => record.date !== date);
  persistRecords();
  if (els.entryDate.value === date) loadEntryForDate(date);
  renderAll();
  notify("已删除这一天的记录。");
}

function openItemEditor(itemId) {
  const found = findItemById(itemId);
  if (!found) return;
  state.editingItemId = itemId;
  const { record, item } = found;
  els.itemEditorDate.textContent = formatDisplayDate(record.date);
  els.itemEditorPayer.textContent = record.payer ? `账户：${record.payer}` : "账户：未填写";
  els.itemEditorText.value = item.text;
  els.itemEditorAmount.value = String(item.amount);
  els.itemEditorType.value = item.type;
  syncItemEditorCategory(item.category);
  els.itemEditor.hidden = false;
}

function closeItemEditor() {
  state.editingItemId = null;
  els.itemEditor.hidden = true;
}

function syncItemEditorCategory(selectedCategory = "") {
  const type = els.itemEditorType.value;
  const options = Object.entries(CATEGORIES)
    .filter(([key]) => type === "income" ? key === "salary" || key === "other" : key !== "salary")
    .map(([key, meta]) => `<option value="${key}" ${key === (selectedCategory || els.itemEditorCategory.value) ? "selected" : ""}>${meta.label}</option>`)
    .join("");
  els.itemEditorCategory.innerHTML = options;
  if (!els.itemEditorCategory.value) {
    els.itemEditorCategory.value = type === "income" ? "salary" : "food";
  }
}

function saveEditedItem() {
  const itemId = state.editingItemId;
  if (!itemId) return;
  const text = els.itemEditorText.value.trim();
  const amount = Number(els.itemEditorAmount.value || 0);
  const type = els.itemEditorType.value === "income" ? "income" : "expense";
  const category = els.itemEditorCategory.value;
  if (!text || !amount) {
    window.alert("请先填写内容和金额。");
    return;
  }
  pushHistory("edit-item");
  state.records = state.records.map((record) => ({
    ...record,
    items: record.items.map((item) => item.id === itemId ? { ...item, text, amount, type, category } : item)
  }));
  state.records = normalizeRecords(state.records);
  persistRecords();
  closeItemEditor();
  loadEntryForDate(els.entryDate.value);
  renderAll();
  notify("这笔记录已更新。");
}

function deleteEditingItem() {
  if (!state.editingItemId) return;
  removeItem(state.editingItemId, true);
  closeItemEditor();
}

function removeItem(itemId, askConfirm = false) {
  if (askConfirm && !window.confirm("确认删除这一笔记录吗？")) return false;
  const currentDate = els.entryDate.value;
  pushHistory("delete-item");
  state.records = state.records
    .map((record) => ({
      ...record,
      items: record.items.filter((item) => item.id !== itemId)
    }))
    .filter((record) => record.items.length);
  if (state.editingItemId === itemId) {
    state.editingItemId = null;
    els.itemEditor.hidden = true;
  }
  persistRecords();
  if (currentDate) loadEntryForDate(currentDate);
  renderAll();
  notify("已删除这一笔记录。");
  return true;
}

function clearAllData() {
  if (!window.confirm("确认清空所有本地记账数据吗？此操作不可撤销。")) return;
  pushHistory("clear-all");
  state.records = [];
  persistRecords();
  closeItemEditor();
  els.entryInput.value = "";
  els.payerName.value = "";
  renderAll();
  notify("本地数据已清空。");
}

function saveGistConfig() {
  state.gist = { token: els.gistTokenInput.value.trim(), gistId: els.gistIdInput.value.trim() };
  localStorage.setItem(STORAGE_KEYS.gist, JSON.stringify(state.gist));
  updateStatuses("sync", "Gist 配置已保存在当前浏览器。");
}

async function pushCloudBackup() {
  const token = els.gistTokenInput.value.trim();
  if (!token) return window.alert("请先填写 GitHub Token。");
  updateStatuses("sync", "正在上传到 Gist...");
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
    state.gist = { token, gistId };
    localStorage.setItem(STORAGE_KEYS.gist, JSON.stringify(state.gist));
    updateStatuses("sync", `Gist 同步成功：${gistId}`);
  } catch (error) {
    updateStatuses("sync", `Gist 上传失败：${error.message}`);
  }
}

async function pullCloudBackup() {
  const token = els.gistTokenInput.value.trim();
  const gistId = els.gistIdInput.value.trim();
  if (!token || !gistId) return window.alert("请先填写 GitHub Token 和 Gist ID。");
  updateStatuses("sync", "正在从 Gist 拉取...");
  try {
    const gist = await gistRequest(`https://api.github.com/gists/${gistId}`, token, "GET");
    const data = JSON.parse(gist.files?.[GIST_FILENAME]?.content || "{}");
    pushHistory("pull-gist");
    state.records = normalizeRecords(data.records || []);
    persistRecords();
    renderAll();
    updateStatuses("sync", `Gist 数据已拉取，共 ${state.records.length} 天记录。`);
  } catch (error) {
    updateStatuses("sync", `Gist 拉取失败：${error.message}`);
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

function saveAiConfig() {
  state.ai = {
    serviceUrl: trimTrailingSlash(els.aiServiceUrlInput.value.trim()),
    apiKey: els.openaiApiKeyInput.value.trim(),
    model: els.openaiModelInput.value.trim() || "gpt-5"
  };
  localStorage.setItem(STORAGE_KEYS.ai, JSON.stringify(state.ai));
  updateStatuses("ai", "AI 配置已保存在当前浏览器。");
}

async function generateAiReport() {
  const serviceUrl = trimTrailingSlash(els.aiServiceUrlInput.value.trim());
  const apiKey = els.openaiApiKeyInput.value.trim();
  const model = els.openaiModelInput.value.trim() || "gpt-5";
  if (!serviceUrl && !apiKey) return window.alert("请先填写 AI 服务地址，或填写 OpenAI API Key。");
  const report = buildReport();
  if (!report.summaryRows.length) return window.alert("当前区间没有可用于 AI 总结的数据。");
  state.ai = { serviceUrl, apiKey, model };
  localStorage.setItem(STORAGE_KEYS.ai, JSON.stringify(state.ai));
  updateStatuses("ai", serviceUrl ? "正在通过安全服务生成 AI 月报..." : "正在直连 OpenAI 生成 AI 月报...");
  els.generateAiReportBtn.disabled = true;
  try {
    const text = serviceUrl ? await requestAiViaService(serviceUrl, report, model) : await requestAiDirect(apiKey, buildAiPayload(report, model));
    els.reportText.value = text;
    els.insightModeBadge.textContent = "AI";
    updateStatuses("ai", "AI 月报生成成功。");
  } catch (error) {
    updateStatuses("ai", `AI 月报生成失败：${error.message}`);
  } finally {
    els.generateAiReportBtn.disabled = false;
  }
}

function buildAiPayload(report, model) {
  return {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: "你是一名中文个人财务分析助手。请基于用户提供的账单统计，输出简洁、具体、可执行的消费月报。内容包含：整体总结、主要支出点、异常提醒、下月建议。不要输出 markdown 标题，直接用自然中文分段。" }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: [`统计区间：${report.rangeText}`, `总支出：${formatCurrency(report.totalExpense)}`, `总收入：${formatCurrency(report.totalIncome)}`, `结余：${formatCurrency(report.net)}`, "分类支出：", ...report.categoryCounts.map((item) => `- ${item.label}：${formatCurrency(item.amount)}`), "每日支出走势：", ...report.timeline.map((item) => `- ${item.label}：${formatCurrency(item.amount)}`), "账单明细：", ...report.summaryRows.map((row) => `${formatDisplayDate(row.date)} / ${row.payer}\n${row.items}`)].join("\n") }]
      }
    ]
  };
}

async function requestAiViaService(serviceUrl, report, model) {
  const response = await fetch(serviceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, rangeText: report.rangeText, totalExpense: report.totalExpense, totalIncome: report.totalIncome, net: report.net, categoryCounts: report.categoryCounts, timeline: report.timeline, summaryRows: report.summaryRows })
  });
  if (!response.ok) throw new Error(await response.text() || `请求失败 (${response.status})`);
  const data = await response.json();
  return String(data.text || "").trim();
}

async function requestAiDirect(apiKey, payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text() || `请求失败 (${response.status})`);
  const data = await response.json();
  return extractResponseText(data);
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function saveLedgerConfig() {
  state.ledger = getLedgerConfigFromInputs();
  localStorage.setItem(STORAGE_KEYS.ledger, JSON.stringify(state.ledger));
  updateStatuses("ledger", "云账本配置已保存在当前浏览器。");
}

async function pushLedgerData() {
  const config = getLedgerConfigFromInputs();
  if (!config.serviceUrl || !config.space || !config.passphrase) return window.alert("请先填写云账本服务地址、空间名和访问口令。");
  state.ledger = config;
  localStorage.setItem(STORAGE_KEYS.ledger, JSON.stringify(state.ledger));
  updateStatuses("ledger", "正在上传账本到云端...");
  try {
    const response = await fetch(`${config.serviceUrl}/api/ledger/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space: config.space, passphrase: config.passphrase, records: state.records })
    });
    if (!response.ok) throw new Error(await response.text() || `请求失败 (${response.status})`);
    const data = await response.json();
    updateStatuses("ledger", `云账本上传成功：${data.space}`);
  } catch (error) {
    updateStatuses("ledger", `云账本上传失败：${error.message}`);
  }
}

async function pullLedgerData() {
  const config = getLedgerConfigFromInputs();
  if (!config.serviceUrl || !config.space || !config.passphrase) return window.alert("请先填写云账本服务地址、空间名和访问口令。");
  state.ledger = config;
  localStorage.setItem(STORAGE_KEYS.ledger, JSON.stringify(state.ledger));
  updateStatuses("ledger", "正在从云端拉取账本...");
  try {
    const response = await fetch(`${config.serviceUrl}/api/ledger/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space: config.space, passphrase: config.passphrase })
    });
    if (!response.ok) throw new Error(await response.text() || `请求失败 (${response.status})`);
    const data = await response.json();
    pushHistory("pull-ledger");
    state.records = normalizeRecords(data.records || []);
    persistRecords();
    renderAll();
    updateStatuses("ledger", `云账本拉取成功，共 ${state.records.length} 天记录。`);
  } catch (error) {
    updateStatuses("ledger", `云账本拉取失败：${error.message}`);
  }
}

function getLedgerConfigFromInputs() {
  return {
    serviceUrl: trimTrailingSlash(els.ledgerServiceUrlInput.value.trim()),
    space: els.ledgerSpaceInput.value.trim(),
    passphrase: els.ledgerPassphraseInput.value.trim()
  };
}

function exportJson() {
  downloadFile(`智能记账备份-${formatDate(new Date())}.json`, JSON.stringify({ records: state.records }, null, 2), "application/json;charset=utf-8;");
}

async function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    pushHistory("import-json");
    state.records = normalizeRecords(data.records || []);
    persistRecords();
    renderAll();
    window.alert("JSON 备份已导入。");
  } catch (error) {
    window.alert(`导入失败：${error.message}`);
  }
  event.target.value = "";
}

function exportCsv() {
  const report = buildReport();
  if (!report.summaryRows.length) return window.alert("当前报表没有可导出的数据。");
  const rows = [["日期", "账户", "支出", "收入", "分类概览", "明细"], ...report.summaryRows.map((row) => [formatDisplayDate(row.date), row.payer, row.expenseAmount.toFixed(2), row.incomeAmount.toFixed(2), row.categories, row.items.replace(/\n/g, " | ")])];
  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.csv`, `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`, "text/csv;charset=utf-8;");
}

function exportHtml() {
  const report = buildReport();
  if (!report.summaryRows.length) return window.alert("当前报表没有可导出的数据。");
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${getReportTypeLabel(state.reportType)}消费摘要</title><style>body{font-family:"Microsoft YaHei",sans-serif;padding:32px;color:#222}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #ddd;padding:10px;text-align:left;vertical-align:top}th{background:#f5f5f5}.report-text{white-space:pre-wrap;margin-top:24px;background:#fafafa;padding:16px;border:1px solid #eee}</style></head><body><h1>${getReportTypeLabel(state.reportType)}消费摘要</h1><p>统计区间：${report.rangeText}</p><table><thead><tr><th>日期</th><th>账户</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr></thead><tbody>${report.summaryRows.map((row) => `<tr><td>${formatDisplayDate(row.date)}</td><td>${escapeHtml(row.payer)}</td><td>${formatCurrency(row.expenseAmount)}</td><td>${formatCurrency(row.incomeAmount)}</td><td>${escapeHtml(row.categories)}</td><td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td></tr>`).join("")}</tbody></table><div class="report-text">${escapeHtml(report.text)}</div></body></html>`;
  downloadFile(`智能记账-${state.reportType}-${els.reportDate.value}.html`, html, "text/html;charset=utf-8;");
}

function renderSummaryTable(report) {
  els.summaryTable.querySelector("thead").innerHTML = "<tr><th>日期</th><th>账户</th><th>支出</th><th>收入</th><th>分类概览</th><th>明细</th></tr>";
  els.summaryTable.querySelector("tbody").innerHTML = report.summaryRows.length ? report.summaryRows.map((row) => `<tr><td>${formatDisplayDate(row.date)}</td><td>${escapeHtml(row.payer)}</td><td>${formatCurrency(row.expenseAmount)}</td><td>${formatCurrency(row.incomeAmount)}</td><td>${escapeHtml(row.categories)}</td><td>${escapeHtml(row.items).replace(/\n/g, "<br>")}</td></tr>`).join("") : '<tr><td colspan="6">当前区间还没有记账记录。</td></tr>';
}

function renderBarChart(root, rows, emptyText, alt = false) {
  if (!rows.length) {
    root.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }
  const max = Math.max(...rows.map((item) => item.amount));
  root.innerHTML = rows.map((item) => `<div class="bar-row"><div class="bar-label">${escapeHtml(item.label)}</div><div class="bar-track"><div class="bar-fill${alt ? " alt" : ""}" style="width:${item.amount / max * 100}%"></div></div><div class="bar-value">${formatCurrency(item.amount)}</div></div>`).join("");
}

function updateStatuses(scope, message) {
  if (!scope || scope === "sync") els.syncStatus.textContent = scope === "sync" && message ? message : (!state.gist.token ? "还没有配置 Gist 云同步。" : (!state.gist.gistId ? "Token 已保存，首次上传时会自动创建 Gist。" : `当前 Gist：${state.gist.gistId}`));
  if (!scope || scope === "ai") els.aiStatus.textContent = scope === "ai" && message ? message : (state.ai.serviceUrl ? `已启用安全 AI 服务：${state.ai.serviceUrl}` : (!state.ai.apiKey ? "还没有配置 OpenAI API 或 AI 服务。" : `当前为浏览器直连模式，模型：${state.ai.model}`));
  if (!scope || scope === "ledger") els.ledgerStatus.textContent = scope === "ledger" && message ? message : (!state.ledger.serviceUrl ? "还没有配置云账本空间。" : `当前空间：${state.ledger.space || "未命名空间"}`);
}

function showSection(section, scroll = false) {
  state.mobileSection = section;
  syncMobileSection();
  if (scroll) document.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ behavior: "smooth" });
}

function syncMobileSection() {
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  document.querySelectorAll(".section-card[data-section]").forEach((section) => {
    section.classList.toggle("is-visible", !isMobile || section.dataset.section === state.mobileSection);
  });
  els.mobileNav.querySelectorAll(".mobile-nav-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === state.mobileSection);
  });
}

function updateQuickActionButtons() {
  const continuousLabel = `连续语音：${state.continuousVoiceEnabled ? "开" : "关"}`;
  els.continuousVoiceBtn.textContent = continuousLabel;
  els.continuousVoiceBtn.classList.toggle("is-listening", state.continuousVoiceEnabled);
  const autoVoiceLabel = `语音自动保存：${state.autoVoiceSaveEnabled ? "开" : "关"}`;
  els.autoVoiceSaveBtn.textContent = autoVoiceLabel;
  els.autoVoiceSaveBtn.classList.toggle("is-listening", state.autoVoiceSaveEnabled);
  const canUndo = state.history.length > 0;
  els.undoBtn.disabled = !canUndo;
  els.undoBtn.textContent = canUndo ? "撤销上一笔" : "暂无可撤销";
  els.mobileUndoBtn.disabled = !canUndo;
  els.mobileUndoBtn.textContent = canUndo ? "撤销" : "撤销";
}

function pushHistory(reason = "") {
  state.history.push({
    reason,
    records: JSON.parse(JSON.stringify(state.records)),
    entryDate: els.entryDate.value,
    payerName: els.payerName.value,
    entryInput: els.entryInput.value
  });
  if (state.history.length > 20) state.history.shift();
  updateQuickActionButtons();
}

function undoLastAction() {
  const snapshot = state.history.pop();
  if (!snapshot) {
    els.voiceStatus.textContent = "当前还没有可撤销的操作。";
    updateQuickActionButtons();
    return;
  }
  state.records = normalizeRecords(snapshot.records || []);
  persistRecords();
  closeItemEditor();
  els.entryDate.value = snapshot.entryDate || formatDate(new Date());
  els.payerName.value = snapshot.payerName || "";
  els.entryInput.value = snapshot.entryInput || "";
  state.amountBuffer = "";
  renderAll();
  els.voiceStatus.textContent = "已撤销上一笔操作。";
  notify("已撤销上一笔操作。");
}

function notify(message, options = {}) {
  const { vibrate = true } = options;
  els.appToast.textContent = message;
  els.appToast.hidden = false;
  els.appToast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.appToast.classList.remove("is-visible");
    els.appToast.hidden = true;
  }, 2200);
  if (vibrate && "vibrate" in navigator) {
    navigator.vibrate(18);
  }
}

function renderItemEditorCategoryOptions() {
  syncItemEditorCategory();
}

function findItemById(itemId) {
  for (const record of state.records) {
    const item = record.items.find((entry) => entry.id === itemId);
    if (item) return { record, item };
  }
  return null;
}

function renderTag(category) {
  return `<span class="tag ${CATEGORIES[category].className}">${CATEGORIES[category].label}</span>`;
}

function renderTypePill(type) {
  return `<span class="type-pill ${type}">${TYPE_LABEL[type]}</span>`;
}

function renderCategorySelect(category, itemId) {
  return `<select class="record-select" data-item-id="${itemId}">${Object.entries(CATEGORIES).map(([key, meta]) => `<option value="${key}" ${key === category ? "selected" : ""}>${meta.label}</option>`).join("")}</select>`;
}

function summarizeCategories(items) {
  const groups = {};
  items.filter((item) => item.type === "expense").forEach((item) => {
    groups[item.category] = (groups[item.category] || 0) + item.amount;
  });
  return Object.keys(groups).length ? Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${CATEGORIES[key].label} ${formatCurrency(value)}`).join(" / ") : "仅收入";
}

function normalizeRecords(records) {
  return records.map((record) => ({
    date: record.date,
    payer: record.payer || "",
    items: (record.items || []).map((item) => ({ id: item.id || createId(), text: String(item.text || "").trim(), amount: Number(item.amount || 0), type: item.type === "income" ? "income" : "expense", category: CATEGORIES[item.category] ? item.category : "other" })).filter((item) => item.text && item.amount > 0)
  })).filter((record) => record.date && record.items.length).sort((a, b) => b.date.localeCompare(a.date));
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(state.records));
}

function persistUiPrefs() {
  state.ui = {
    continuousVoiceEnabled: state.continuousVoiceEnabled,
    autoVoiceSaveEnabled: state.autoVoiceSaveEnabled
  };
  localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify(state.ui));
}

function createDefaultBudgets() {
  return Object.fromEntries(BUDGET_CATEGORIES.map((key) => [key, 0]));
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function q(selector) { return document.querySelector(selector); }
function createId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function trimTrailingSlash(value) { return value.replace(/\/+$/, ""); }
function formatCurrency(value) { return `¥${Number(value || 0).toFixed(2)}`; }
function normalizeAmountBuffer(value) {
  const normalized = String(value || "").replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");
  if (!normalized || normalized === ".") return "";
  return Number(normalized).toString();
}
function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDisplayDate(dateString) { return formatDate(new Date(`${dateString}T00:00:00`)); }
function formatShortDate(dateString) { const date = new Date(`${dateString}T00:00:00`); return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`; }
function getReportTypeLabel(type) { return ({ daily: "日", weekly: "周", monthly: "月" })[type] || "报表"; }
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
function stripTime(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function sumAmount(items) { return items.reduce((total, item) => total + Number(item.amount || 0), 0); }
function csvEscape(value) { return `"${String(value ?? "").replace(/"/g, "\"\"")}"`; }
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
