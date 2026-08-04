// Test connection to verify JS is running correctly
console.log("Budget Tracker initialized!");

// 1. Grab HTML elements
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');

// Page 2 Form Elements
const setupForm = document.getElementById('setup-form');
const categorySelect = document.getElementById('category-select');
const customCategoryGroup = document.getElementById('custom-category-group');
const customCategoryNameInput = document.getElementById('custom-category-name');
const categoryAmountInput = document.getElementById('category-amount');
const btnAddCategory = document.getElementById('btn-add-category');
const activeCategoriesList = document.getElementById('active-categories');

// Array to temporarily hold category allocations
let configuredCategories = [];

// 2. Navigation: Page 1 -> Page 2
if (btnNewTracker) {
  btnNewTracker.addEventListener('click', () => {
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    console.log("Navigated to Page 2!");
  });
}

// Continue button logic placeholder
if (btnOldTracker) {
  btnOldTracker.addEventListener('click', () => {
    console.log("User wants to continue an existing tracker");
  });
}

// 3. Dynamic Logic: Show/Hide Custom Input on "Other" selection
categorySelect.addEventListener('change', (e) => {
  if (e.target.value === 'Other') {
    customCategoryGroup.classList.remove('hidden');
  } else {
    customCategoryGroup.classList.add('hidden');
    customCategoryNameInput.value = ''; // clear previous custom text
  }
});

// 4. Add Category Limit to List
btnAddCategory.addEventListener('click', () => {
  let categoryName = categorySelect.value;
  const amount = parseFloat(categoryAmountInput.value);

  // If "Other" was picked, read custom category name
  if (categoryName === 'Other') {
    categoryName = customCategoryNameInput.value.trim();
  }

  // Validation
  if (!categoryName) {
    alert("Please select or enter a category name.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive budget amount for this category.");
    return;
  }

  // Add category to array
  configuredCategories.push({ category: categoryName, limit: amount });

  // Update UI List
  const listItem = document.createElement('li');
  listItem.textContent = `${categoryName}: $${amount.toFixed(2)}`;
  activeCategoriesList.appendChild(listItem);

  // Reset category inputs for next entry
  categorySelect.value = '';
  customCategoryNameInput.value = '';
  categoryAmountInput.value = '';
  customCategoryGroup.classList.add('hidden');
});

// 5. Submit Setup Form (Proceed to Dashboard)
setupForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const trackerName = document.getElementById('tracker-name').value;
  const totalBudget = parseFloat(document.getElementById('total-budget').value);
  const totalEarnings = parseFloat(document.getElementById('total-earnings').value) || 0;

  const trackerData = {
    name: trackerName,
    totalBudget: totalBudget,
    totalEarnings: totalEarnings,
    categories: configuredCategories
  };

  console.log("Tracker setup saved!", trackerData);
  alert("Budget setup complete!");

  // Day 3 will use `trackerData` to render the dashboard charts/batteries!
});
