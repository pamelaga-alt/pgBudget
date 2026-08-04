console.log("Budget Tracker initialized!");

// -------------------------------------------------------------
// 1. STATE INITIALIZATION & MONTHLY TRACKING
// -------------------------------------------------------------
const STORAGE_KEY = "budget_tracker_app_state";

let appState = {
  activeTracker: {
    id: null,
    name: "",
    monthYear: "", // e.g. "August 2026"
    totalBudget: 0,
    totalEarnings: 0,
    categories: []
  },
  archivedTrackers: [], // Array to store past monthly reports
  settings: { lastUpdated: null }
};

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

const openHistoryCards = new Set();

// -------------------------------------------------------------
// 2. DOM ELEMENTS
// -------------------------------------------------------------
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const pageDashboard = document.getElementById('page-dashboard');

const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');
const btnBackHome = document.getElementById('btn-back-home');

// Setup Form Elements
const setupForm = document.getElementById('setup-form');
const categorySelect = document.getElementById('category-select');
const customCategoryGroup = document.getElementById('custom-category-group');
const customCategoryNameInput = document.getElementById('custom-category-name');
const categoryAmountInput = document.getElementById('category-amount');
const btnAddCategory = document.getElementById('btn-add-category');
const activeCategoriesList = document.getElementById('active-categories');

// Dashboard Elements
const dashTrackerName = document.getElementById('dash-tracker-name');
const dashTotalBudget = document.getElementById('dash-total-budget');
const dashEarnings = document.getElementById('dash-earnings');
const postitContainer = document.getElementById('postit-container');
const expenseCategorySelect = document.getElementById('expense-category-select');
const expenseAmountInput = document.getElementById('expense-amount-input');
const btnAddExpense = document.getElementById('btn-add-expense');

// Floating Modal Elements
const btnFloatingAddCat = document.getElementById('btn-floating-add-cat');
const modalAddCategory = document.getElementById('modal-add-category');
const btnSaveModalCat = document.getElementById('btn-save-modal-cat');
const btnCloseModal = document.getElementById('btn-close-modal');
const dashNewCatName = document.getElementById('dash-new-cat-name');
const dashNewCatLimit = document.getElementById('dash-new-cat-limit');

// Sidebar History Elements
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const sidebarHistory = document.getElementById('sidebar-history');
const historyListContainer = document.getElementById('history-list-container');

// Monthly Summary Modal Elements
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

// -------------------------------------------------------------
// 3. NAVIGATION & SETUP FORM
// -------------------------------------------------------------
btnNewTracker.addEventListener('click', () => {
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  customCategoryGroup.classList.add('hidden');
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
    history: []
  });

  const listItem = document.createElement('li');
  listItem.textContent = `${categoryName}: $${amount.toFixed(2)}`;
  activeCategoriesList.appendChild(listItem);

  categorySelect.value = '';
  customCategoryNameInput.value = '';
  categoryAmountInput.value = '';
  customCategoryGroup.classList.add('hidden');
});

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const trackerName = document.getElementById('tracker-name').value;
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
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
// 4. MONTHLY ROLLOVER CHECK & SUMMARY MODAL
// -------------------------------------------------------------
function checkMonthlyRollover() {
  const currentMonth = getCurrentMonthYear();
  const tracker = appState.activeTracker;

  // If saved month is different from current month, trigger summary report!
  if (tracker && tracker.monthYear && tracker.monthYear !== currentMonth) {
    showMonthlySummaryModal(tracker);
  }
}

