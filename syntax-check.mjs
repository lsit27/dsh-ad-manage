import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const esm = [
  'index.js',
  'src/crypto.js', 'src/store.js', 'src/market-service.js',
  'src/ldap-client.js', 'src/directory-service.js', 'src/rbac.js',
]
const scripts = [
  'client.js',
  'ui/components.jsx', 'ui/ConnectConfig.jsx', 'ui/Objects.jsx',
  'ui/AuditLog.jsx', 'ui/Market.jsx', 'ui/App.jsx',
]
const json = ['package.json', 'plugin.json', 'locale/zh.json', 'locale/en.json']

let pass = 0, fail = 0
for (const f of esm) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); pass++; console.log('OK  ', f) }
  catch (e) { fail++; console.log('FAIL', f, String(e.stderr || e.message)) }
}
import vm from 'node:vm'
for (const f of scripts) {
  try { new vm.Script(fs.readFileSync(path.resolve(f), 'utf8'), { filename: f }); pass++; console.log('OK  ', f) }
  catch (e) { fail++; console.log('FAIL', f, e.message) }
}
for (const f of json) {
  try { JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')); pass++; console.log('OK  ', f) }
  catch (e) { fail++; console.log('FAIL', f, e.message) }
}
process.stdout.write(`\nSyntax check: ${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
