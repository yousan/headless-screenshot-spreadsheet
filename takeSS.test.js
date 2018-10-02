const fs = require('fs');
const takeSS = require('./takeSS');
const puppeteer = require('puppeteer');
const { toMatchImageSnapshot } = require('jest-image-snapshot');
expect.extend({ toMatchImageSnapshot });

describe('test takeSS', function () {
    test('takeSS takes screenshot with destination dir and prefix', async function () {
        const json = {
            ID: '000',
            screenshot: 'hoge'
        }
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.goto('https://example.com');
        const destdir = 'sstest';
        const prefix = 'hogep';
        const result = await takeSS(page, json, destdir, prefix);
        expect(fs.existsSync(result)).toBeTruthy();
        const buffer = fs.readFileSync(result);
        // CircleCIと手元の環境が違うせいなのか、生成される画像に微妙な誤差が出る。おそらくフォントの違いの予感。
        expect(buffer).toMatchImageSnapshot({
            failureThreshold: '0.05',
            failureThresholdType: 'percent'
        });
        fs.unlinkSync(result);
        await page.close();
        await browser.close();
    });

    test('takeSS takes screenshot', async function () {
        const json = {
            ID: '000',
            screenshot: 'hoge'
        }
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.goto('https://example.com');
        const result = await takeSS(page, json);
        expect(fs.existsSync(result)).toBeTruthy();
        const buffer = fs.readFileSync(result);
        // CircleCIと手元の環境が違うせいなのか、生成される画像に微妙な誤差が出る。おそらくフォントの違いの予感。
        expect(buffer).toMatchImageSnapshot({
            failureThreshold: '0.05',
            failureThresholdType: 'percent'
        });
        fs.unlinkSync(result);
        await page.close();
        await browser.close();
    })
});