function showMonthlySummaryModal(pastTracker) {
  summaryMonthName.textContent = `Report for ${pastTracker.monthYear} (${pastTracker.name})`;

  let totalSpent = 0;
  let breakdownHtml = '<ul>';
  
  pastTracker.categories.forEach(cat => {
    totalSpent += cat.spent;
    breakdownHtml += `<li><strong>${cat.name}:</strong> Spent $${cat.spent.toFixed(2)} / $${cat.limit.toFixed(2)}</li>`;
  });
  breakdownHtml += '</ul>';

  summaryReportDetails.innerHTML = `
    <p><strong>Total Spending:</strong> $${totalSpent.toFixed(2)} / $${pastTracker.totalBudget.toFixed(2)}</p>
    <br>
    ${breakdownHtml}
  `;

  modalMonthlySummary.classList.remove('hidden');
}

// Option A: Keep Same Budget (Archive old & Reset current spending)
btnKeepBudget.addEventListener('click', () => {
  // 1. Archive previous month state
  if (!appState.archivedTrackers) appState.archivedTrackers = [];
  appState.archivedTrackers.push({ ...appState.activeTracker });

  // 2. Reset spending for the new month
  appState.activeTracker.monthYear = getCurrentMonthYear();
  appState.activeTracker.categories.forEach(cat => {
    cat.spent = 0;
    cat.history = [];
  });

  saveStateToLocalStorage();
  modalMonthlySummary.classList.add('hidden');
  renderDashboard();
});

// Option B: Start Fresh (Archive old & navigate to setup)
btnNewBudget.addEventListener('click', () => {
  if (!appState.archivedTrackers) appState.archivedTrackers = [];
  appState.archivedTrackers.push({ ...appState.activeTracker });

  saveStateToLocalStorage();
  modalMonthlySummary.classList.add('hidden');
  
  // Reset setup form and go to Page 2
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  navigateTo(page2);
});

// -------------------------------------------------------------
// 5. SIDEBAR HISTORY LOGIC
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

  // Render past months list
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
// 6. DASHBOARD & FLOATING MODAL LOGIC
// -------------------------------------------------------------
btnFloatingAddCat.addEventListener('click', () => {
  dashNewCatName.value = '';
  dashNewCatLimit.value = '';
  modalAddCategory.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  modalAddCategory.classList.add('hidden');
});

btnSaveModalCat.addEventListener('click', () => {
  const name = dashNewCatName.value.trim();
  const limit = parseFloat(dashNewCatLimit.value);

  if (!name || isNaN(limit) || limit <= 0) {
    alert("Please enter a valid category name and limit.");
    return;
  }

  appState.activeTracker.categories.push({
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name,
    limit: limit,
    spent: 0,
    history: []
  });

  saveStateToLocalStorage();
  modalAddCategory.classList.add('hidden');
  renderDashboard();
});

btnAddExpense.addEventListener('click', () => {
  const selectedCatId = expenseCategorySelect.value;
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
      amount: amount,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    saveStateToLocalStorage();
    renderDashboard();
    expenseAmountInput.value = '';
  }
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

    let historyHtml = '';
    if (isHistoryOpen) {
      const logs = cat.history && cat.history.length > 0
        ? cat.history.map(h => `<li><span>${h.date}</span> <strong>+$${h.amount.toFixed(2)}</strong></li>`).join('')
        : '<li><em>No logs recorded yet</em></li>';

      historyHtml = `
        <div class="history-section">
          <strong>Transaction Log:</strong>
          <ul class="history-list">${logs}</ul>
        </div>
      `;
    }

    note.innerHTML = `
      <div>
        <div class="postit-header">📌 ${cat.name}</div>
        <div class="postit-details">
          <p><strong>Spent:</strong> $${cat.spent.toFixed(2)}</p>
          <p><strong>Limit:</strong> $${cat.limit.toFixed(2)}</p>
        </div>
      </div>
      
      <div>
        <div class="battery-container">
          <div class="battery-fill ${colorClass}" style="width: ${cappedWidth}%;"></div>
        </div>
        <div class="battery-text">${fillPercent.toFixed(1)}% Used</div>
        ${historyHtml}
        <div class="history-hint">${isHistoryOpen ? '▲ Click to hide history' : '▼ Click to view history'}</div>
      </div>
    `;

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
}
