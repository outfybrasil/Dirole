# Script para Executar Dirole no Emulador com Live Reload
# Uso: .\run-android-dev.ps1

Write-Host "🔥 Iniciando Dirole no Emulador com Live Reload..." -ForegroundColor Green

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

# Sincronizar com Android
Write-Host "`n🔄 Sincronizando com Android..." -ForegroundColor Yellow
npx cap sync android

Write-Host "✓ Sincronização concluída!" -ForegroundColor Green

# Executar com live reload
Write-Host "`n🔥 Executando app com LIVE RELOAD..." -ForegroundColor Yellow
Write-Host "💡 Edite o código e veja as mudanças em tempo real!" -ForegroundColor Cyan
npx cap run android -l --external

Write-Host "`n✅ Dirole está rodando com Live Reload!" -ForegroundColor Green
