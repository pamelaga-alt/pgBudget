console.log("Budget Tracker initialized!");

// -------------------------------------------------------------
// 1. STATE INITIALIZATION & STORAGE
// -------------------------------------------------------------
const STORAGE_KEY = "budget_tracker_app_state";

let appState = {
  activeTracker: {
    id: null,
    name: "",
    monthYear: "",
    totalBudget: 0,
    totalEarnings: 0,
    categories: [],
    savingsGoals: []
  },
  archivedTrackers: [],
  settings: { lastUpdated: null }
};

let pieChartInstance = null;
let searchQuery = "";
let categoryFilter = "ALL";

function getCurrentMonthYear() {
  const date = new Date();
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function saveStateToLocalStorage() {
  appState.settings.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadStateFromLocalStorage() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      appState = JSON.parse(savedData);
      
      if (!appState.activeTracker) {
        appState.activeTracker = {
          id: null,
          name: "",
          monthYear: "",
          totalBudget: 0,
          totalEarnings: 0,
          categories: [],
          savingsGoals: []
        };
      }
      
      if (!appState.activeTracker.savingsGoals) {
        appState.activeTracker.savingsGoals = [];
      }
      
      if (appState.activeTracker.categories) {
        appState.activeTracker.categories.forEach(cat => {
          if (!cat.history) {
            cat.history = [];
          }
        });
      }
      
      return true;
    } catch (err) {
      console.error("Error parsing stored state:", err);
    }
  }
  return false;
}

loadStateFromLocalStorage();

// -------------------------------------------------------------
// 2. DOM ELEMENTS
// -------------------------------------------------------------
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const pageDashboard = document.getElementById('page-dashboard');

const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');
const btnBackHome = document.getElementById('btn-back-home');

const isLumpSumCheck = document.getElementById('is-lump-sum-check');
const lumpSumCalculator = document.getElementById('lump-sum-calculator');
const lumpSumAmount = document.getElementById('lump-sum-amount');
const lumpSumMonths = document.getElementById('lump-sum-months');
const btnCalcLumpSum = document.getElementById('btn-calc-lump-sum');

const setupForm = document.getElementById('setup-form');
const totalBudgetInput = document.getElementById('total-budget');
const categorySelect = document.getElementById('category-select');
const customCategoryGroup = document.getElementById('custom-category-group');
const customCategoryNameInput = document.getElementById('custom-category-name');
const categoryAmountInput = document.getElementById('category-amount');
const isCategoryRecurring = document.getElementById('is-category-recurring');
const btnAddCategory = document.getElementById('btn-add-category');
const activeCategoriesList = document.getElementById('active-categories');

const dashTrackerName = document.getElementById('dash-tracker-name');
const dashTotalBudget = document.getElementById('dash-total-budget');
const dashEarnings = document.getElementById('dash-earnings');
const postitContainer = document.getElementById('postit-container');
const expenseCategorySelect = document.getElementById('expense-category-select');
const expenseNoteInput = document.getElementById('expense-note-input');
const expenseAmountInput = document.getElementById('expense-amount-input');
const btnAddExpense = document.getElementById('btn-add-expense');
const btnExportCSV = document.getElementById('btn-export-csv');

// FAB Elements
const btnFabMain = document.getElementById('btn-fab-main');
const fabOptions = document.getElementById('fab-options');
const btnFabEditBudget = document.getElementById('btn-fab-edit-budget');
const btnFabAddEarnings = document.getElementById('btn-fab-add-earnings');
const btnFabAddCat = document.getElementById('btn-fab-add-cat');
const btnFabAddGoal = document.getElementById('btn-fab-add-goal');

// Modals
const modalConfirm = document.getElementById('modal-confirm');
const modalEditBudget = document.getElementById('modal-edit-budget');
const editTrackerName = document.getElementById('edit-tracker-name');
const editTotalBudget = document.getElementById('edit-total-budget');
const btnSaveEditBudget = document.getElementById('btn-save-edit-budget');
const btnCloseEditBudgetModal = document.getElementById('btn-close-edit-budget-modal');

const modalAddEarnings = document.getElementById('modal-add-earnings');
const inputEarningsAmount = document.getElementById('input-earnings-amount');
const btnSaveEarnings = document.getElementById('btn-save-earnings');
const btnCloseEarningsModal = document.getElementById('btn-close-earnings-modal');

