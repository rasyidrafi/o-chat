@echo off
echo Packaging O-Chat Firefox Extension...

echo.
echo First building the extension...
call build-extension.bat

echo.
echo Creating package...
if exist "o-chat-firefox-extension.zip" del "o-chat-firefox-extension.zip"

powershell -Command "Compress-Archive -Path manifest.json, background.js, dist, README.md -DestinationPath o-chat-firefox-extension.zip"

echo.
echo Package created: o-chat-firefox-extension.zip
echo This file can be distributed or submitted to Firefox Add-ons store
echo.
pause
