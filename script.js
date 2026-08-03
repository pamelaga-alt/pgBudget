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
// 1. Grab the HTML elements by their IDs
const page1 = document.getElementById('page-1');
const page2 = document.getElementById('page-2');
const btnNewTracker = document.getElementById('btn-new-tracker');

// 2. Add an event listener to the "Start New Tracker" button
btnNewTracker.addEventListener('click', () => {
  // Hide Page 1 by adding the 'hidden' class
  page1.classList.add('hidden');
  
  // Show Page 2 by removing the 'hidden' class
  page2.classList.remove('hidden');
  
  console.log("Navigated to Page 2!");
});
