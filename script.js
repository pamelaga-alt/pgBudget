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

// Function to save current state to localStorage
function saveStateToLocalStorage() {
  appState.settings.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  console.log("State saved to localStorage:", appState);
}

// Function to load state from localStorage
function loadStateFromLocalStorage() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      appState = JSON.parse(savedData);
      console.log("Loaded existing state from localStorage:", appState);
      return true;
    } catch (err) {
      console.error("Error parsing stored state:", err);
    }
  }
  return false;
}

// Initialize application state on startup
loadStateFromLocalStorage();

// -------------------------------------------------------------
// 2. DOM ELEMENTS & NAVIGATION LOGIC
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
const dashCategoriesList = document.getElementById('dash-categories-list');

// Array to temporarily hold category allocations during setup
let configuredCategories = [];

// Screen Switcher Helper Function
function navigateTo(targetPage) {
  [page1, page2, pageDashboard].forEach(page => page.classList.add('hidden'));
  targetPage.classList.remove('hidden');
}

// -------------------------------------------------------------
// 3. EVENT LISTENERS & SCREEN TOGGLING
// -------------------------------------------------------------

// Page 1 -> Page 2 (New Tracker)
btnNewTracker.addEventListener('click', () => {
  configuredCategories = [];
  activeCategoriesList.innerHTML = '';
  setupForm.reset();
  customCategoryGroup.classList.add('hidden');
  navigateTo(page2);
});

// Page 1 -> Dashboard (Existing Tracker)
btnOldTracker.addEventListener('click', () => {
  const hasData = loadStateFromLocalStorage();
  if (hasData && appState.activeTracker && appState.activeTracker.name) {
    renderDashboard();
    navigateTo(pageDashboard);
  } else {
    alert("No saved tracker found! Please create a new tracker first.");
  }
});

// Back to Start Button
btnBackHome.addEventListener('click', () => {
  navigateTo(page1);
});

// Category Select Logic ("Other")
categorySelect.addEventListener('change', (e) => {
  if (e.target.value === 'Other') {
    customCategoryGroup.classList.remove('hidden');
  } else {
    customCategoryGroup.classList.add('hidden');
    customCategoryNameInput.value = '';
  }
});

// Add Category Limit to List
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

  // Create category object with spending defaults
  const newCat = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: categoryName,
    limit: amount,
    spent: 0
  };

  configuredCategories.push(newCat);

  // Update UI List
  const listItem = document.createElement('li');
  listItem.textContent = `${categoryName}: $${amount.toFixed(2)}`;
  activeCategoriesList.appendChild(listItem);

  // Reset category inputs
  categorySelect.value = '';
  customCategoryNameInput.value = '';
  categoryAmountInput.value = '';
  customCategoryGroup.classList.add('hidden');
});

// Submit Form: Save Metadata to State + localStorage -> Navigate to Dashboard
setupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const trackerName = document.getElementById('tracker-name').value;
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const totalEarnings = parseFloat(document.getElementById('total-earnings').value) || 0;

  // Build current active tracker state object
  appState.activeTracker = {
    id: `tracker_${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: trackerName,
    totalBudget: totalBudget,
    totalEarnings: totalEarnings,
    categories: [...configuredCategories]
  };

  // Push into history array if not present
  appState.savedTrackers.push(appState.activeTracker);

  // Persist state to localStorage
  saveStateToLocalStorage();

  // Render & Navigate to Dashboard
  renderDashboard();
  navigateTo(pageDashboard);
});

// Helper to update dashboard UI from current appState
function renderDashboard() {
  const tracker = appState.activeTracker;
  if (!tracker) return;

  dashTrackerName.textContent = tracker.name;
  dashTotalBudget.textContent = tracker.totalBudget.toFixed(2);
  dashEarnings.textContent = tracker.totalEarnings.toFixed(2);

  dashCategoriesList.innerHTML = '';
  tracker.categories.forEach(cat => {
    const div = document.createElement('div');
    div.style.margin = "8px 0";
    div.textContent = `${cat.name}: Spent $${cat.spent.toFixed(2)} / Limit $${cat.limit.toFixed(2)}`;
    dashCategoriesList.appendChild(div);
  });
}