const modalAddCategory = document.getElementById('modal-add-category');
const btnSaveModalCat = document.getElementById('btn-save-modal-cat');
const btnCloseModal = document.getElementById('btn-close-modal');
const dashNewCatName = document.getElementById('dash-new-cat-name');
const dashNewCatLimit = document.getElementById('dash-new-cat-limit');
const dashNewCatRecurring = document.getElementById('dash-new-cat-recurring');

const modalAddGoal = document.getElementById('modal-add-goal');
const btnSaveGoal = document.getElementById('btn-save-goal');
const btnCloseGoalModal = document.getElementById('btn-close-goal-modal');

const inputSearchExpenses = document.getElementById('input-search-expenses');
const selectFilterCategory = document.getElementById('select-filter-category');

const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const sidebarHistory = document.getElementById('sidebar-history');
const historyListContainer = document.getElementById('history-list-container');

const modalMonthlySummary = document.getElementById('modal-monthly-summary');
const summaryMonthName = document.getElementById('summary-month-name');
const summaryReportDetails = document.getElementById('summary-report-details');
const btnKeepBudget = document.getElementById('btn-keep-budget');
const btnNewBudget = document.getElementById('btn-new-budget');

let configuredCategories = [];

function navigateTo(targetPage) {
  [page1, page2, pageDashboard].forEach(page => page.classList.add('hidden'));
  targetPage.classList.remove('hidden');
}

// CUSTOM MODAL CONFIRMATION PROMPT
function showConfirmModal(message, onConfirm) {
  const msgEl = document.getElementById('confirm-modal-msg');
  const btnYes = document.getElementById('btn-confirm-yes');
  const btnNo = document.getElementById('btn-confirm-no');

  msgEl.textContent = message;
  modalConfirm.classList.remove('hidden');

  const cleanup = () => {
    modalConfirm.classList.add('hidden');
    btnYes.onclick = null;
    btnNo.onclick = null;
  };

  btnYes.onclick = () => {
    cleanup();
    onConfirm();
  };

  btnNo.onclick = () => {
    cleanup();
  };
}

// -------------------------------------------------------------
// 3. NAVIGATION & SETUP FORM LOGIC
// -------------------------------------------------------------
btnNewTracker.addEventListener('click', () => {
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  customCategoryGroup.classList.add('hidden');
  lumpSumCalculator.classList.add('hidden');
  navigateTo(page2);
});

btnOldTracker.addEventListener('click', () => {
  if (loadStateFromLocalStorage() && appState.activeTracker && appState.activeTracker.name) {
    checkMonthlyRollover();
    renderDashboard();
    navigateTo(pageDashboard);
  } else {
    alert("No saved tracker found! Please create a new tracker first.");
  }
});

btnBackHome.addEventListener('click', () => {
  navigateTo(page1);
});

isLumpSumCheck.addEventListener('change', (e) => {
  if (e.target.checked) {
    lumpSumCalculator.classList.remove('hidden');
  } else {
    lumpSumCalculator.classList.add('hidden');
  }
});

btnCalcLumpSum.addEventListener('click', () => {
  const amount = parseFloat(lumpSumAmount.value) || 0;
  const months = parseFloat(lumpSumMonths.value) || 1;
  if (amount > 0 && months > 0) {
    const monthlyCeiling = (amount / months).toFixed(2);
    totalBudgetInput.value = monthlyCeiling;
  } else {
    alert("Please enter a valid lump sum amount and number of months.");
  }
});

categorySelect.addEventListener('change', (e) => {
  if (e.target.value === 'Other') {
    customCategoryGroup.classList.remove('hidden');
  } else {
    customCategoryGroup.classList.add('hidden');
    customCategoryNameInput.value = '';
  }
});

