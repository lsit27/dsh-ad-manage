/**
 * crypto.js — AES-256-GCM 加密存储
 * 契约：ARCHITECTURE.md 2.3（敏感字段加密；密钥来自 DSL_AD_LDAP_KEY 或安装时生成；不得明文落库或硬编码）
 */
import nodeCrypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = typeof process !== 'undefined' && process.env ? process.env : {};
const VERSION = 'v1';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SEAL_MARKER = '__sealed__';
const KEY_FILE = '.key';

function packageRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

/** 默认数据目录：DSL_AD_DATA_DIR 或包内 .data（与 store.js 保持一致） */
export function defaultDataDir() {
  if (ENV.DSL_AD_DATA_DIR) return path.resolve(ENV.DSL_AD_DATA_DIR);
  return path.resolve(packageRoot(), '.data');
}

function cryptoError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function keyFromEnv() {
  const raw = ENV.DSL_AD_LDAP_KEY;
  if (!raw) return null;
  let buf;
  try {
    buf = Buffer.from(String(raw).trim(), 'base64');
  } catch {
    throw cryptoError('KEY_MISMATCH', 'DSL_AD_LDAP_KEY 不是合法的 base64 字符串');
  }
  if (buf.length !== KEY_BYTES) {
    throw cryptoError('KEY_MISMATCH', `DSL_AD_LDAP_KEY 必须解码为 ${KEY_BYTES} 字节，当前为 ${buf.length} 字节`);
  }
  return buf;
}

function loadOrCreateKey(dataDir) {
  const envKey = keyFromEnv();
  if (envKey) return { key: envKey, source: 'env', keyPath: null };

  fs.mkdirSync(dataDir, { recursive: true });
  const keyPath = path.join(dataDir, KEY_FILE);
  if (fs.existsSync(keyPath)) {
    const content = fs.readFileSync(keyPath, 'utf8').trim();
    const key = Buffer.from(content, 'base64');
    if (key.length !== KEY_BYTES) {
      throw cryptoError('KEY_MISMATCH', `密钥文件损坏：期望 ${KEY_BYTES} 字节，实际 ${key.length} 字节（${keyPath}）`);
    }
    return { key, source: 'file', keyPath };
  }

  const key = nodeCrypto.randomBytes(KEY_BYTES);
  fs.writeFileSync(keyPath, key.toString('base64'), { mode: 0o600 });
  try {
    fs.chmodSync(keyPath, 0o600); // Windows 忽略
  } catch {
    /* noop */
  }
  return { key, source: 'generated', keyPath };
}

/**
 * 创建加密器。若需与 store 共用同一数据目录，请传 { dataDir }。
 * @returns {{encrypt,decrypt,seal,unseal,isSealed,dataDir,keySource,keyPath}}
 */
export function createCrypto(options = {}) {
  const dataDir = options.dataDir ? path.resolve(options.dataDir) : defaultDataDir();
  let keyInfo;
  if (options.key) {
    const k = Buffer.isBuffer(options.key) ? options.key : Buffer.from(options.key);
    keyInfo = { key: k, source: 'injected', keyPath: null };
  } else {
    keyInfo = loadOrCreateKey(dataDir);
  }
  const { key, source, keyPath } = keyInfo;
  if (!Buffer.isBuffer(key) || key.length !== KEY_BYTES) {
    throw cryptoError('KEY_MISMATCH', `AES-256 密钥必须为 ${KEY_BYTES} 字节`);
  }

  /** 加密字符串/对象，返回 v1:base64(iv):base64(tag):base64(data) */
  function encrypt(plain) {
    if (plain === undefined || plain === null) return plain;
    const text = typeof plain === 'string' ? plain : JSON.stringify(plain);
    const iv = nodeCrypto.randomBytes(IV_BYTES);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
  }

  /** 解密；格式错误 -> CIPHER_INVALID，认证失败/密钥不符 -> KEY_MISMATCH（均为中文错误） */
  function decrypt(cipherText) {
    if (cipherText === undefined || cipherText === null || cipherText === '') return cipherText;
    if (typeof cipherText !== 'string') {
      throw cryptoError('CIPHER_INVALID', '密文必须是字符串');
    }
    const parts = cipherText.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) {
      throw cryptoError('CIPHER_INVALID', '密文格式无效或版本不支持（期望 v1:iv:tag:data）');
    }
    let iv, tag, data;
    try {
      iv = Buffer.from(parts[1], 'base64');
      tag = Buffer.from(parts[2], 'base64');
      data = Buffer.from(parts[3], 'base64');
    } catch {
      throw cryptoError('CIPHER_INVALID', '密文 base64 解码失败');
    }
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || data.length === 0) {
      throw cryptoError('CIPHER_INVALID', '密文参数长度不合法');
    }
    try {
      const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const out = Buffer.concat([decipher.update(data), decipher.final()]);
      return out.toString('utf8');
    } catch (e) {
      if (e && (e.code === 'CIPHER_INVALID' || e.code === 'KEY_MISMATCH')) throw e;
      throw cryptoError('KEY_MISMATCH', '解密失败：密钥不匹配或密文已被篡改');
    }
  }

  function isSealed(value) {
    return !!(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value[SEAL_MARKER] === VERSION &&
      typeof value.cipher === 'string' &&
      value.cipher.length > 0
    );
  }

  /** 将任意可 JSON 序列化对象密封为带标记的结构，供存储层安全落库 */
  function seal(obj) {
    return { [SEAL_MARKER]: VERSION, cipher: encrypt(JSON.stringify(obj === undefined ? null : obj)) };
  }

  function unseal(sealed) {
    if (!isSealed(sealed)) {
      throw cryptoError('CIPHER_INVALID', '待解密对象不是有效的密封结构');
    }
    const text = decrypt(sealed.cipher);
    try {
      return JSON.parse(text);
    } catch {
      throw cryptoError('CIPHER_INVALID', '密封内容 JSON 解析失败');
    }
  }

  return { encrypt, decrypt, seal, unseal, isSealed, dataDir, keySource: source, keyPath };
}

let _default = null;
function getDefault() {
  if (!_default) _default = createCrypto();
  return _default;
}

/** 便捷顶层 API（使用默认数据目录的懒加载单例） */
export function encrypt(plain) { return getDefault().encrypt(plain); }
export function decrypt(cipher) { return getDefault().decrypt(cipher); }
export function seal(obj) { return getDefault().seal(obj); }
export function unseal(obj) { return getDefault().unseal(obj); }
export function isSealed(obj) { return getDefault().isSealed(obj); }

export default createCrypto;
