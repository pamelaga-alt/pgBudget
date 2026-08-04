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
    categories: []
  },
  archivedTrackers: [],
  settings: { lastUpdated: null }
};

let pieChartInstance = null;
let currentAdviceHtml = "";
const openHistoryCards = new Set();

// Active tracking for transaction editing modal
let currentEditingCatId = null;
let currentEditingExpenseId = null;

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
const btnAddEarnings = document.getElementById('btn-add-earnings');
const postitContainer = document.getElementById('postit-container');
const expenseCategorySelect = document.getElementById('expense-category-select');
const expenseNoteInput = document.getElementById('expense-note-input');
const expenseAmountInput = document.getElementById('expense-amount-input');
const btnAddExpense = document.getElementById('btn-add-expense');
const insightsList = document.getElementById('insights-list');
const btnExportCSV = document.getElementById('btn-export-csv');

const btnFloatingAddCat = document.getElementById('btn-floating-add-cat');
const modalAddCategory = document.getElementById('modal-add-category');
const btnSaveModalCat = document.getElementById('btn-save-modal-cat');
const btnCloseModal = document.getElementById('btn-close-modal');
const dashNewCatName = document.getElementById('dash-new-cat-name');
const dashNewCatLimit = document.getElementById('dash-new-cat-limit');
const dashNewCatRecurring = document.getElementById('dash-new-cat-recurring');

const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const sidebarHistory = document.getElementById('sidebar-history');
const historyListContainer = document.getElementById('history-list-container');

const modalMonthlySummary = document.getElementById('modal-monthly-summary');
const summaryMonthName = document.getElementById('summary-month-name');
const summaryReportDetails = document.getElementById('summary-report-details');
const btnKeepBudget = document.getElementById('btn-keep-budget');
const btnNewBudget = document.getElementById('btn-new-budget');

const btnToggleAdvice = document.getElementById('btn-toggle-advice');
const modalAdvice = document.getElementById('modal-advice');
const adviceContent = document.getElementById('advice-content');
const btnCloseAdviceModal = document.getElementById('btn-close-advice-modal');

// Edit Expense Modal Elements
const modalEditExpense = document.getElementById('modal-edit-expense');
const editExpenseNote = document.getElementById('edit-expense-note');
const editExpenseAmount = document.getElementById('edit-expense-amount');
const btnSaveEditExpense = document.getElementById('btn-save-edit-expense');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');

let configuredCategories = [];

