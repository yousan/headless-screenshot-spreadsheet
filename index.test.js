import index from './index';

test('test hss function', async () => {
  const hssurl = 'https://docs.google.com/spreadsheets/d/1spYYw9BUeiTg8uDQpovSFaqoBqUBt6B1dBOyB3gi3Mw/export?format=csv&gid=0';
  let handler;
  await index.hss(hssurl, handler);
}, 600 * 1000);
