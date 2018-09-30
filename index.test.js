import index from './index.js'

test('test hss function', async function () {
    let hssurl = 'https://docs.google.com/spreadsheets/d/1spYYw9BUeiTg8uDQpovSFaqoBqUBt6B1dBOyB3gi3Mw/export?format=csv&gid=0';
    let handler;
    await index.hss(hssurl, handler);
}, 600 * 1000);
