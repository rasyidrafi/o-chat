#!/bin/bash

# Firefox Extension Validation Script

echo "🔍 Validating Firefox Extension..."

# Check if extension directory exists
if [ ! -d "extension" ]; then
    echo "❌ Extension directory not found"
    exit 1
fi

echo "✅ Extension directory found"

# Check required files
required_files=("manifest.json" "popup.html" "popup.js" "background.js")

for file in "${required_files[@]}"; do
    if [ -f "extension/$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Validate manifest.json
if cat extension/manifest.json | python3 -m json.tool > /dev/null 2>&1; then
    echo "✅ manifest.json is valid JSON"
else
    echo "❌ manifest.json is invalid JSON"
    exit 1
fi

# Check manifest version
manifest_version=$(cat extension/manifest.json | python3 -c "import sys, json; print(json.load(sys.stdin)['manifest_version'])")
if [ "$manifest_version" = "2" ]; then
    echo "✅ Using Manifest V2 (compatible with Firefox)"
else
    echo "⚠️  Using Manifest V$manifest_version (may need adjustment for Firefox)"
fi

# Check icon files
icon_sizes=("16" "32" "48" "128")
for size in "${icon_sizes[@]}"; do
    if [ -f "extension/icons/icon-$size.png" ]; then
        echo "✅ Icon $size×$size found"
    else
        echo "❌ Icon $size×$size missing"
    fi
done

# Check popup.html references
if grep -q "popup\.js" extension/popup.html; then
    echo "✅ popup.html references popup.js"
else
    echo "❌ popup.html doesn't reference popup.js"
    exit 1
fi

# Check file sizes
popup_size=$(stat -c%s extension/popup.js 2>/dev/null || stat -f%z extension/popup.js 2>/dev/null)
if [ "$popup_size" -gt 100000 ]; then
    echo "✅ popup.js has content ($popup_size bytes)"
else
    echo "❌ popup.js seems too small ($popup_size bytes)"
    exit 1
fi

echo ""
echo "🎉 Extension validation completed successfully!"
echo ""
echo "📦 Extension ready for installation in Firefox"
echo ""
echo "Installation instructions:"
echo "1. Open Firefox and go to about:debugging"
echo "2. Click 'This Firefox'"
echo "3. Click 'Load Temporary Add-on...'"
echo "4. Select the manifest.json file from the extension/ directory"
echo ""
echo "Extension size: $(du -sh extension | cut -f1)"