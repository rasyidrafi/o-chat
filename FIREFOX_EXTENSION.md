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

   Or for a clean build:
   ```bash
   npm run build:extension:clean
   ```

   This will create the extension files in the `extension/` directory.

4. **Validate the extension** (optional):
   ```bash
   npm run validate:extension
   ```

### Installing in Firefox

1. **Open Firefox** and navigate to `about:debugging`

2. **Click "This Firefox"** in the left sidebar

3. **Click "Load Temporary Add-on..."**

4. **Navigate to the `extension/` folder** in your project and select the `manifest.json` file

5. **The extension will be loaded** and you'll see the O-Chat icon in your toolbar

### Using the Extension

1. **Click the O-Chat icon** in your Firefox toolbar
2. **The chat interface will open** in a popup window (400x600 pixels)
3. **Use the chat application** as you would in the web version
4. **Settings and conversations persist** between sessions using Firefox's extension storage

### Features

- **Full O-Chat functionality** in a browser extension popup
- **Firebase authentication** and data sync
- **Extension storage** that persists between browser sessions
- **Automatic theme detection** and font preferences
- **Optimized popup layout** with appropriate sizing (400x600px)
- **All chat features** including AI conversations, markdown rendering, and syntax highlighting

### Configuration

The extension uses the same Firebase configuration as the web version. If you need to configure Firebase:

1. Copy `.env.example` to `.env`
2. Add your Firebase configuration values
3. Rebuild the extension with `npm run build:extension`

### Development

To develop the extension:

1. **Make changes** to the source code
2. **Rebuild** with `npm run build:extension`
3. **Reload the extension** in Firefox:
   - Go to `about:debugging`
   - Find your extension
   - Click "Reload"

### Architecture

The extension consists of:

- **ExtensionApp.tsx** - Extension-specific React app with storage compatibility
- **extensionStorage.ts** - Storage utility that works with both localStorage and extension storage
- **extension-popup.html** - Extension popup HTML template
- **manifest.json** - Firefox extension manifest (Manifest V2)
- **background.js** - Background script for extension lifecycle

### Permissions

The extension requests these permissions:
- `storage` - For local data persistence
- `https://firebaseapp.com/*` - Firebase authentication and database
- `https://*.googleapis.com/*` - Google APIs and Firebase
- `https://api.openai.com/*` - OpenAI API for chat functionality
- `https://fonts.googleapis.com/*` - Google Fonts
- `https://fonts.gstatic.com/*` - Google Fonts static content

### Build Scripts

- `npm run build:extension` - Build the extension
- `npm run build:extension:clean` - Clean build (removes old files first)
- `npm run validate:extension` - Validate the built extension

### Troubleshooting

**Extension won't load:**
- Make sure you're selecting the `manifest.json` file from the `extension/` directory
- Check that the build completed successfully
- Ensure all required files are present (run `npm run validate:extension`)

**Chat doesn't work:**
- Ensure Firebase configuration is correct in `.env`
- Check browser console for any errors (F12 → Console)
- Verify internet connection

**Styling issues:**
- The extension is optimized for a 400x600 popup
- Some responsive features may be limited in the popup context
- Theme switching works the same as the web version

**Storage issues:**
- Extension uses Firefox's `browser.storage.local` API
- Settings sync between popup sessions
- If switching between web and extension, settings may need to be reconfigured

### Security

The extension follows Firefox's security guidelines:
- Content Security Policy is configured for safe operation
- Only necessary permissions are requested
- No eval() or unsafe inline scripts (except for safe theme initialization)
- All external resources are explicitly allowed in CSP

### File Structure

```
extension/
├── manifest.json          # Extension manifest (DO NOT EDIT - regenerated)
├── popup.html            # Extension popup HTML (DO NOT EDIT - regenerated)  
├── popup.js              # Main application bundle (DO NOT EDIT - regenerated)
├── popup-*.js            # Additional chunks (DO NOT EDIT - regenerated)
├── background.js         # Background script
├── icons/               # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── favicon.png          # Extension favicon (DO NOT EDIT - regenerated)
```

**Note:** Files marked as "DO NOT EDIT" are regenerated during the build process.

### Extension vs Web App Differences

| Feature | Web App | Extension |
|---------|---------|-----------|
| Storage | localStorage | browser.storage.local |
| Size | Full viewport | 400x600 popup |
| Installation | Web hosting | Manual installation |
| Updates | Automatic | Manual rebuild required |
| Persistence | Browser-dependent | Extension storage |

### Known Limitations

1. **Popup size is fixed** at 400x600 pixels
2. **Manual updates** required when code changes
3. **Development reload** needed after each build
4. **Some responsive features** may not work optimally in popup context
5. **Temporary installation** in Firefox (resets on browser restart for development)

### Production Deployment

For production deployment:
1. Build the extension: `npm run build:extension`
2. Test thoroughly: `npm run validate:extension`
3. Package as ZIP file for distribution
4. Submit to Firefox Add-ons store (optional)

The extension can be distributed as a ZIP file containing the `extension/` directory contents.