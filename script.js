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
const openHistoryCards = new Set();

let currentEditingCatId = null;
let currentEditingExpenseId = null;

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
      if (!appState.activeTracker.savingsGoals) {
        appState.activeTracker.savingsGoals = [];
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
// 2. DOM ELEMENTS & CUSTOM MODAL CONFIRMATION HELPER
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
const insightsList = document.getElementById('insights-list');
const inlineAdviceContent = document.getElementById('inline-advice-content');
const btnExportCSV = document.getElementById('btn-export-csv');

// FAB Elements
const btnFabMain = document.getElementById('btn-fab-main');
const fabOptions = document.getElementById('fab-options');
const btnFabAddEarnings = document.getElementById('btn-fab-add-earnings');
const btnFabAddCat = document.getElementById('btn-fab-add-cat');
const btnFabAddGoal = document.getElementById('btn-fab-add-goal');

// Modals
const modalConfirm = document.getElementById('modal-confirm');
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

const modalEditExpense = document.getElementById('modal-edit-expense');
const btnSaveEditExpense = document.getElementById('btn-save-edit-expense');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');

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
    btnYes.replaceWith(btnYes.cloneNode(true));
    btnNo.replaceWith(btnNo.cloneNode(true));
  };

  document.getElementById('btn-confirm-yes').onclick = () => {
    cleanup();
    onConfirm();
  };

  document.getElementById('btn-confirm-no').onclick = () => {
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
    ? `<div style="margin-top:10px; border-top: 1px dashed #334155; padding-top:8px;"><strong>💡 Next Month Advice:</strong><br>${reorderAdvice.join('<br>')}</div>`
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
    historyListContainer.innerHTML = '<p class="empty-msg">No archived months yet.</p>';
    return;
  }

  appState.archivedTrackers.slice().reverse().forEach(archived => {
    const card = document.createElement('div');
    card.className = 'archived-month-card';

    let totalSpent = archived.categories.reduce((sum, c) => sum + c.spent, 0);

    card.innerHTML = `
      <h4>${archived.monthYear}</h4>
      <p><strong>Name:</strong> ${archived.name}</p>
      <p><strong>Spent:</strong> $${totalSpent.toFixed(2)} / $${archived.totalBudget.toFixed(2)}</p>
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

  const amount = parseFloat(prompt(`Deposit funds into "${goal.name}" ($):`));
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

btnAddExpense.addEventListener('click', () => {
  const selectedCatId = expenseCategorySelect.value;
  const noteText = expenseNoteInput.value.trim() || "Uncategorized Expense";
  const amount = parseFloat(expenseAmountInput.value);

  if (!selectedCatId || isNaN(amount) || amount <= 0) {
    alert("Please select a category and enter a valid spending amount.");
    return;
  }

  const category = appState.activeTracker.categories.find(c => c.id === selectedCatId);
  if (category) {
    category.spent += amount;
    if (!category.history) category.history = [];
    
    category.history.push({
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      item: noteText,
      amount: amount,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    saveStateToLocalStorage();
    renderDashboard();
    expenseAmountInput.value = '';
    expenseNoteInput.value = '';
  }
});

function deleteCategory(catId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category) return;

  showConfirmModal(`Are you sure you want to delete "${category.name}" and all its logged expenses?`, () => {
    appState.activeTracker.categories = appState.activeTracker.categories.filter(c => c.id !== catId);
    openHistoryCards.delete(catId);
    saveStateToLocalStorage();
    renderDashboard();
  });
}

function deleteExpense(catId, expenseId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category || !category.history) return;

  const expenseIdx = category.history.findIndex(h => h.id === expenseId);
  if (expenseIdx > -1) {
    showConfirmModal("Delete this transaction entry?", () => {
      const removedExpense = category.history.splice(expenseIdx, 1)[0];
      category.spent = Math.max(0, category.spent - removedExpense.amount);

      saveStateToLocalStorage();
      renderDashboard();
    });
  }
}

function editExpense(catId, expenseId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category || !category.history) return;

  const expense = category.history.find(h => h.id === expenseId);
  if (!expense) return;

  currentEditingCatId = catId;
  currentEditingExpenseId = expenseId;

  document.getElementById('edit-expense-note').value = expense.item;
  document.getElementById('edit-expense-amount').value = expense.amount;

  modalEditExpense.classList.remove('hidden');
}

btnCloseEditModal.addEventListener('click', (e) => {
  e.preventDefault();
  modalEditExpense.classList.add('hidden');
  currentEditingCatId = null;
  currentEditingExpenseId = null;
});

btnSaveEditExpense.addEventListener('click', (e) => {
  e.preventDefault();

  if (!currentEditingCatId || !currentEditingExpenseId) return;

  const category = appState.activeTracker.categories.find(c => c.id === currentEditingCatId);
  if (!category || !category.history) return;

  const expense = category.history.find(h => h.id === currentEditingExpenseId);
  if (!expense) return;

  const noteInput = document.getElementById('edit-expense-note');
  const amountInput = document.getElementById('edit-expense-amount');

  const newNote = noteInput.value.trim() || "Uncategorized Expense";
  const newAmount = parseFloat(amountInput.value);

  if (isNaN(newAmount) || newAmount <= 0) {
    alert("Please enter a valid spending amount greater than $0.");
    return;
  }

  category.spent = Math.max(0, (category.spent - expense.amount) + newAmount);
  expense.item = newNote;
  expense.amount = newAmount;

  saveStateToLocalStorage();
  modalEditExpense.classList.add('hidden');
  currentEditingCatId = null;
  currentEditingExpenseId = null;
  renderDashboard();
});

function renderPieChart() {
  const tracker = appState.activeTracker;
  const canvas = document.getElementById('spendingPieChart');
  const emptyState = document.getElementById('chart-empty-state');

  if (!tracker) return;

  const totalSpent = tracker.categories.reduce((sum, c) => sum + c.spent, 0);

  // EMPTY STATE GRAPHIC CHECK
  if (totalSpent === 0) {
    canvas.classList.add('hidden');
    emptyState.classList.remove('hidden');
    if (pieChartInstance) pieChartInstance.destroy();
    return;
  }

  // Show Chart, hide empty state
  canvas.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const labels = tracker.categories.map(c => c.name);
  const data = tracker.categories.map(c => c.spent);

  const totalBudget = tracker.totalBudget || 1;
  const unusedBudget = Math.max(0, totalBudget - totalSpent);

  labels.push("Unused Budget");
  data.push(unusedBudget);

  const ctx = canvas.getContext('2d');

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const chartSum = data.reduce((a, b) => a + b, 0);

  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#f87171', '#38bdf8', '#fbbf24', '#34d399', 
          '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#334155'
        ],
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            color: '#f8fafc',
            boxWidth: 12,
            padding: 12,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = chartSum > 0 ? ((value / chartSum) * 100).toFixed(1) : 0;
              return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function updateInsightsWidget() {
  insightsList.innerHTML = '';
  const tracker = appState.activeTracker;
  if (!tracker) return;

  const totalSpent = tracker.categories.reduce((sum, c) => sum + c.spent, 0);

  if (totalSpent === 0) {
    insightsList.innerHTML = '<li>Log expenses to see percentage breakdowns!</li>';
    inlineAdviceContent.innerHTML = '<p>No spending logged yet! Log expenses to get tailored advice.</p>';
    return;
  }

  tracker.categories.forEach(cat => {
    if (cat.spent > 0) {
      const percentage = ((cat.spent / totalSpent) * 100).toFixed(1);
      const li = document.createElement('li');
      li.innerHTML = `<strong>${percentage}%</strong> of overall spending went to <em>${cat.name}</em> ($${cat.spent.toFixed(2)})`;
      insightsList.appendChild(li);
    }
  });

  const overspentCats = [];
  const underspentCats = [];

  tracker.categories.forEach(cat => {
    const difference = cat.limit - cat.spent;
    if (difference < 0) {
      overspentCats.push({ name: cat.name, deficit: Math.abs(difference) });
    } else if (difference > 0) {
      underspentCats.push({ name: cat.name, surplus: difference });
    }
  });

  if (overspentCats.length === 0) {
    inlineAdviceContent.innerHTML = `<p>✅ <strong>Great job!</strong> You are within budget for all categories. Keep it up!</p>`;
  } else {
    let adviceList = '<ul style="list-style-type: none; padding-left: 0;">';
    
    overspentCats.forEach(over => {
      adviceList += `<li style="margin-bottom: 8px;">⚠️ <strong>Overspent:</strong> You went over budget in <em>${over.name}</em> by <strong>$${over.deficit.toFixed(2)}</strong>.</li>`;

      underspentCats.forEach(under => {
        if (under.surplus > 0) {
          const moveAmount = Math.min(over.deficit, under.surplus);
          adviceList += `<li style="padding-left: 15px; margin-bottom: 6px;">💡 <em>Reorder Suggestion:</em> Move <strong>$${moveAmount.toFixed(2)}</strong> from <strong>${under.name}</strong> to cover <strong>${over.name}</strong>.</li>`;
        }
      });
    });

    adviceList += '</ul>';
    inlineAdviceContent.innerHTML = adviceList;
  }
}

function renderDashboard() {
  const tracker = appState.activeTracker;
  if (!tracker) return;

  dashTrackerName.textContent = `${tracker.name} (${tracker.monthYear || getCurrentMonthYear()})`;
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
  selectFilterCategory.innerHTML = '<option value="ALL">All Categories</option>';

  tracker.categories.forEach(cat => {
    const optExp = document.createElement('option');
    optExp.value = cat.id;
    optExp.textContent = cat.name;
    expenseCategorySelect.appendChild(optExp);

    const optFilt = document.createElement('option');
    optFilt.value = cat.id;
    optFilt.textContent = cat.name;
    if (categoryFilter === cat.id) optFilt.selected = true;
    selectFilterCategory.appendChild(optFilt);
  });

  postitContainer.innerHTML = '';

  tracker.categories.forEach(cat => {
    if (categoryFilter !== 'ALL' && cat.id !== categoryFilter) return;

    let filteredHistory = cat.history || [];
    if (searchQuery) {
      filteredHistory = filteredHistory.filter(h => h.item.toLowerCase().includes(searchQuery));
      if (filteredHistory.length === 0) return;
    }

    const fillPercent = (cat.spent / cat.limit) * 100;
    const cappedWidth = Math.min(fillPercent, 100);

    let colorClass = 'green';
    if (fillPercent >= 100) colorClass = 'red';
    else if (fillPercent >= 76) colorClass = 'yellow';

    const note = document.createElement('div');
    note.className = 'postit-note';

    const isHistoryOpen = openHistoryCards.has(cat.id) || searchQuery.length > 0;
    const icon = cat.isRecurring ? '🔄' : '📌';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'postit-header';
    headerDiv.innerHTML = `<span>${icon} ${cat.name}</span>`;

    const btnDeleteCat = document.createElement('button');
    btnDeleteCat.className = 'btn-delete-cat';
    btnDeleteCat.title = 'Delete Category';
    btnDeleteCat.textContent = '✕';
    btnDeleteCat.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCategory(cat.id);
    });

    headerDiv.appendChild(btnDeleteCat);

    const bodyDiv = document.createElement('div');
    bodyDiv.innerHTML = `
      <div class="postit-details">
        <p><strong>Spent:</strong> $${cat.spent.toFixed(2)}</p>
        <p><strong>Limit:</strong> $${cat.limit.toFixed(2)}</p>
      </div>
    `;

    const footerDiv = document.createElement('div');

    if (isHistoryOpen) {
      const historyContainer = document.createElement('div');
      historyContainer.className = 'history-section';
      historyContainer.innerHTML = '<strong>Transaction Log:</strong>';

      const historyUl = document.createElement('ul');
      historyUl.className = 'history-list';

      if (filteredHistory.length > 0) {
        filteredHistory.forEach(h => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${h.date} - ${h.item}</span>
            <span class="action-span">
              <strong>+$${h.amount.toFixed(2)}</strong>
              <button class="btn-icon-action btn-edit-exp" title="Edit">✏️</button>
              <button class="btn-icon-action btn-del-exp" title="Delete">✕</button>
            </span>
          `;

          li.querySelector('.btn-edit-exp').addEventListener('click', (e) => {
            e.stopPropagation();
            editExpense(cat.id, h.id);
          });

          li.querySelector('.btn-del-exp').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteExpense(cat.id, h.id);
          });

          historyUl.appendChild(li);
        });
      } else {
        historyUl.innerHTML = '<li><em>No matching logs found</em></li>';
      }

      historyContainer.appendChild(historyUl);
      footerDiv.appendChild(historyContainer);
    }

    const batteryDiv = document.createElement('div');
    batteryDiv.innerHTML = `
      <div class="battery-container" style="margin-top: 8px;">
        <div class="battery-fill ${colorClass}" style="width: ${cappedWidth}%;"></div>
      </div>
      <div class="battery-text">${fillPercent.toFixed(1)}% Used</div>
      <div class="history-hint">${isHistoryOpen ? '▲ Hide history' : '▼ View history'}</div>
    `;
    footerDiv.appendChild(batteryDiv);

    note.appendChild(headerDiv);
    note.appendChild(bodyDiv);
    note.appendChild(footerDiv);

    note.addEventListener('click', () => {
      if (openHistoryCards.has(cat.id)) {
        openHistoryCards.delete(cat.id);
      } else {
        openHistoryCards.add(cat.id);
      }
      renderDashboard();
    });

    postitContainer.appendChild(note);
  });

  renderSavingsGoals();
  renderPieChart();
  updateInsightsWidget();
}

