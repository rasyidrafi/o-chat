// Background script for O-Chat Firefox Extension
// This handles extension lifecycle and storage management

// Handle extension installation/startup
browser.runtime.onInstalled.addListener(() => {
  console.log('O-Chat extension installed');
});

// Handle storage changes if needed
browser.storage.onChanged.addListener((changes, namespace) => {
  // Handle storage changes for settings sync if needed
  console.log('Storage changed:', changes);
});