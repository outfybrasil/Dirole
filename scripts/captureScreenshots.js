import { chromium, devices } from '@playwright/test';
import fs from 'fs';

async function capture() {
    if (!fs.existsSync('./screenshots/instagram')) {
        fs.mkdirSync('./screenshots/instagram', { recursive: true });
    }

    console.log('Iniciando o navegador para tirar os prints...');
    const browser = await chromium.launch({ headless: false }); // headless: false para facilitar debug visual
    const context = await browser.newContext({
        ...devices['iPhone 14 Pro Max'],
        deviceScaleFactor: 3,
        geolocation: { latitude: -23.550520, longitude: -46.633308 }, // Mock SP
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    page.on('console', msg => {
        // Logar apenas erros e o CRASH_REASON
        if (msg.type() === 'error' || msg.text().includes('CRASH')) {
            console.log('PAGE LOG:', msg.text().substring(0, 200));
        }
    });

    // PRÉ-CONFIGURAR localStorage pra pular o máximo de overlays possíveis
    await page.addInitScript(() => {
        window.localStorage.setItem('dirole_cookie_consent', 'true');
        window.localStorage.setItem('dirole_onboarding_seen', 'true'); // chave correta do código
        window.localStorage.setItem('dirole_onboarding_completed', 'true');
    });

    console.log('Abrindo app...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // ----- PASSO 1: LOGIN VISITANTE -----
    console.log('Clicando em Visitante...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Visitante') || b.textContent?.includes('olhadinha'));
        if (btn) btn.click();
    });
    await page.waitForTimeout(1500);

    // ----- PASSO 2: PREENCHER FORMULÁRIO DO VISITANTE -----
    await page.evaluate(() => {
        const input = document.querySelector('input[placeholder="Seu Apelido"]');
        if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, 'Rei do Camarote');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const terms = document.getElementById('guestTerms');
        if (terms) terms.click();
        setTimeout(() => {
            const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Entrar como Visitante'));
            if (enterBtn) enterBtn.click();
        }, 400);
    });
    await page.waitForTimeout(3000); // Aguardar login + splash sumir

    // ----- PASSO 3: ACEITAR COOKIE CONSENT (se aparecer) -----
    console.log('Aceitando cookies se necessário...');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const acceptBtn = btns.find(b => b.textContent?.includes('Aceitar') || b.textContent?.includes('ACEITAR'));
        if (acceptBtn) acceptBtn.click();
    });
    await page.waitForTimeout(500);

    // ----- PASSO 4: PULAR INTRODUÇÃO/ONBOARDING (se aparecer) -----
    console.log('Pulando introdução se necessário...');
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const skipBtn = btns.find(b => b.textContent?.includes('Pular') || b.textContent?.includes('PULAR') || b.textContent?.includes('Começar'));
        if (skipBtn) skipBtn.click();
    });
    await page.waitForTimeout(1500);

    // ----- PASSO 5: ABRIR FILTROS E MAXIMIZAR RAIO -----
    console.log('Abrindo filtros para maximizar raio...');
    await page.evaluate(() => {
        // Tentar abrir o painel de filtros clicando no ícone
        const filterBtn = document.querySelector('[class*="fa-sliders"]')?.closest('button')
            || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('[class*="sliders"]') || b.textContent?.includes('Filtro'));
        if (filterBtn) filterBtn.click();
    });
    await page.waitForTimeout(1000);

    // Setar o slider de distância para o máximo (5km)
    await page.evaluate(() => {
        const slider = document.querySelector('input[type="range"]');
        if (slider) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(slider, '5');
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    await page.waitForTimeout(500);

    // Fechar os filtros (clicar no mesmo botão de toggle)
    await page.evaluate(() => {
        const filterBtn = document.querySelector('.fa-sliders-h')?.closest('button');
        if (filterBtn) filterBtn.click();
    });
    await page.waitForTimeout(2000); // Aguardar fechar completamente

    // Zoom out 30% para mostrar mais lugares no mapa
    console.log('Aplicando zoom out 30%...');
    await page.evaluate(() => {
        document.body.style.zoom = '0.7';
    });
    await page.waitForTimeout(1000);

    // ----- SCREENSHOTS -----

    // 1. Mapa
    console.log('📸 Tela 1: Mapa Principal...');
    await page.screenshot({ path: './screenshots/instagram/1_Mapa Principal.png' });

    // Resetar o zoom para as demais telas
    await page.evaluate(() => {
        document.body.style.zoom = '1';
    });
    await page.waitForTimeout(500);

    // 2. Lista
    console.log('📸 Tela 2: Lista...');
    await page.evaluate(() => {
        const navBtns = document.querySelectorAll('.bottom-nav button');
        if (navBtns.length > 1) navBtns[1].click();
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './screenshots/instagram/2_Lista de Locais.png' });

    // 3. Ranking
    console.log('📸 Tela 3: Ranking...');
    await page.evaluate(() => {
        const navBtns = document.querySelectorAll('.bottom-nav button');
        if (navBtns.length > 2) navBtns[2].click();
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: './screenshots/instagram/3_Ranking de Usuarios.png' });

    // 4. Perfil - voltar ao mapa e abrir modal
    console.log('📸 Tela 4: Perfil...');
    await page.evaluate(() => {
        const navBtns = document.querySelectorAll('.bottom-nav button');
        if (navBtns.length > 0) navBtns[0].click();
    });
    await page.waitForTimeout(1000);
    // Abrir modal de perfil clicando no header - o botão do avatar é o primeiro div com onClick no header
    await page.evaluate(() => {
        // O header tem um w-12 h-12 div que ao clicar abre o ProfileModal
        // Selector: primeiro div com classe que contém 'rounded-full' e 'cursor-pointer' dentro do header
        const headerEl = document.querySelector('header');
        if (!headerEl) return;
        // Pegar todos os itens clicáveis do header e clicar no primeiro (avatar)
        const clickables = headerEl.querySelectorAll('[class*="cursor-pointer"], [class*="active:scale"]');
        if (clickables.length > 0) clickables[0].click();
    });
    await page.waitForTimeout(3000); // Aguardar modal abrir completamente
    await page.screenshot({ path: './screenshots/instagram/4_Modal_Perfil.png' });

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    // 5. Filtros
    console.log('📸 Tela 5: Filtros...');
    await page.evaluate(() => {
        const filterBtn = document.querySelector('[class*="fa-sliders"]')?.closest('button')
            || Array.from(document.querySelectorAll('button')).find(b => b.querySelector('[class*="sliders"]'));
        if (filterBtn) filterBtn.click();
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: './screenshots/instagram/5_Gaveta_Filtros.png' });

    console.log('✅ Todos os screenshots salvos em ./screenshots/instagram/');
    await browser.close();
}

capture().catch(err => {
    console.error('Erro ao tirar prints:', err);
    process.exit(1);
});
