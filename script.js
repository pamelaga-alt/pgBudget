console.log("Budget Tracker initialized!");

// 1. STATE INITIALIZATION
const STORAGE_KEY = "budget_tracker_app_state";

let appState = {
  activeTracker: {
    id: null,
    name: "",
    totalBudget: 0,
    totalEarnings: 0,
    categories: [] // [{ id, name, limit, spent, history: [{ amount, date }] }]
  },
  savedTrackers: [],
  settings: { lastUpdated: null }
};

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

// Keep track of open Post-It history views
const openHistoryCards = new Set();

// 2. DOM ELEMENTS
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const pageDashboard = document.getElementById('page-dashboard');

const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');
const btnBackHome = document.getElementById('btn-back-home');

// Form Setup Elements
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

let configuredCategories = [];

function navigateTo(targetPage) {
  [page1, page2, pageDashboard].forEach(page => page.classList.add('hidden'));
  targetPage.classList.remove('hidden');
}

// 3. EVENT LISTENERS & NAVIGATION
btnNewTracker.addEventListener('click', () => {
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  customCategoryGroup.classList.add('hidden');
  navigateTo(page2);
});

btnOldTracker.addEventListener('click', () => {
  if (loadStateFromLocalStorage() && appState.activeTracker && appState.activeTracker.name) {
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

  if (categoryName === 'Other') {
    categoryName = customCategoryNameInput.value.trim();
  }

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
    createdAt: new Date().toISOString(),
    name: trackerName,
    totalBudget: totalBudget,
    totalEarnings: totalEarnings,
    categories: [...configuredCategories]
  };

  appState.savedTrackers.push(appState.activeTracker);
  saveStateToLocalStorage();

  renderDashboard();
  navigateTo(pageDashboard);
});

// 4. FLOATING BUTTON & MODAL LOGIC (Add Category on Dashboard)
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

  const newCategory = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name,
    limit: limit,
    spent: 0,
    history: []
  };

  appState.activeTracker.categories.push(newCategory);
  saveStateToLocalStorage();
  modalAddCategory.classList.add('hidden');
  renderDashboard();
});

// 5. EXPENSE LOGGING & DASHBOARD RENDER WITH INTERACTIVE HISTORY
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
    
    // Log timestamped transaction entry
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

  dashTrackerName.textContent = tracker.name;
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  // Re-populate spending category choices
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

    // Toggle history view state when clicking card
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

    // Click handler to reveal / hide spending log details
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
