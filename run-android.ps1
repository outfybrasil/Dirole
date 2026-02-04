# Script para Executar Dirole no Emulador Android
# Uso: .\run-android.ps1

Write-Host "🚀 Iniciando Dirole no Emulador Android..." -ForegroundColor Green

# Configurar variáveis de ambiente
$env:ANDROID_HOME = "C:\Users\Teste\AppData\Local\Android\Sdk"
$env:Path += ";C:\Users\Teste\AppData\Local\Android\Sdk\platform-tools;C:\Users\Teste\AppData\Local\Android\Sdk\emulator;C:\Users\Teste\AppData\Local\Android\Sdk\tools;C:\Users\Teste\AppData\Local\Android\Sdk\tools\bin"

Write-Host "✓ Variáveis de ambiente configuradas" -ForegroundColor Cyan

# Verificar se o emulador está rodando
Write-Host "`n📱 Verificando emuladores..." -ForegroundColor Yellow
$devices = adb devices
if ($devices -match "emulator-") {
    Write-Host "✓ Emulador já está rodando!" -ForegroundColor Green
} else {
    Write-Host "⚠ Nenhum emulador detectado. Iniciando Pixel_9..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Users\Teste\AppData\Local\Android\Sdk\emulator\emulator.exe" -ArgumentList "-avd", "Pixel_9"
    
    Write-Host "⏳ Aguardando emulador inicializar (30 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Build da aplicação
Write-Host "`n🔨 Fazendo build da aplicação..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build concluído!" -ForegroundColor Green

# Sincronizar com Android
Write-Host "`n🔄 Sincronizando com Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na sincronização!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Sincronização concluída!" -ForegroundColor Green

# Executar no emulador
Write-Host "`n🚀 Executando app no emulador..." -ForegroundColor Yellow
npx cap run android

Write-Host "`n✅ Dirole está rodando no emulador!" -ForegroundColor Green
Write-Host "💡 Dica: Use Ctrl+C para parar o servidor" -ForegroundColor Cyan
