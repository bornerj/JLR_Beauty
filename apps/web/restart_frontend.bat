@echo off
cd /d C:\laragon\www\JLR_AI_Studio\apps\web
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do (
  taskkill /PID %%a /F
)
if not exist .env (
  echo Arquivo .env nao encontrado. Copie .env.example para .env.
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias...
  npm install
)
npm run dev
