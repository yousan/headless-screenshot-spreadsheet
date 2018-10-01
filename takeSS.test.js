const fs = require('fs');
const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
const takeSS = require('./takeSS');

expect.extend({ toMatchImageSnapshot });

describe('test takeSS', () => {
  test('takeSS takes screenshot with destination dir and prefix', async () => {
    const json = {
      ID: '000',
      screenshot: 'hoge',
    };
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const destdir = 'sstest';
    const prefix = 'hogep';
    const result = await takeSS(page, json, destdir, prefix);
    expect(fs.existsSync(result)).toBeTruthy();
    const buffer = fs.readFileSync(result);
    expect(buffer).toMatchImageSnapshot();
    fs.unlinkSync(result);
    await page.close();
    await browser.close();
  });

  test('takeSS takes screenshot', async () => {
    const json = {
      ID: '000',
      screenshot: 'hoge',
    };
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const result = await takeSS(page, json);
    expect(fs.existsSync(result)).toBeTruthy();
    const buffer = fs.readFileSync(result);
    expect(buffer).toMatchImageSnapshot();
    fs.unlinkSync(result);
    await page.close();
    await browser.close();
  });
});
