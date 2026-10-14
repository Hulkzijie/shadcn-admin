import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

/**
 * RuoYi-Vue-Plus 接口加密工具
 *
 * 加密流程（请求）：
 * 1. 随机生成 32 位 AES 密钥
 * 2. Base64 编码 AES 密钥
 * 3. RSA 公钥加密 Base64 后的 AES 密钥 → 放入 encrypt-key 请求头
 * 4. AES-ECB-PKCS7 加密请求体
 *
 * 解密流程（响应，仅当响应头存在 encrypt-key 时）：
 * 1. RSA 私钥解密响应头 encrypt-key → Base64 编码的 AES 密钥
 * 2. Base64 解码得到 AES 密钥
 * 3. AES-ECB-PKCS7 解密响应体
 */

// 后端公钥（用于加密请求，对应后端 application.yml 中 api-decrypt.privateKey）
const RSA_PUBLIC_KEY = import.meta.env.VITE_APP_RSA_PUBLIC_KEY ?? ''

// 前端私钥（用于解密响应，对应后端 application.yml 中 api-decrypt.publicKey）
const RSA_PRIVATE_KEY = import.meta.env.VITE_APP_RSA_PRIVATE_KEY ?? ''

/** 随机生成 32 位字符串作为 AES 密钥 */
function generateRandomString(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/** 生成 AES 密钥（WordArray） */
function generateAesKey(): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Utf8.parse(generateRandomString(32))
}

/** Base64 编码 */
function encryptBase64(str: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(str)
}

/** Base64 解码 */
function decryptBase64(str: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(str)
}

/** AES-ECB-PKCS7 加密 */
export function encryptWithAes(
  message: string,
  aesKey: CryptoJS.lib.WordArray
): string {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

/** AES-ECB-PKCS7 解密 */
export function decryptWithAes(
  message: string,
  aesKey: CryptoJS.lib.WordArray
): string {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

/** RSA 公钥加密 */
export function encryptByRsa(text: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(RSA_PUBLIC_KEY)
  return encryptor.encrypt(text)
}

/** RSA 私钥解密 */
export function decryptByRsa(text: string): string | false {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(RSA_PRIVATE_KEY)
  return encryptor.decrypt(text)
}

export interface EncryptedRequest {
  headers: Record<string, string>
  data: string
}

/**
 * 加密请求体，返回加密后的请求头和请求体
 * @param data 原始请求数据（对象或字符串）
 */
export function encryptRequest(data: unknown): EncryptedRequest {
  const aesKey = generateAesKey()
  const base64AesKey = encryptBase64(aesKey)
  const encryptedAesKey = encryptByRsa(base64AesKey)

  if (!encryptedAesKey) {
    throw new Error('RSA 加密失败，请检查公钥配置')
  }

  const plainText = typeof data === 'string' ? data : JSON.stringify(data)
  const encryptedBody = encryptWithAes(plainText, aesKey)

  return {
    headers: {
      'encrypt-key': encryptedAesKey,
    },
    data: encryptedBody,
  }
}

/**
 * 解密响应体
 * @param encryptedBody 加密的响应体
 * @param encryptedAesKey 响应头中的 encrypt-key
 */
export function decryptResponse(
  encryptedBody: string,
  encryptedAesKey: string
): string {
  const base64AesKey = decryptByRsa(encryptedAesKey)
  if (!base64AesKey) {
    throw new Error('RSA 解密失败，请检查私钥配置')
  }
  const aesKey = decryptBase64(base64AesKey)
  return decryptWithAes(encryptedBody, aesKey)
}
