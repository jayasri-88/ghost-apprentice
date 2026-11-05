@echo off
rem Double-click launcher: finds Git Bash and runs start.sh in a terminal window.
setlocal
set "SCRIPT=%~dp0start.sh"

set "BASH="
if exist "C:\Program Files\Git\bin\bash.exe" set "BASH=C:\Program Files\Git\bin\bash.exe"
if not defined BASH if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH (where bash >nul 2>nul && for /f "delims=" %%i in ('where bash') do if not defined BASH set "BASH=%%i")

if not defined BASH (
  echo Git Bash was not found. Install it from https://git-scm.com
  echo or run start.sh from any bash shell.
  pause
  exit /b 1
)

start "Ghost Apprentice" "%BASH%" -l "%SCRIPT%"
endlocal
