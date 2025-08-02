// Service Worker for O-Chat Firefox Extension (Manifest V3)

// Handle action click - open the chat app in a new tab
chrome.action.onClicked.addListener(function(tab) {
  // Open the chat app in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('dist/index.html')
  });
});

// Handle installation
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('O-Chat Extension installed');
    // Optionally open the app on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('dist/index.html')
    });
  }
});
