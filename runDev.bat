@echo off
set "SCRIPT_DIR=%~dp0"

REM Start the Flask server
start "" powershell.exe -NoExit -Command "Set-Location -LiteralPath '%SCRIPT_DIR%/back-end'; python app.py"

REM Start the React dev server
start "" powershell.exe -NoExit -Command "Set-Location -LiteralPath '%SCRIPT_DIR%/front-end'; npm run dev -- --host 0.0.0.0"

REM Start DB utility
REM start "" powershell.exe -NoExit -Command "Set-Location -LiteralPath '%SCRIPT_DIR%'; python dbUtility.py"