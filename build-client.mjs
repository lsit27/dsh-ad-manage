/**
 * 构建脚本：把 ui/*.jsx 与 locale/*.json 内嵌进 client.js 的对应区块。
 * client.js 使用明确的标记界定可重建区块，框架代码保持不变。
 * 每次修改 ui/ 或 locale/ 后运行：node build-client.mjs
 *
 * 关键点：整个 [START, END) 区块由本脚本完全重建，绝不复用其中的旧内容，
 * 避免 installUi / 样式定义被重复追加（历史 bug 导致审计页用了旧模块而空白）。
 */
import fs from 'node:fs'
import crypto from 'node:crypto'

const UI_FILES = ['components', 'ConnectConfig', 'Objects', 'AuditLog', 'Market', 'SyncPanel', 'App']
const START = '  // ---- inlined UI modules ------------------------------------------------'
const END = '  // ---- remote bridge ----------------------------------------------------'

let client = fs.readFileSync('client.js', 'utf8')
const s = client.indexOf(START)
const e = client.indexOf(END)
if (s < 0 || e < 0 || e <= s) throw new Error('client.js 缺少内嵌区块标记')

// 1) UI 模块源码（附带内容摘要，便于诊断热更新是否生效）
const uiFiles = UI_FILES.map(name => ({ name, src: fs.readFileSync(`ui/${name}.jsx`, 'utf8') }))
const digest = crypto.createHash('sha256')
for (const f of uiFiles) digest.update(f.name).update(f.src)
const UI_DIGEST = digest.digest('hex').slice(0, 16)
const uiSources = uiFiles.map(f => `  UI_SOURCES.push(${JSON.stringify(f.src)});`)

// 2) 从当前 client.js 中只提取样式定义（STYLE_ID 声明 + STYLE_CSS 数组 + installStyles 函数），
//    到第一个 function installUi 之前为止，绝不把 installUi 一起带过来。
const styleStart = "  var STYLE_ID = 'dm-ui-styles';"
const ss = client.indexOf(styleStart, s)
const installUiIdx = client.indexOf('  function installUi(', ss >= 0 ? ss : s)
let styleBlock = ''
if (ss >= 0 && installUiIdx > ss && installUiIdx < e) {
  styleBlock = client.slice(ss, installUiIdx).trimEnd()
}
if (!styleBlock || !styleBlock.includes('function installStyles')) {
  throw new Error('client.js 中未能提取到完整的样式定义（STYLE_ID / installStyles）')
}

const uiBlock = `${START}
  // UI IIFE 源码内嵌，浏览器无需加载相对 .jsx 子模块。
  // digest=${UI_DIGEST} 由 build-client.mjs 生成，用于确认页面加载的是最新代码。
  var UI_SOURCES = [];
${uiSources.join('\n')}

${styleBlock}

  // 每次调用都重新执行全部模块：模块只是覆盖 window.__DM_UI__.* 导出，
  // 重复执行安全；这样插件热更新后不会因 window 上残留的旧 App 而加载过期代码
  // （历史 bug：审计页因旧模块缺少安全序列化而整页空白）。
  function installUi(require) {
    if (typeof window === 'undefined') return null;
    for (var i = 0; i < UI_SOURCES.length; i++) {
      try {
        var fn = new Function('require', 'window', UI_SOURCES[i]);
        fn(require, window);
      } catch (err) { /* 单个模块失败不影响其余模块 */ }
    }
    return (window.__DM_UI__ && window.__DM_UI__.App) ? window.__DM_UI__ : null;
  }

`
client = client.slice(0, s) + uiBlock + client.slice(e)

// 3) DICT 区块（locale 内嵌）
const zh = fs.readFileSync('locale/zh.json', 'utf8').trim()
const en = fs.readFileSync('locale/en.json', 'utf8').trim()
const dictRe = /  var DICT = \{[\s\S]*?\n  \};/
if (!dictRe.test(client)) throw new Error('client.js 缺少 DICT 区块')
client = client.replace(dictRe, `  var DICT = {\n    zh: ${zh},\n    en: ${en}\n  };`)

fs.writeFileSync('client.js', client, 'utf8')
console.log('client.js rebuilt: ui modules =', UI_FILES.length, ', locale embedded, digest =', UI_DIGEST)