btnAddCategory.addEventListener('click', () => {
  let categoryName = categorySelect.value;
  const amount = parseFloat(categoryAmountInput.value);
  const isRecurring = isCategoryRecurring.checked;

  if (categoryName === 'Other') categoryName = customCategoryNameInput.value.trim();

  if (!categoryName) {
    alert("Please select or enter a category name.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid budget limit.");
    return;
  }

  configuredCategories.push({
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: categoryName,
    limit: amount,
    spent: 0,
    isRecurring: isRecurring,
    history: []
  });

  const listItem = document.createElement('li');
  listItem.textContent = `${categoryName}: $${amount.toFixed(2)} ${isRecurring ? '🔄 (Recurring Bill)' : ''}`;
  activeCategoriesList.appendChild(listItem);

  categorySelect.value = '';
  customCategoryNameInput.value = '';
  categoryAmountInput.value = '';
  isCategoryRecurring.checked = false;
  customCategoryGroup.classList.add('hidden');
});

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const trackerName = document.getElementById('tracker-name').value;
  const totalBudget = parseFloat(totalBudgetInput.value);
  const totalEarnings = parseFloat(document.getElementById('total-earnings').value) || 0;

  appState.activeTracker = {
    id: `tracker_${Date.now()}`,
    monthYear: getCurrentMonthYear(),
    createdAt: new Date().toISOString(),
    name: trackerName,
    totalBudget: totalBudget,
    totalEarnings: totalEarnings,
    categories: [...configuredCategories],
    savingsGoals: []
  };

  saveStateToLocalStorage();
  renderDashboard();
  navigateTo(pageDashboard);
});

// -------------------------------------------------------------
// 4. MONTHLY ROLLOVER & SUMMARY
// -------------------------------------------------------------
function checkMonthlyRollover() {
  const currentMonth = getCurrentMonthYear();
  const tracker = appState.activeTracker;

  if (tracker && tracker.monthYear && tracker.monthYear !== currentMonth) {
    showMonthlySummaryModal(tracker);
  }
}

function showMonthlySummaryModal(pastTracker) {
  summaryMonthName.textContent = `Report for ${pastTracker.monthYear} (${pastTracker.name})`;

  let totalSpent = 0;
  let breakdownHtml = '<ul>';
  let reorderAdvice = [];

  pastTracker.categories.forEach(cat => {
    totalSpent += cat.spent;
    const isOver = cat.spent > cat.limit;
    const diff = cat.spent - cat.limit;

    breakdownHtml += `<li><strong>${cat.name}:</strong> Spent $${cat.spent.toFixed(2)} / $${cat.limit.toFixed(2)} ${isOver ? `<span style="color:#ef4444;">(+$${diff.toFixed(2)} Over)</span>` : ''}</li>`;

    if (isOver) {
      reorderAdvice.push(`Increase <strong>${cat.name}</strong> limit by at least $${diff.toFixed(2)} next month.`);
    }
  });
  breakdownHtml += '</ul>';

  let adviceHtml = reorderAdvice.length > 0 
    ? `<div style="margin-top:10px; border-top: 1px dashed #cbd5e1; padding-top:8px;"><strong>💡 Next Month Advice:</strong><br>${reorderAdvice.join('<br>')}</div>`
    : `<div style="margin-top:10px; color:#10b981;"><strong>✅ Perfect Month!</strong> You stayed within all limits.</div>`;

  summaryReportDetails.innerHTML = `
    <p><strong>Total Spending:</strong> $${totalSpent.toFixed(2)} / $${pastTracker.totalBudget.toFixed(2)}</p>
    <br>
    ${breakdownHtml}
    ${adviceHtml}
  `;

  modalMonthlySummary.classList.remove('hidden');
}

btnKeepBudget.addEventListener('click', () => {
  if (!appState.archivedTrackers) appState.archivedTrackers = [];
  appState.archivedTrackers.push({ ...appState.activeTracker });

  appState.activeTracker.monthYear = getCurrentMonthYear();
  appState.activeTracker.categories.forEach(cat => {
    cat.spent = 0;
    cat.history = [];
  });

  saveStateToLocalStorage();
  modalMonthlySummary.classList.add('hidden');
  renderDashboard();
});

btnNewBudget.addEventListener('click', () => {
  if (!appState.archivedTrackers) appState.archivedTrackers = [];
  appState.archivedTrackers.push({ ...appState.activeTracker });

  saveStateToLocalStorage();
  modalMonthlySummary.classList.add('hidden');
  
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  navigateTo(page2);
});

// -------------------------------------------------------------
// 5. SIDEBAR HISTORY
// -------------------------------------------------------------
btnToggleSidebar.addEventListener('click', () => {
  renderSidebarHistory();
  sidebarHistory.classList.remove('closed');
});

btnCloseSidebar.addEventListener('click', () => {
  sidebarHistory.classList.add('closed');
});

