import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import Adblocker from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! 3';
  }

  async test(): Promise<string[]> {
    puppeteer.use(StealthPlugin());
    puppeteer.use(Adblocker({ blockTrackers: true }));
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const url = 'https://lectortmo.com/library/manga/9276/one-punch-man';
    const page = await browser.newPage();
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);
    await page.goto(url);

    const mangaUrl = await page.$eval('ul.chapter-list', (container) => {
      const aTag = container
        ?.querySelector('li')
        ?.querySelector('div')
        ?.querySelector('div:last-child')
        ?.querySelector('a');
      return aTag?.getAttribute('href');
    });

    let client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    const page2 = await browser.newPage();
    await page2.goto(mangaUrl!);

    let currentUrl = await page2.url();
    currentUrl = currentUrl.replace('paginated', 'cascade');

    client = await page2.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    const page3 = await browser.newPage();
    await page3.goto(currentUrl);

    const imageUrls = await page3.$$eval('img.viewer-img', (imgs) => {
      return imgs.map((img) =>
        img.getAttribute('data-src')?.replace('japanreader', 'recipesandcook'),
      );
    });

    await browser.close();
    return imageUrls;
  }
}
