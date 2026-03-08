import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');

    console.log('Waiting for login screen...');
    await page.waitForSelector('input[type="email"]');

    console.log('Filling form...');
    await page.fill('input[type="email"]', 'newusertest123@sigma.com');
    await page.fill('input[type="password"]', '123456');

    // click the switch to signup
    const registerBtn = await page.$('text="Não tem uma conta? Cadastre-se"');
    if (registerBtn) {
        await registerBtn.click();
        await page.fill('input[placeholder="Seu nome"]', 'Test User');
    }

    console.log('Clicking action button...');
    await page.click('button[type="submit"]');

    console.log('Waiting for changes...');
    await page.waitForTimeout(10000);

    await browser.close();
})();