function renderSavingsGoals() {
  const goals = appState.activeTracker.savingsGoals || [];
  if (categoryFilter !== 'ALL') return;

  goals.forEach(goal => {
    if (searchQuery && !goal.name.toLowerCase().includes(searchQuery)) return;

    const progressPercent = Math.min((goal.saved / goal.target) * 100, 100);

    const goalCard = document.createElement('div');
    goalCard.className = 'postit-note';

    goalCard.innerHTML = `
      <div class="postit-header">
        <span>🎯 ${goal.name}</span>
        <button class="btn-delete-cat btn-del-goal" title="Delete Goal">✕</button>
      </div>
      <div class="postit-details">
        <p><strong>Saved:</strong> $${goal.saved.toFixed(2)}</p>
        <p><strong>Target:</strong> $${goal.target.toFixed(2)}</p>
      </div>
      <div class="battery-container" style="margin-top: 8px;">
        <div class="battery-fill green" style="width: ${progressPercent}%;"></div>
      </div>
      <div class="battery-text" style="margin-bottom: 10px;">${progressPercent.toFixed(1)}% Reached</div>
      <button class="btn-small btn-deposit" style="width: 100%;">+ Deposit Funds</button>
    `;

    goalCard.querySelector('.btn-del-goal').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteGoal(goal.id);
    });

    goalCard.querySelector('.btn-deposit').addEventListener('click', (e) => {
      e.stopPropagation();
      addFundsToGoal(goal.id);
    });

    postitContainer.appendChild(goalCard);
  });
}

// -------------------------------------------------------------
// 7. CSV EXPORT FUNCTIONALITY
// -------------------------------------------------------------
btnExportCSV.addEventListener('click', () => {
  const tracker = appState.activeTracker;
  if (!tracker) return;

  let csvRows = [];
  csvRows.push(`Budget Tracker Name,${tracker.name}`);
  csvRows.push(`Month/Year,${tracker.monthYear}`);
  csvRows.push(`Total Monthly Budget Ceiling,$${tracker.totalBudget.toFixed(2)}`);
  csvRows.push(`Total Earnings,$${tracker.totalEarnings.toFixed(2)}`);
  csvRows.push("");
  csvRows.push("Category Name,Type,Limit ($),Spent ($),Usage (%)");

  tracker.categories.forEach(cat => {
    const usage = ((cat.spent / cat.limit) * 100).toFixed(1);
    const type = cat.isRecurring ? "Recurring" : "Variable";
    csvRows.push(`"${cat.name}",${type},${cat.limit.toFixed(2)},${cat.spent.toFixed(2)},${usage}%`);
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${tracker.name.replace(/\s+/g, '_')}_Summary.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});
