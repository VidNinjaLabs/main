@echo off
REM Load .env and run pnpm install

echo Loading environment variables from .env...

REM Read NPM_TOKEN from .env
for /f "tokens=1,2 delims==" %%a in ('findstr /R "^NPM_TOKEN=" .env') do (
    set NPM_TOKEN=%%b
    REM Remove quotes
    set NPM_TOKEN=!NPM_TOKEN:"=!
)

if "%NPM_TOKEN%"=="" (
    echo ERROR: NPM_TOKEN not found in .env file
    exit /b 1
)

echo Running pnpm install...
pnpm install

echo Done!
