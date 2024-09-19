@echo off
title Run Emoji Hunt
:: Program to hide and make Windows taskbar inaccessible
start C:\Users\vitensenter_demo\Downloads\buttery-taskbar.exe
:: Change directory to the AI computer vision folder
cd C:\Users\vitensenter_demo\AI-computer-vision
:: Start Python HTTP server
start cmd /k python -m http.server
:: Wait for the server to start
timeout /t 5
:: Open Microsoft Edge and navigate to localhost:8000
start msedge http://localhost:8000
:: Wait for Edge to open
timeout /t 5
:: Create a VBScript to send F11 key to go fullscreen
echo Set WshShell = WScript.CreateObject("WScript.Shell") > "%temp%\fullscreen.vbs"
echo WshShell.SendKeys "{F11}" >> "%temp%\fullscreen.vbs"
echo WScript.Quit >> "%temp%\fullscreen.vbs"
:: Run the VBScript
start /wait wscript "%temp%\fullscreen.vbs"
:: Clean up the VBScript
del "%temp%\fullscreen.vbs"