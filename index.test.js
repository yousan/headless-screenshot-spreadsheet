import index from './index';

test('test hss function', async () => {
  const hssurl = 'https://docs.google.com/spreadsheets/d/1spYYw9BUeiTg8uDQpovSFaqoBqUBt6B1dBOyB3gi3Mw/export?format=csv&gid=0';
  let handler;
  const result = await index.hss(hssurl, handler);
  result.forEach((element, i, array) => {
    expect(element).toMatchObject({ status: 'success' });
  });
}, 600 * 1000);
