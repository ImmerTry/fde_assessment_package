# Playwright E2E 全自动化测试脚本
# 用法: pwsh e2e/run.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Playwright E2E 全自动化测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 杀掉旧服务
Write-Host "[1/4] 清理旧 dev server..." -ForegroundColor Yellow
$existing = netstat -ano 2>$null | Select-String ":3000" | Select-String "LISTENING"
if ($existing) {
  $pid_match = [regex]::Match($existing, '\s+(\d+)\s*$')
  if ($pid_match.Success) {
    $oldPid = $pid_match.Groups[1].Value
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Write-Host "  已终止 PID $oldPid" -ForegroundColor Green
  }
}

# 2. 重置数据库
Write-Host "[2/4] 重置数据库..." -ForegroundColor Yellow
npx tsx prisma/prepare-db.ts 2>&1 | Out-Null
npx prisma db push --force-reset --skip-generate 2>&1 | Out-Null
npx prisma db seed 2>&1 | Out-Null
Write-Host "  数据库已重置" -ForegroundColor Green

# 3. 运行测试
Write-Host "[3/4] 运行 Playwright 测试..." -ForegroundColor Yellow
$testResult = npx playwright test --reporter=html --reporter=list 2>&1
$exitCode = $LASTEXITCODE
Write-Host $testResult

# 4. 输出结果
Write-Host "[4/4] 测试完成" -ForegroundColor Yellow
if ($exitCode -eq 0) {
  Write-Host "`n  全部通过!  HTML 报告: playwright-report/index.html" -ForegroundColor Green
} else {
  Write-Host "`n  存在失败用例，详见上方输出。" -ForegroundColor Red
  Write-Host "  HTML 报告: playwright-report/index.html" -ForegroundColor Yellow
}

Pop-Location
exit $exitCode