function renderSidebarHistory() {
  historyListContainer.innerHTML = '';

  if (!appState.archivedTrackers || appState.archivedTrackers.length === 0) {
    historyListContainer.innerHTML = '<p style="font-size:13px; color:#64748b;">No archived months yet.</p>';
    return;
  }

  appState.archivedTrackers.slice().reverse().forEach(archived => {
    const card = document.createElement('div');
    card.className = 'archived-month-card';

    let totalSpent = archived.categories.reduce((sum, c) => sum + c.spent, 0);

    card.innerHTML = `
      <h4 style="margin: 0 0 5px 0;">${archived.monthYear}</h4>
      <p style="margin: 2px 0;"><strong>Name:</strong> ${archived.name}</p>
      <p style="margin: 2px 0;"><strong>Spent:</strong> $${totalSpent.toFixed(2)} / $${archived.totalBudget.toFixed(2)}</p>
    `;

    historyListContainer.appendChild(card);
  });
}

// -------------------------------------------------------------
// 6. DASHBOARD & FLOATING ACTION BUTTON LOGIC
// -------------------------------------------------------------
btnFabMain.addEventListener('click', () => {
  fabOptions.classList.toggle('hidden');
});

btnFabEditBudget.addEventListener('click', () => {
  fabOptions.classList.add('hidden');
  editTrackerName.value = appState.activeTracker.name;
  editTotalBudget.value = appState.activeTracker.totalBudget;
  modalEditBudget.classList.remove('hidden');
});

btnCloseEditBudgetModal.addEventListener('click', () => {
  modalEditBudget.classList.add('hidden');
});

btnSaveEditBudget.addEventListener('click', () => {
  const newName = editTrackerName.value.trim();
  const newBudget = parseFloat(editTotalBudget.value);

  if (!newName || isNaN(newBudget) || newBudget <= 0) {
    alert("Please enter a valid tracker name and budget ceiling.");
    return;
  }

  appState.activeTracker.name = newName;
  appState.activeTracker.totalBudget = newBudget;

  saveStateToLocalStorage();
  modalEditBudget.classList.add('hidden');
  renderDashboard();
});

btnFabAddEarnings.addEventListener('click', () => {
  fabOptions.classList.add('hidden');
  inputEarningsAmount.value = '';
  modalAddEarnings.classList.remove('hidden');
});

btnCloseEarningsModal.addEventListener('click', () => {
  modalAddEarnings.classList.add('hidden');
});

btnSaveEarnings.addEventListener('click', () => {
  const extraEarnings = parseFloat(inputEarningsAmount.value);
  if (!isNaN(extraEarnings) && extraEarnings > 0) {
    appState.activeTracker.totalEarnings += extraEarnings;
    saveStateToLocalStorage();
    modalAddEarnings.classList.add('hidden');
    renderDashboard();
  } else {
    alert("Please enter a valid earnings amount.");
  }
});

btnFabAddCat.addEventListener('click', () => {
  fabOptions.classList.add('hidden');
  dashNewCatName.value = '';
  dashNewCatLimit.value = '';
  dashNewCatRecurring.checked = false;
  modalAddCategory.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  modalAddCategory.classList.add('hidden');
});

btnSaveModalCat.addEventListener('click', () => {
  const name = dashNewCatName.value.trim();
  const limit = parseFloat(dashNewCatLimit.value);
  const isRecurring = dashNewCatRecurring.checked;

  if (!name || isNaN(limit) || limit <= 0) {
    alert("Please enter a valid category name and limit.");
    return;
  }

  appState.activeTracker.categories.push({
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name,
    limit: limit,
    spent: 0,
    isRecurring: isRecurring,
    history: []
  });

  saveStateToLocalStorage();
  modalAddCategory.classList.add('hidden');
  renderDashboard();
});

btnFabAddGoal.addEventListener('click', () => {
  fabOptions.classList.add('hidden');
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  modalAddGoal.classList.remove('hidden');
});

btnCloseGoalModal.addEventListener('click', () => {
  modalAddGoal.classList.add('hidden');
});

btnSaveGoal.addEventListener('click', () => {
  const name = document.getElementById('goal-name').value.trim();
  const target = parseFloat(document.getElementById('goal-target').value);

  if (!name || isNaN(target) || target <= 0) {
    alert("Please enter a valid goal name and target amount.");
    return;
  }

  if (!appState.activeTracker.savingsGoals) {
    appState.activeTracker.savingsGoals = [];
  }

  appState.activeTracker.savingsGoals.push({
    id: `goal_${Date.now()}`,
    name: name,
    target: target,
    saved: 0
  });

  saveStateToLocalStorage();
  modalAddGoal.classList.add('hidden');
  renderDashboard();
});

