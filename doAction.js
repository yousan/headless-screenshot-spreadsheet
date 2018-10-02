const TIME_OF_WAIT = 3000; // いまは3秒
async function main(page, row) {
  const actioned = { action: undefined, status: undefined };
  if (row.URL) await page.goto(row.URL); // URLが定義されている命令の場合、そのページに移動してから命令を実行する
  switch (row.action) {
    case 'input':
      try {
        await page.type(row.key, row.value);
        actioned.status = 'success';
      } catch (e) {
        console.log(e);
        actioned.status = 'error';
      }
      break;
    case 'click':
      // クリックしてページ推移する際のBear in mind
      // https://github.com/GoogleChrome/puppeteer/blob/v1.8.0/docs/api.md#pageclickselector-options

      // どちらを使えば良いのか。。。
      // https://github.com/GoogleChrome/puppeteer/blob/v1.8.0/docs/api.md#pagewaitfornavigationoptions
      /*
            const navigationPromise = page.waitForNavigation();
            await page.click('a.my-link'); // Clicking the link will indirectly cause a navigation
            await navigationPromise; // The navigationPromise resolves after navigation has finished
            */
      try {
        const [response] = await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
          page.click(row.key),
        ]);
        actioned.status = 'success';
      } catch (e) {
        console.log(e);
        actioned.status = 'error';
      }
      /*
            // クリック動作完了時にページ推移が完了しているとナビゲーション待ちが失敗する・・・？不明。
            // そもそもナビゲーション待ちが難しい可能性。
            // ナビゲーション完了の検知方法
            // https://qiita.com/unhurried/items/56ea099c895fa437b56e
            await page.click(row.key);
            page.waitForNavigation({waitUntil: 'networkidle0'});
            */

      break;
    case 'check': // 要素が正しいか確認する or スクリーンショットを撮影する
      // FixMe: keyとvalueが指定されていない場合、スクリーンショット撮影用のcheckとする
      if (row.key === '' && row.value === '') {
        actioned.status = 'success';
        break;
      }
      const evaluateResult = await page.evaluate((selector, value) => {
        // FixMe: selectorの妥当性を検証する方法があればもっとスマートになるかも？
        // FixMe: 複数のreturnはリファクタリングの対象
        // 検索する文字列が正規表現として認識されないようにするために文字列をエスケープする
        // 暗黙のキャストで文字列が正規表現に変換されてしまうため。
        // https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions
        function escapeRegExp(string) {
          return string.replace(/[.*+?^=!:${}()|[\]\/\\]/g, '\\$&');
        }
        try {
          // selectorが妥当なCSSセレクターでは無い場合、エラーが起きる
          // https://developer.mozilla.org/ja/docs/Web/API/Document/querySelector
          const element = document.querySelector(selector);
          if (element == null) return `${selector} is not found`;
          // タグによって(div,input等)中にある文字を取得するメソッドが違う。
          return RegExp(escapeRegExp(value)).test(document.querySelector(selector).innerHTML)
                        || RegExp(escapeRegExp(value)).test(document.querySelector(selector).value);
        } catch (e) {
          return e.message;
        }
      }, row.key, row.value);
      if (evaluateResult === true) actioned.status = 'success';
      if (evaluateResult === false) actioned.status = 'error';
      if (typeof evaluateResult === 'string') { // evaluateメソッドに渡した関数内のcatch文でエラーメッセージを拾った場合
        console.log(`ID: ${row.ID}, key: ${row.key}, value: ${row.value}\n${evaluateResult}`);
        actioned.status = 'error';
      }
      if (typeof evaluateResult !== 'boolean' && typeof evaluateResult !== 'string') {
        console.log(`ID: ${row.ID}, key: ${row.key}, value: ${row.value}\n${evaluateResult}`);
        throw new Error('Unknown Error'); // ここには来ない予定。
      }
      break;
    case 'wait':
      await page.waitFor(TIME_OF_WAIT);
      break;
      // ここから下はシステム系の命令
    case 'basic':
      // BASIC認証を通す
      /*
            const auth = new Buffer(row.key + ':' + row.value).toString('base64');
            await page.setExtraHTTPHeaders({
                'Authorization': `Basic ${auth}`
            });
            */
      await page.authenticate({ username: row.key, password: row.value });
      actioned.status = 'success';
      break;
    case 'set': // 変数のセット系
      switch (row.key) {
        // サイズ決める
        case 'Viewport': // e.g. {"width": 1500, "height": 600}
          // csvtojsonはjson文字列をパースしないので注意
          await page.setViewport(JSON.parse(row.value));
          break;
        default:
          break;
      }
      actioned.status = 'success';
      break;
    default:
      console.log(`Undefined action: ${row.action}`);
      break;
  }
  return actioned;
}

module.exports = main;
