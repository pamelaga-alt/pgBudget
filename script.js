// Test connection to verify JS is running correctly
console.log("Budget Tracker initialized!");

// Buttons from Page 1
const btnNewTracker = document.getElementById('btn-new-tracker');
const btnOldTracker = document.getElementById('btn-old-tracker');

// Add Event Listeners
btnNewTracker.addEventListener('click', () => {
  console.log("User wants to start a new tracker");
  // Logic for Page 2 navigation will go here
});

btnOldTracker.addEventListener('click', () => {
  console.log("User wants to continue an existing tracker");
  // Logic to load saved localStorage tracker will go here
});
