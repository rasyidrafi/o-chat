@echo off
echo Building O-Chat Firefox Extension...

echo.
echo Step 1: Building the main React app...
cd ..
call npm run build

echo.
echo Step 2: Copying dist folder to extension...
if exist "firefox-extension\dist" (
    rmdir /S /Q "firefox-extension\dist"
)
xcopy /E /I /Y dist firefox-extension\dist

echo.
echo Step 3: Fixing paths in index.html for extension context...
cd firefox-extension\dist

powershell -Command "(Get-Content index.html) -replace 'href=\"/favicon\.png\"', 'href=\"./favicon.png\"' | Set-Content index.html"
powershell -Command "(Get-Content index.html) -replace 'src=\"/assets/', 'src=\"./assets/' | Set-Content index.html"
powershell -Command "(Get-Content index.html) -replace 'href=\"/assets/', 'href=\"./assets/' | Set-Content index.html"

echo.
echo Step 4: Removing PWA manifest to avoid conflicts...
if exist "manifest.json" del manifest.json

echo.
echo Step 5: Extension build complete!
echo.
echo To install in Firefox:
echo 1. Open about:debugging in Firefox
echo 2. Click "This Firefox"
echo 3. Click "Load Temporary Add-on"
echo 4. Select the manifest.json file in the firefox-extension folder
echo.
pause
