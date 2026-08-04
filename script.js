// Test connection
console.log("Budget Tracker initialized!");

// -------------------------------------------------------------
// 1. STATE INITIALIZATION (JSON Schema)
// -------------------------------------------------------------
const STORAGE_KEY = "budget_tracker_app_state";

let appState = {
  activeTracker: {
    id: null,
    name: "",
    totalBudget: 0,
    totalEarnings: 0,
    categories: [] // [{ id: 'cat_1', name: 'Food', limit: 100, spent: 0 }]
  },
  savedTrackers: [],
  settings: {
    lastUpdated: null
  }
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

// -------------------------------------------------------------
// 2. DOM ELEMENTS
// -------------------------------------------------------------
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const pageDashboard = document.getElementById('page-dashboard');

const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');
const btnBackHome = document.getElementById('btn-back-home');

// Form Elements
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

let configuredCategories = [];

function navigateTo(targetPage) {
  [page1, page2, pageDashboard].forEach(page => page.classList.add('hidden'));
  targetPage.classList.remove('hidden');
}

// -------------------------------------------------------------
// 3. NAVIGATION & CATEGORY CONFIGURATION
// -------------------------------------------------------------

btnNewTracker.addEventListener('click', () => {
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  customCategoryGroup.classList.add('hidden');
  navigateTo(page2);
});

btnOldTracker.addEventListener('click', () => {
  const hasData = loadStateFromLocalStorage();
  if (hasData && appState.activeTracker && appState.activeTracker.name) {
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
    alert("Please enter a valid positive budget amount for this category.");
    return;
  }

  const newCat = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: categoryName,
    limit: amount,
    spent: 0
  };

  configuredCategories.push(newCat);

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

// -------------------------------------------------------------
// 4. DAY 4 LOGIC: BATTERY PROGRESS BARS & EXPENSE LOGGING
// -------------------------------------------------------------

// Add spending to chosen category dynamically
btnAddExpense.addEventListener('click', () => {
  const selectedCatId = expenseCategorySelect.value;
  const amount = parseFloat(expenseAmountInput.value);

  if (!selectedCatId) {
    alert("Please select a category.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid spending amount.");
    return;
  }

  // Find category in activeTracker state
  const category = appState.activeTracker.categories.find(c => c.id === selectedCatId);
  if (category) {
    category.spent += amount;
    saveStateToLocalStorage();
    renderDashboard();
    expenseAmountInput.value = '';
  }
});

// Render Post-It Note Widgets with Dynamic Battery Bars
function renderDashboard() {
  const tracker = appState.activeTracker;
  if (!tracker) return;

  dashTrackerName.textContent = tracker.name;
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  // Populate expense logging select options
  expenseCategorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
  tracker.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    expenseCategorySelect.appendChild(opt);
  });

  // Render Post-It Note cards
  postitContainer.innerHTML = '';

  tracker.categories.forEach(cat => {
    // 1. Calculate percentage fill
    const fillPercent = (cat.spent / cat.limit) * 100;
    const cappedWidth = Math.min(fillPercent, 100); // bar fill capped at 100% visual width

    // 2. Determine Color Threshold
    let colorClass = 'green';
    if (fillPercent >= 100) {
      colorClass = 'red';
    } else if (fillPercent >= 76) {
      colorClass = 'yellow';
    }

    // 3. Create Post-It UI Card
    const note = document.createElement('div');
    note.className = 'postit-note';

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
      </div>
    `;

    postitContainer.appendChild(note);
  });
}
