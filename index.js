const request = require('request');
const csv = require('csvtojson');
const puppeteer = require('puppeteer');
const doAction = require('./doAction');
const takeSS = require('./takeSS');

const result_base = require('./result');

module.exports = {

  /**
     * CLIで呼び出されたときの引数。
     */
  argv: undefined,

  /**
     * 引数類を入れる
     */
  options: {
    dest: 'ss',
  },

  /**
     * 処理結果の配列。
     */
  results: [],

  /**
     * puppeteer起動時のオプション
     * @link https://github.com/GoogleChrome/puppeteer
     */
  launch_options: {
    headless: true,
    args: ['--no-sandbox', '--lang=ja'], // デフォルトでは言語設定が英語なので日本語に変更
  },

  /**
     * 外部モジュールとして呼び出される時
     */
  async hss(url, handler) {
    // const handler2 = function(handler) {
    //     let last = this.stack.length-1;
    //     handler(this.stack[last]);
    // }(handler);
    // this.results = new EventedArray(handler);
    this.init();
    console.log(`Passed URL: ${url}`);
    url = this.gss_url(url);
    console.log(`Modified URL:${url}`);
    const csv = await this.load_csv(url);
    console.log(`CSV loaded. ${csv.length} rows found.`);
    const browser = await this.browser();
    // console.log(browser);
    await this.process_rows(browser, csv);
    await browser.close();
    // console.log(this.results);
  },

  /**
     * CLIで呼び出された時の処理。
     */
  async cli() {
    let url = this.parse_args();
    this.init();
    console.log(`Passed URL: ${url}`);
    url = this.gss_url(url);
    console.log(`Modified URL:${url}`);
    const csv = await this.load_csv(url);
    console.log(`CSV loaded. ${csv.length} rows found.`);
    const browser = await this.browser();
    // console.log(browser);
    await this.process_rows(browser, csv);
    await browser.close();
    console.log(this.results);
  },

  /**
     * 各行を処理する
     *
     * @param browser
     * @param rows
     * @returns {Promise<void>}
     */
  async process_rows(browser, rows) {
    const page = await browser.newPage();
    for (let i = 0; i < rows.length; i++) {
      const result = { ID: undefined, screenshot: undefined };
      const url = '';
      if (!this.is_activate(rows[i])) {
        continue;
      }
      result.ID = rows[i].ID; // 一行処理開始
      // let actioned = await this.do_action(page, rows[i]);
      const actioned = await doAction(page, rows[i]);
      result.action = actioned.action;
      result.status = actioned.status;
      result.screenshot = rows[i].screenshot;
      // result.ss_path = await this.take_ss(page, rows[i]);
      result.ss_path = await takeSS(page, rows[i]);


      // let result = result_base;
      // let result = require('./result')._extend();
      // result.ID = rows[i].ID;
      this.results.push(result);
    }
    return this.results;
  },

  /**
     * スクリーンショットを取る。
     * todo: ssディレクトリの指定が与えられたら変更する。
     *
     * @param page
     * @param row
     * @returns {Promise<void>}
     */
  async take_ss(page, row) {
    if (row.screenshot !== 'なし' && row.screenshot.length) {
      const file = `${this.options.dest + row.ID}_${row.screenshot}.png`;
      console.log(`screenshot: ${file}`);
      await page.screenshot({ path: file, fullPage: true }); // スクリーンショット取っちゃう
      return file;
    }
  },

  /**
     * 命令を実行する。
     * 結果はオブジェクトで返す。エラーが発生した場合にはstatus: 'error'、何もなければstatus'sccess' を返す。
     *
     * @returns {Promise<void>}
     */
  async do_action(page, row) {
    console.log(row.action, `\tkey: ${row.key}\tvalue: ${row.value}`);
    const actioned = { action: undefined, status: 'error' };
    switch (row.action) {
      case 'input':
        console.log(`key: ${row.key}\tvalue: ${row.value}`);

        // 0.13以降の新しい書き方らしい
        page.type(row.key, row.value);
        await page.waitFor(1000);
        page.waitForNavigation({ waitUntil: 'networkidle0' });
        // await page.evaluate((selector, value) => {
        //     document.querySelector(selector).value = value;
        // }, row.key, row.value);
        actioned.status = 'success';
        break;
      case 'click':
        await page.click(row.key);
        page.waitForNavigation({ waitUntil: 'networkidle0' });
        actioned.status = 'success';
        break;
      case 'check': // 要素が正しいか確認する
        actioned.status = await page.evaluate((selector, value) => {
          try {
            document.querySelector(selector).innerHTML.match(value);
            return 'success';
          } catch (e) {
            return 'error';
          }
        }, row.key, row.value);
        break;
      case 'wait': // ページロードまで待つ
        await page.waitFor(3000); // いまは3秒
        console.log('wait');
        // @link https://stackoverflow.com/questions/46948489/puppeteer-wait-page-load-after-form-submit
        // await page.waitForNavigation({ waitUntil: 'networkidle0' });
        break;
        // ここから下はシステム系の命令
      case 'basic':
        // BASIC認証を通す
        const auth = new Buffer(`${row.key}:${row.value}`).toString('base64');
        await page.setExtraHTTPHeaders({
          Authorization: `Basic ${auth}`,
        });
        actioned.status = 'success';

        break;
      case 'set':
        switch (row.key) {
          // サイズ決める
          case 'Viewport':
            await page.setViewport(JSON.parse(row.value));
        }
        actioned.status = 'success';
        break;
      default:
        break;
    }
    return actioned;
  },

  /**
     * 次の出力に向けて結果をリセットする。
     */
  reset() {
    console.log(this.results);
    delete this.results;
    console.log(this.results);
  },

  /**
     * CSV行が有効行かどうか調べる。
     * ID列に整数が入っていて数字の場合に有効行とみなす。
     */
  is_activate(row) {
    if (row.ID !== 'undefined' && Number.isInteger(parseInt(row.ID))) { // IDに整数が入っている場合だけ
      return true;
    }
    return false;
  },

  /**
     * ブラウザを作成して返す。
     *
     * @returns {Promise<*>}
     */
  async browser() {
    console.log('Starting browser...');
    // ブラウザを起動する
    console.dir(this.launch_options);
    const browser = await puppeteer.launch(this.launch_options);
    // const browser = await puppeteer.launch({ args: ['--no-sandbox']});
    console.log('Done.');
    console.log('Creating Page');
    // const page = await browser.newPage(); // ページつくる
    console.log('Done.');

    return browser;
  },

  /**
     * GSSのURLからCSVをダウンロードする。
     * 同期処理！
     *
     * @param url
     * @returns {Promise<any>}
     */
  async load_csv(url) {
    return new Promise(((resolve, reject) => {
      const rows = [];

      csv({ noheader: false }).fromStream(request.get(url))
        .on('json', (json) => { // this func will be called 3 times
          rows.push(json); // 配列に貯める
        })
        .on('done', (json) => { // 完了
          resolve(rows); // ここでCSVのJSONオブジェクトを返す
        });
    }));
  },

  /**
     * コマンドラインで使われる場合に引数をパースする。
     * 第１引数に来るurlは必須にしておく。
     *
     * ヘッドレスで動かすかどうかのオプション。
     * 両方が与えられた場合にはheadlessで動かす。
     * --headless: default
     * --noheadless
     *
     * --dest, -d: スクリーンショット配置先のディレクトリを指定する
     * e.g. --dest ss/
     * e.g. --dest ss/123/
     */
  parse_args() {
    // @link https://github.com/yargs/yargs/blob/HEAD/docs/examples.md
    const argv = require('yargs')
      .usage('Usage: $0 [options] <URL>')
      .command('hss', 'Headless takes screenshots from SpreadSheet')
      .example('$0 https://... ', 'Take screenshots')
      .demandCommand(1)
      .boolean('headless')
      .boolean('noheadless')
      .argv;
    if (argv.noheadless && !argv.headless) { // Noヘッドレスモードの場合
      this.launch_options.headless = false;
    }
    if (argv.dest) { // 引数が指定されていれば格納する
      this.options.dest = argv.dest;
    }
    this.argv = argv;
    return argv._[0];
  },

  /**
     * GSSのURLを正しい形式にする。
     * GSSのURLは
     *  1. ブラウザのロケーションバーのURL
     *  2. 共有状態のURL
     *  3. CSVダウンロード可能なURL
     * があるが、「CSVダウンロード可能なURL」に変換する。
     *
     * todo: 未実装だよ！
     */
  gss_url(url) {
    /**

         // 1. docs.google.comで始まっている
         // 1. URLパスの最後がexportになっている

         // またフォーマットについては正しくない場合に修正を行う。
         // 1. format=csvになっている

         // 先頭が https://docs.google.com/ で始まっているか確認する ココ重要！
         if ( 0 !== strpos($url, 'https://docs.google.com/spreadsheets')) {
            throw new Exception('GoogleスプレッドシートのURLではないようです。');
        }

         // 末尾の/editを/exportに変える（厳密にはURL中の…、だけれど、ハッシュで/editが出る可能性は低いと見ている
         // e.g. https://docs.google.com/spreadsheets/d/1yfMIdt8wgBPrMY3UwiCTsX3EN_2gcLCmPAEy8dfYeLY/edit#gid=0
         $url = str_replace('/edit', '/export', $url);

         // #gid=0があれば取り除く
         // e.g. https://docs.google.com/spreadsheets/d/1yfMIdt8wgBPrMY3UwiCTsX3EN_2gcLCmPAEy8dfYeLY/export#gid=0
         $url = str_replace('#gid=0', '', $url);
         // $url = str_replace('#gid=0', '', $url);

         // 末尾に?format=csvを足す
         // e.g. https://docs.google.com/spreadsheets/d/1yfMIdt8wgBPrMY3UwiCTsX3EN_2gcLCmPAEy8dfYeLY/export
         if ( FALSE === strpos($url, 'format=csv') ) {
            if (FALSE !== strpos($url, '#')) { // #があった場合にはうまくいかない
                $url = str_replace('#', '?format=csv#', $url);
            } else {
                // @link https://stackoverflow.com/questions/5809774/manipulate-a-url-string-by-adding-get-parameters
                $query = parse_url($url, PHP_URL_QUERY); // クエリ文字列だけを抜きだす
                $url   .= ! empty($query) // 既にクエリ文字列が設定されているかどうか
                    ? '&format=csv' // 設定されていれば&で連結し
                    : '?format=csv'; // そうでなければ?で連結する
            }
        }

         // 完成したURLの例
         // e.g. https://docs.google.com/spreadsheets/d/1yfMIdt8wgBPrMY3UwiCTsX3EN_2gcLCmPAEy8dfYeLY/export?usp=sharing&format=csv
         return $url;
         * */
    return url;
  },

  /**
     * 初期化系
     */
  init() {
    const request = require('request');
    const csv = require('csvtojson');
    const puppeteer = require('puppeteer');

    const fs = require('fs');
    console.log(`exist dir?${this.options.dest}`);
    if (!fs.existsSync(this.options.dest)) { // ディレクトリを作る
      console.log(`no! Im creating ${this.options.dest}`);
      fs.mkdirSync(this.options.dest);
    }
  },

  /**
     * ようこそ！
     */
  hello() {
    console.log('Hello World! Hey, enjoy your NodeJS!');
  },
};

/**
 * @link https://stackoverflow.com/questions/5306843/javascript-attach-event-listener-to-array-for-push-event
 *
 * @param handler
 * @constructor
 */
function EventedArray(handler) {
  this.stack = [];
  this.mutationHandler = handler || function () {
  };
  this.setHandler = function (f) {
    this.mutationHandler = f;
  };
  this.callHandler = function () {
    if (typeof this.mutationHandler === 'function') {
      this.mutationHandler();
    }
  };
  this.push = function (obj) {
    this.stack.push(obj);
    this.callHandler();
  };
  this.pop = function () {
    this.callHandler();
    return this.stack.pop();
  };
  this.getArray = function () {
    return this.stack;
  };
}