btnAddExpense.addEventListener('click', () => {
  const catId = expenseCategorySelect.value;
  const note = expenseNoteInput.value.trim() || "General Expense";
  const amount = parseFloat(expenseAmountInput.value);

  if (!catId) {
    alert("Please select a category.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (category) {
    category.spent += amount;
    if (!category.history) category.history = [];
    
    category.history.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      note: note,
      amount: amount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    expenseNoteInput.value = '';
    expenseAmountInput.value = '';
    saveStateToLocalStorage();
    renderDashboard();
  }
});

inputSearchExpenses.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderDashboard();
});

selectFilterCategory.addEventListener('change', (e) => {
  categoryFilter = e.target.value;
  renderDashboard();
});

function addFundsToGoal(goalId) {
  const goal = appState.activeTracker.savingsGoals.find(g => g.id === goalId);
  if (!goal) return;

  const inputAmount = prompt(`Deposit funds into "${goal.name}" ($):`);
  const amount = parseFloat(inputAmount);

  if (!isNaN(amount) && amount > 0) {
    goal.saved += amount;
    saveStateToLocalStorage();
    renderDashboard();
  }
}

function deleteGoal(goalId) {
  const goal = appState.activeTracker.savingsGoals.find(g => g.id === goalId);
  if (!goal) return;

  showConfirmModal(`Are you sure you want to delete the "${goal.name}" savings goal?`, () => {
    appState.activeTracker.savingsGoals = appState.activeTracker.savingsGoals.filter(g => g.id !== goalId);
    saveStateToLocalStorage();
    renderDashboard();
  });
}

function deleteCategory(catId) {
  const cat = appState.activeTracker.categories.find(c => c.id === catId);
  if (!cat) return;

  showConfirmModal(`Delete category "${cat.name}"? This action cannot be undone.`, () => {
    appState.activeTracker.categories = appState.activeTracker.categories.filter(c => c.id !== catId);
    saveStateToLocalStorage();
    renderDashboard();
  });
}

// -------------------------------------------------------------
// 7. INSIGHTS & ADVICE GENERATOR
// -------------------------------------------------------------
function renderInsights() {
  const inlineAdvice = document.getElementById('inline-advice-content');
  const insightsList = document.getElementById('insights-list');
  if (!inlineAdvice || !insightsList) return;

  const categories = appState.activeTracker.categories;
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  inlineAdvice.innerHTML = '';
  insightsList.innerHTML = '';

  if (totalSpent === 0) {
    inlineAdvice.innerHTML = '✨ No expenses logged yet for this month.';
    return;
  }

  const overBudget = categories.filter(c => c.spent > c.limit);
  if (overBudget.length > 0) {
    inlineAdvice.innerHTML = `<span style="color: #ef4444; font-weight: bold;">⚠️ You are over budget in ${overBudget.length} category/categories!</span>`;
  } else {
    inlineAdvice.innerHTML = `<span style="color: #10b981; font-weight: bold;">✅ Great job!</span> You are within budget for all categories. Keep it up!`;
  }

  categories.forEach(cat => {
    if (cat.spent > 0) {
      const share = ((cat.spent / totalSpent) * 100).toFixed(1);
      const li = document.createElement('li');
      li.innerHTML = `<strong>${share}%</strong> of overall spending went to <em>${cat.name}</em> ($${cat.spent.toFixed(2)})`;
      insightsList.appendChild(li);
    }
  });
}

