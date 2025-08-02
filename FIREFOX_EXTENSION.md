# O-Chat Firefox Extension

This is a Firefox browser extension that runs the O-Chat React application locally in your browser as a popup extension.

## Installation

### Prerequisites
- Node.js (for building the extension)
- Firefox browser

### Building the Extension

1. **Clone the repository** (if not already cloned):
   ```bash
   git clone <repository-url>
   cd o-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build:extension
   ```

   This will create the extension files in the `extension/` directory.

### Installing in Firefox

1. **Open Firefox** and navigate to `about:debugging`

2. **Click "This Firefox"** in the left sidebar

3. **Click "Load Temporary Add-on..."**

4. **Navigate to the `extension/` folder** in your project and select the `manifest.json` file

5. **The extension will be loaded** and you'll see the O-Chat icon in your toolbar

### Using the Extension

1. **Click the O-Chat icon** in your Firefox toolbar
2. **The chat interface will open** in a popup window
3. **Use the chat application** as you would in the web version

### Features

- **Full O-Chat functionality** in a browser extension popup
- **Firebase authentication** and data sync
- **Local storage** that persists between sessions
- **Optimized for extension popup** with appropriate sizing
- **All chat features** including AI conversations

### Configuration

The extension uses the same Firebase configuration as the web version. If you need to configure Firebase:

1. Copy `.env.example` to `.env`
2. Add your Firebase configuration values
3. Rebuild the extension with `npm run build:extension`

### Development

To develop the extension:

1. **Make changes** to the source code
2. **Rebuild** with `npm run build:extension`
3. **Reload the extension** in Firefox (go to `about:debugging`, find your extension, and click "Reload")

### Permissions

The extension requests these permissions:
- `storage` - For local data persistence
- Network access to Firebase, Google APIs, and OpenAI - For chat functionality
- Access to Google Fonts - For typography

### Troubleshooting

**Extension won't load:**
- Make sure you're selecting the `manifest.json` file from the `extension/` directory
- Check that the build completed successfully

**Chat doesn't work:**
- Ensure Firebase configuration is correct
- Check browser console for any errors
- Verify internet connection

**Styling issues:**
- The extension is optimized for a 400x600 popup
- Some responsive features may be limited in the popup context

### Security

The extension follows Firefox's security guidelines:
- Content Security Policy is configured for safe operation
- Only necessary permissions are requested
- No eval() or unsafe inline scripts (except for safe theme initialization)

### File Structure

```
extension/
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup HTML
├── popup.js              # Main application bundle
├── background.js         # Background script
├── icons/               # Extension icons
└── popup-*.js           # Additional chunks (if any)
```