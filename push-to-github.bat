@echo off
set PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\ucrt64\bin;C:\Users\akulthota\.local\mingit\cmd;%PATH%
echo ========================================================
echo   PantryPal - Pushing latest changes to GitHub (main)
echo ========================================================
echo.
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Successfully pushed all changes to GitHub main branch!
) else (
    echo.
    echo [ERROR] Push failed. If prompted, please authenticate with GitHub in your browser.
)
echo.
pause
