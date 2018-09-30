const fs = require('fs');
const EXTENSION = '.png';
async function main (page, row, destdir = '', prefix = '') {
    /*
    https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions_and_function_scope/Default_parameters
    関数のデフォルト引数 は、関数に値が渡されない場合や undefined が渡される場合に、デフォルト値で初期化される形式上の引数を指定できます。
     */
    if (destdir == null) throw new Error(`destdir is null`);
    if (prefix == null) throw new Error(`prefix is null`);
    if (row.screenshot === 'なし' || row.screenshot === 0 || row.screenshot === '' ||
        row.screenshot === null || row.screenshot === undefined) {
        return false;
    }
    // 保存先ディレクトリ名が指定されている場合、末尾にスラッシュを強制する、ディレクトリを作成する。
    if (destdir !== '') {
        destdir = destdir.replace(/\/+$/, '') + '/';
        if (!fs.existsSync(destdir)) fs.mkdirSync(destdir);
    }

    const file = destdir + prefix + row.ID + '_' + row.screenshot + EXTENSION;
    console.log('screenshot: ' + file);
    await page.screenshot({path: file, fullPage: true});
    return file;
}

module.exports = main;