function navigateTo(targetPage) {
  [page1, page2, pageDashboard].forEach(page => page.classList.add('hidden'));
  targetPage.classList.remove('hidden');
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
    categories: [...configuredCategories]
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
// 6. DASHBOARD & INTERACTION LOGIC
// -------------------------------------------------------------
btnAddEarnings.addEventListener('click', () => {
  const extraEarnings = parseFloat(prompt("Enter additional earnings amount ($):"));
  if (!isNaN(extraEarnings) && extraEarnings > 0) {
    appState.activeTracker.totalEarnings += extraEarnings;
    saveStateToLocalStorage();
    renderDashboard();
  }
});

btnFloatingAddCat.addEventListener('click', () => {
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

// Category Deletion
function deleteCategory(catId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category) return;

  if (confirm(`Are you sure you want to delete the "${category.name}" category and its logged expenses?`)) {
    appState.activeTracker.categories = appState.activeTracker.categories.filter(c => c.id !== catId);
    openHistoryCards.delete(catId);
    saveStateToLocalStorage();
    renderDashboard();
  }
}

// Transaction Logging Actions: Delete & Edit
function deleteExpense(catId, expenseId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category || !category.history) return;

  const expenseIdx = category.history.findIndex(h => h.id === expenseId);
  if (expenseIdx > -1) {
    const removedExpense = category.history.splice(expenseIdx, 1)[0];
    category.spent = Math.max(0, category.spent - removedExpense.amount);

    saveStateToLocalStorage();
    renderDashboard();
  }
}

// Triggered when clicking ✏️ on a log item
function editExpense(catId, expenseId) {
  const category = appState.activeTracker.categories.find(c => c.id === catId);
  if (!category || !category.history) return;

  const expense = category.history.find(h => h.id === expenseId);
  if (!expense) return;

  currentEditingCatId = catId;
  currentEditingExpenseId = expenseId;

  editExpenseNote.value = expense.item;
  editExpenseAmount.value = expense.amount;

  modalEditExpense.classList.remove('hidden');
}

// Close Edit Expense Modal
btnCloseEditModal.addEventListener('click', () => {
  modalEditExpense.classList.add('hidden');
  currentEditingCatId = null;
  currentEditingExpenseId = null;
});

// Save Edited Expense Details
btnSaveEditExpense.addEventListener('click', () => {
  if (!currentEditingCatId || !currentEditingExpenseId) return;

  const category = appState.activeTracker.categories.find(c => c.id === currentEditingCatId);
  if (!category || !category.history) return;

  const expense = category.history.find(h => h.id === currentEditingExpenseId);
  if (!expense) return;

  const newNote = editExpenseNote.value.trim() || "Uncategorized Expense";
  const newAmount = parseFloat(editExpenseAmount.value);

  if (isNaN(newAmount) || newAmount <= 0) {
    alert("Please enter a valid spending amount.");
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
  if (!tracker) return;

  const labels = tracker.categories.map(c => c.name);
  const data = tracker.categories.map(c => c.spent);

  const totalSpent = data.reduce((a, b) => a + b, 0);
  const totalBudget = tracker.totalBudget || 1;
  const unusedBudget = Math.max(0, totalBudget - totalSpent);

  labels.push("Unused Budget");
  data.push(unusedBudget);

  const ctx = document.getElementById('spendingPieChart').getContext('2d');

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
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f8fafc' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = ((value / chartSum) * 100).toFixed(1);
              return `${context.label}: ${percentage}%`;
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
    currentAdviceHtml = '<p>No spending logged yet! Log expenses to get tailored advice.</p>';
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
    currentAdviceHtml = `<p>✅ <strong>Great job!</strong> You are within budget for all categories. Keep it up!</p>`;
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
    currentAdviceHtml = adviceList;
  }
}

btnToggleAdvice.addEventListener('click', () => {
  adviceContent.innerHTML = currentAdviceHtml;
  modalAdvice.classList.remove('hidden');
});

btnCloseAdviceModal.addEventListener('click', () => {
  modalAdvice.classList.add('hidden');
});

function renderDashboard() {
  const tracker = appState.activeTracker;
  if (!tracker) return;

  dashTrackerName.textContent = `${tracker.name} (${tracker.monthYear || getCurrentMonthYear()})`;
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
  tracker.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    expenseCategorySelect.appendChild(opt);
  });

  postitContainer.innerHTML = '';

  tracker.categories.forEach(cat => {
    const fillPercent = (cat.spent / cat.limit) * 100;
    const cappedWidth = Math.min(fillPercent, 100);

    let colorClass = 'green';
    if (fillPercent >= 100) colorClass = 'red';
    else if (fillPercent >= 76) colorClass = 'yellow';

    const note = document.createElement('div');
    note.className = 'postit-note';

    const isHistoryOpen = openHistoryCards.has(cat.id);
    const icon = cat.isRecurring ? '🔄' : '📌';

    // Header Element with Delete Category Button
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

    // Body Element
    const bodyDiv = document.createElement('div');
    bodyDiv.innerHTML = `
      <div class="postit-details">
        <p><strong>Spent:</strong> $${cat.spent.toFixed(2)}</p>
        <p><strong>Limit:</strong> $${cat.limit.toFixed(2)}</p>
      </div>
    `;

    // Footer Element with History Logs & Actions
    const footerDiv = document.createElement('div');

    if (isHistoryOpen) {
      const historyContainer = document.createElement('div');
      historyContainer.className = 'history-section';
      historyContainer.innerHTML = '<strong>Transaction Log:</strong>';

      const historyUl = document.createElement('ul');
      historyUl.className = 'history-list';

      if (cat.history && cat.history.length > 0) {
        cat.history.forEach(h => {
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
        historyUl.innerHTML = '<li><em>No logs recorded yet</em></li>';
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

    // Expand/Collapse Toggle
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

  renderPieChart();
  updateInsightsWidget();
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
