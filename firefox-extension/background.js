// Background script for O-Chat Firefox Extension

// Handle browser action click - open the chat app in a new tab
browser.browserAction.onClicked.addListener(function(tab) {
  // Open the chat app in a new tab
  browser.tabs.create({
    url: browser.extension.getURL('dist/index.html')
  });
});

// Optional: Handle installation
browser.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('O-Chat Extension installed');
    // Optionally open the app on first install
    browser.tabs.create({
      url: browser.extension.getURL('dist/index.html')
    });
  }
});
