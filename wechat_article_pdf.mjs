import { chromium } from 'playwright';
import { join } from 'path';
import { homedir } from 'os';
import { renameSync } from 'fs';

const ARTICLE_URL = 'https://mp.weixin.qq.com/s/sN2oqu4eAdYGaOp_XhgqQQ?mpshare=1&scene=1&srcid=0612VcT8fkhYa8mQj5l3MS0O&sharer_shareinfo=2c135fd0d4006737735dc7dc04580ad6&sharer_shareinfo_first=2c135fd0d4006737735dc7dc04580ad6&from=industrynews&color_scheme=light#rd';

const DESKTOP = join(homedir(), 'Desktop');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36 MicroMessenger/8.0.50',
    locale: 'zh-CN',
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('Navigating to article...');
  await page.goto(ARTICLE_URL, {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for article content
  try {
    await page.waitForSelector('#js_content, .rich_media_content, #activity-name', {
      timeout: 15000
    });
  } catch {
    console.log('Waiting additional time for content...');
  }

  await page.waitForTimeout(3000);

  // Scroll to trigger lazy loading
  await page.evaluate(async () => {
    const totalHeight = document.body.scrollHeight;
    for (let y = 0; y < totalHeight; y += 200) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(2000);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Get title
  const title = await page.evaluate(() => {
    const el = document.querySelector('#activity-name') ||
               document.querySelector('h1') ||
               document.querySelector('title');
    return el?.innerText?.trim() || 'wechat_article';
  });

  const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
  const pdfPath = join(DESKTOP, `${safeTitle}.pdf`);

  console.log(`Title: ${title}`);
  console.log(`Exporting to: ${pdfPath}`);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '5mm', right: '5mm' },
    displayHeaderFooter: false
  });

  console.log(`✓ PDF saved to: ${pdfPath}`);
  await browser.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
