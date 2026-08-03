// Test connection to verify JS is running correctly
console.log("Budget Tracker initialized!");

// 1. Grab all HTML elements by their unique IDs (declared only ONCE)
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');

// 2. Event listener for "New Tracker" button (Navigates to Page 2)
if (btnNewTracker) {
  btnNewTracker.addEventListener('click', () => {
    // Hide Page 1
    page1.classList.add('hidden');
    
    // Show Page 2
    page2.classList.remove('hidden');
    
    console.log("Navigated to Page 2!");
  });
}

// 3. Event listener for "Continue Existing Tracker" button
if (btnOldTracker) {
  btnOldTracker.addEventListener('click', () => {
    console.log("User wants to continue an existing tracker");
    // We will add the localStorage loading logic here later!
  });
}
