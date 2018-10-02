const doAction = require('./doAction');
const puppeteer = require('puppeteer');
const rows = require('./rows');

describe('test input action with defined URL', function () {
    test('doAction navigates page to when URL is defined. then input value.', async function () {
        const json = {
            ID: '000',
            URL: 'https://www.google.co.jp/',
            action: 'input',
            key: '#lst-ib',
            value: 'hogehoge',
            screenshot: ''
        }
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        let result = await doAction(page, json);
        expect(result.status).toEqual('success');
        expect(page.url()).toEqual(json.URL);
        expect(await page.$eval(json.key, e => e.value)).toEqual(json.value);
        result = await doAction(page, {action: 'check', key: json.key, value: json.value});
        expect(result.status).toEqual('success');
        await browser.close();
    });
})


describe.skip('test set action', async function () {
    test('set authentication parameter then access page.', async function () {
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();

        let result = await doAction(page, rows[0]);
        expect(result.status).toEqual('success');

        result = await doAction(page, rows[1]);
        expect(result.status).toEqual('success');

        result = await doAction(page, rows[2]);
        expect(page.url()).toEqual(rows[2].URL);
        expect(result.status).toEqual('success');
        browser.close();
    }), 1000 * 10
});

describe.skip('test check action', async function () {
    test('doAction check #password', async function () {
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await doAction(page, rows[0]);
        await doAction(page, rows[1]);
        await doAction(page, rows[2]);
        await doAction(page, rows[3]);
        await page.screenshot({path: 'hoge.png'});
        let result = await doAction(page, {action: 'check', key: '#password', value: 'password'});
        expect(result.status).toEqual('success');
        result = await doAction(page, {action: 'check', key: 'notexistkey', value: 'password'});
        expect(result.status).toEqual('error');
        result = await doAction(page, {action: 'check', key: '#password', value: 'hogehoge'});
        expect(result.status).toEqual('error');
        result = await doAction(page, {action: 'check', key: '#password', value: '.*'});
        expect(result.status).toEqual('error');
        result = await doAction(page, {action: 'check', key: '', value: ''});
        expect(result.status).toEqual('success');
        result = await doAction(page, {action: 'check', key: '', value: 'hoge'});
        expect(result.status).toEqual('error');
        browser.close();
    })
})
