@echo off
title Vibe Clinic Dashboard Launcher
echo ──────────────────────────────────────────────
echo  Vibe Clinic 대시보드를 기동합니다 (.env 적용)
echo ──────────────────────────────────────────────
cd /d "%~dp0"
node --env-file=.env bin/vibe-clinic.js dashboard --cwd examples/calculator --port 7700
pause
