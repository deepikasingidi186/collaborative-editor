@echo off
echo Creating document...

for /f "tokens=2 delims=:," %%a in ('curl -s -X POST http://localhost:8080/api/documents -H "Content-Type: application/json" -d "{\"title\":\"OT Test\",\"content\":\"abc\"}" ^| findstr /i "id"') do (
    set DOC_ID=%%a
)

set DOC_ID=%DOC_ID:"=%

echo Document ID: %DOC_ID%

timeout /t 2 > nul

echo Starting Client A...
start cmd /k websocat ws://localhost:8080

echo Starting Client B...
start cmd /k websocat ws://localhost:8080

timeout /t 5 > nul

echo Fetching final document...
curl http://localhost:8080/api/documents/%DOC_ID%

pause