# O-Chat Firefox Extension

This Firefox extension packages the O-Chat React application as a browser extension.

## Installation

### For Development/Testing

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `firefox-extension` folder and select the `manifest.json` file
5. The extension will be loaded and you'll see the O-Chat icon in your toolbar

### For Distribution

1. Package the extension by creating a ZIP file of all contents in the `firefox-extension` folder
2. Submit to Firefox Add-ons store or distribute the XPI file

## Features

- Full O-Chat functionality in a Firefox extension
- Supports all AI providers (OpenAI, Anthropic, Custom APIs)
- Local storage for conversations when not logged in
- Firebase integration for cloud storage when logged in
- Dark/light theme support
- Font customization

## Usage

1. Click the O-Chat icon in your Firefox toolbar
2. The app will open in a new tab
3. Configure your API keys in settings if needed
4. Start chatting with AI models

## Build Process

The extension uses the built `dist/` folder from the main React Vite application. To update the extension:

1. Build the main app: `npm run build`
2. Copy the updated `dist/` folder to `firefox-extension/dist/`
3. Reload the extension in Firefox

## Files Structure

```
firefox-extension/
├── manifest.json          # Firefox extension manifest
├── background.js          # Background script for handling extension actions
├── dist/                  # Built React app
│   ├── index.html        # Main app HTML (with relative paths)
│   ├── favicon.png       # App icon
│   └── assets/           # All JS/CSS assets
└── README.md             # This file
```

## Permissions

The extension requests the following permissions:
- `storage` - For local extension storage
- `activeTab` - For accessing the current tab
- API endpoints for AI providers (OpenAI, Anthropic, etc.)
- Google Fonts for typography

## Development Notes

- The extension uses Manifest V2 for broader Firefox compatibility
- All paths in index.html are converted to relative paths for extension context
- The PWA manifest.json is removed to avoid conflicts with the extension manifest
- Background script handles opening the app in a new tab when the toolbar icon is clicked
