import { customAlphabet, nanoid } from 'nanoid';
// V4 不支持commonjs
// https://github.com/ai/nanoid#readme
// 查看重复率 https://zelark.github.io/nano-id-cc/

/**
 * 生成随机Hash
 * 包含数字、小写字母
 * @param size 长度
 * @returns string 不保证长度满足
 */
export function generateCode(size: number): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, size);
  return nanoid();
}

/**
 * 生成随机字符串
 * 包含数字、大小写字母、下划线、横杠
 * @param size 长度
 * @returns string 不保证长度满足
 */
export function generateString(size: number): string {
  return nanoid(size);
}

/**
 * 随机数 纯数字0-9
 * @param size 长度
 * @returns 字符串
 */
export function generateNumber(size: number): string {
  let str = '';
  for (let i = 0; i < size; i++) {
    const digit = Math.floor(Math.random() * 10);
    str += digit.toString();
  }
  return str;
}
