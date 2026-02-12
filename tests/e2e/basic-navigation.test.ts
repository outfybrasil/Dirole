import { test, expect } from '@playwright/test';

const MOCK_USER = {
    id: 'test-user-123',
    name: 'Playwright Tester',
    nickname: 'TestBot',
    email: 'test@dirole.app',
    points: 100,
    xp: 150,
    level: 2,
    avatar: 'https://i.pravatar.cc/150?u=testbot',
    badges: [],
    favorites: []
};

test.beforeEach(async ({ page, context }) => {
    // Mock Geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -25.4284, longitude: -49.2733 });

    // MOCK APPWRITE API
    await page.route('**/account', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                $id: MOCK_USER.id,
                email: MOCK_USER.email,
                name: MOCK_USER.name,
                emailVerification: true,
            }),
        });
    });

    await page.route('**/databases/*/collections/profiles/documents*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                total: 1,
                documents: [{
                    $id: 'doc-123',
                    userId: MOCK_USER.id,
                    name: MOCK_USER.name,
                    nickname: MOCK_USER.nickname,
                    avatar: MOCK_USER.avatar,
                    points: MOCK_USER.points,
                    xp: MOCK_USER.xp,
                    level: MOCK_USER.level,
                }]
            }),
        });
    });

    // Inject Mock Session into LocalStorage
    await page.addInitScript((user) => {
        window.localStorage.setItem('dirole_user_profile', JSON.stringify(user));
        window.localStorage.setItem('dirole_onboarding_seen', 'true');
    }, MOCK_USER);

    // Go to the landing page
    await page.goto('/');

    // Wait for the splash screen to disappear and map to load
    await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 20000 });
});

test.describe('Authenticated User Flow', () => {
    test('should load the app and show the map correctly', async ({ page }) => {
        console.log('Testing Map Visibility...');
        await expect(page.locator('.leaflet-container')).toBeVisible();
        await expect(page.locator(`text=${MOCK_USER.nickname}`)).toBeVisible();
        console.log('Map and Nickname visible.');
    });

    test('should navigate between tabs', async ({ page }) => {
        // Switch to List
        console.log('Navigating to LISTA...');
        const listBtn = page.locator('nav button').filter({ hasText: 'LISTA' });
        await listBtn.click({ force: true });
        await page.waitForTimeout(1000); // Wait for transition

        await expect(page.locator('input[placeholder*="Buscando"]')).toBeVisible();
        console.log('LISTA visible.');

        // Switch to Rank
        console.log('Navigating to RANK...');
        const rankBtn = page.locator('nav button').filter({ hasText: 'RANK' });
        await rankBtn.click({ force: true });
        await page.waitForTimeout(1000);

        await expect(page.locator('text=RANKING')).toBeVisible();
        console.log('RANK visible.');

        // Switch to Map
        console.log('Navigating back to MAPA...');
        const mapBtn = page.locator('nav button').filter({ hasText: 'MAPA' });
        await mapBtn.click({ force: true });
        await page.waitForTimeout(1000);
        await expect(page.locator('.leaflet-container')).toBeVisible();
        console.log('Returned to MAPA.');
    });
});

test.describe('Search and Interaction', () => {
    test('should toggle filters', async ({ page }) => {
        console.log('Testing Filters...');
        // The filter button is in the right side FAB group
        // In mobile it's often the second button in that group
        const filterBtn = page.locator('.fa-sliders-h').first();
        await filterBtn.click({ force: true });

        await page.waitForTimeout(500);
        await expect(page.locator('text=Filtros')).toBeVisible();

        await page.locator('.fa-times').first().click({ force: true });
        console.log('Filters toggled.');
    });

    test('should open profile modal', async ({ page }) => {
        console.log('Opening Profile...');
        await page.click(`text=${MOCK_USER.nickname}`, { force: true });
        await expect(page.locator('text=Editar Perfil')).toBeVisible();

        // Close using the X icon in modal
        await page.locator('.fa-times').first().click({ force: true });
        console.log('Profile closed.');
    });
});