// -------------------------------------------------------------
// 8. RENDERING DASHBOARD, POST-ITS & PIE CHART
// -------------------------------------------------------------
function renderDashboard() {
  const tracker = appState.activeTracker;
  dashTrackerName.textContent = tracker.name || "My Dashboard";
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  // Update Category Select Dropdowns
  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
  selectFilterCategory.innerHTML = '<option value="ALL">All Categories</option>';

  tracker.categories.forEach(cat => {
    const opt1 = document.createElement('option');
    opt1.value = cat.id;
    opt1.textContent = cat.name;
    expenseCategorySelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = cat.id;
    opt2.textContent = cat.name;
    selectFilterCategory.appendChild(opt2);
  });
  selectFilterCategory.value = categoryFilter;

  // Render Post-it Grid
  postitContainer.innerHTML = '';

  // 1. Render Spending Categories (Yellow Post-its with Transaction Logs)
  tracker.categories.forEach(cat => {
    if (categoryFilter !== "ALL" && cat.id !== categoryFilter) return;

    const percent = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
    let colorClass = 'green';
    if (percent > 75) colorClass = 'yellow';
    if (percent >= 100) colorClass = 'red';

    const card = document.createElement('div');
    card.className = 'postit-note';

    let historyHtml = '';
    if (cat.history && cat.history.length > 0) {
      const filteredHistory = cat.history.filter(txn => {
        const noteText = txn.note || "";
        return noteText.toLowerCase().includes(searchQuery);
      });

      if (filteredHistory.length > 0) {
        historyHtml = '<div class="txn-log-container" style="margin-top:10px; max-height:90px; overflow-y:auto; font-size:11px; border-top:1px dashed #cbd5e1; padding-top:6px;">';
        filteredHistory.slice().reverse().forEach(txn => {
          historyHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom:3px; gap:6px;">
              <span style="color:#334155;"><strong>${txn.date || 'Recent'}</strong>: ${txn.note || 'Expense'}</span>
              <span style="color:#ef4444; font-weight:600;">$${(txn.amount || 0).toFixed(2)}</span>
            </div>
          `;
        });
        historyHtml += '</div>';
      }
    }

    card.innerHTML = `
      <div>
        <div class="postit-header">
          <span>📌 ${cat.name}</span>
          <button class="btn-delete-cat" onclick="deleteCategory('${cat.id}')">✕</button>
        </div>
        <div class="postit-details">
          <p><strong>Spent:</strong> $${cat.spent.toFixed(2)}</p>
          <p><strong>Limit:</strong> $${cat.limit.toFixed(2)}</p>
          <div class="battery-container">
            <div class="battery-fill ${colorClass}" style="width: ${Math.min(percent, 100)}%;"></div>
          </div>
          <div class="battery-text">${percent.toFixed(1)}% used</div>
          ${historyHtml}
        </div>
      </div>
    `;
    postitContainer.appendChild(card);
  });

  // 2. Render Savings Goals (Blue Post-its)
  if (tracker.savingsGoals) {
    tracker.savingsGoals.forEach(goal => {
      if (categoryFilter !== "ALL") return;

      const percent = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;

      const card = document.createElement('div');
      card.className = 'postit-note savings-goal';

      card.innerHTML = `
        <div>
          <div class="postit-header">
            <span>🎯 ${goal.name}</span>
            <button class="btn-delete-cat" onclick="deleteGoal('${goal.id}')">✕</button>
          </div>
          <div class="postit-details">
            <p><strong>Saved:</strong> $${goal.saved.toFixed(2)} / $${goal.target.toFixed(2)}</p>
            <div class="battery-container">
              <div class="battery-fill" style="width: ${percent}%; background-color: #0284c7;"></div>
            </div>
            <div class="battery-text">${percent.toFixed(1)}% reached</div>
            <button class="btn-deposit" style="margin-top: 12px;" onclick="addFundsToGoal('${goal.id}')">+ Deposit Funds</button>
          </div>
        </div>
      `;
      postitContainer.appendChild(card);
    });
  }

  renderInsights();
  renderChart();
}

// -------------------------------------------------------------
// 9. CHART & CSV EXPORT
// -------------------------------------------------------------
function renderChart() {
  const ctx = document.getElementById('spendingPieChart').getContext('2d');
  const emptyState = document.getElementById('chart-empty-state');

  const labels = [];
  const data = [];
  const colors = ['#f472b6', '#38bdf8', '#fbbf24', '#a78bfa', '#f87171'];

  let totalSpent = 0;
  appState.activeTracker.categories.forEach(cat => {
    if (cat.spent > 0) {
      labels.push(cat.name);
      data.push(cat.spent);
      totalSpent += cat.spent;
    }
  });

  const remainingBudget = appState.activeTracker.totalBudget - totalSpent;
  if (remainingBudget > 0) {
    labels.push("Unused Budget");
    data.push(remainingBudget);
  }

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  if (data.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  const backgroundColors = labels.map((label, idx) => {
    if (label === "Unused Budget") return '#34d399';
    return colors[idx % colors.length];
  });

  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

btnExportCSV.addEventListener('click', () => {
  let csvContent = "data:text/csv;charset=utf-8,Category,Spent,Limit\n";

  appState.activeTracker.categories.forEach(cat => {
    csvContent += `"${cat.name}",${cat.spent},${cat.limit}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `budget_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
