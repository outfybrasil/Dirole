import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function captureSlides() {
    const outDir = './screenshots/instagram/mockups';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ deviceScaleFactor: 2 }); // 2x = alta resolução
    const page = await context.newPage();

    const htmlPath = path.resolve('./scripts/mockupSlides.html');
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });

    // Aguardar fontes e imagens
    await page.waitForTimeout(3000);

    const slides = [
        { id: 'slide-capa', name: '1_Capa.png' },
        { id: 'slide-mapa', name: '2_Mapa_Mockup.png' },
        { id: 'slide-lista', name: '3_Lista_Mockup.png' },
        { id: 'slide-ranking', name: '4_Ranking_Mockup.png' },
        { id: 'slide-perfil', name: '5_Perfil_Mockup.png' },
        { id: 'slide-filtros', name: '6_Filtros_Mockup.png' },
        { id: 'slide-cta', name: '7_CTA.png' },
    ];

    for (const slide of slides) {
        console.log(`📸 Capturando ${slide.name}...`);
        const el = page.locator(`#${slide.id}`);
        await el.screenshot({
            path: `${outDir}/${slide.name}`,
            type: 'png',
        });
    }

    await browser.close();
    console.log('✅ Todos os slides salvos em ./screenshots/instagram/mockups/');
}

captureSlides().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
