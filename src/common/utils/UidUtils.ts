import { customAlphabet } from 'nanoid';
// https://github.com/ai/nanoid#readme
// 查看重复率 https://zelark.github.io/nano-id-cc/

/**
 * 生成随机ID
 * ID包含数字、小写字母
 * @param size 长度
 * @param prefix 前缀
 * @returns string
 */
export function generateId(size: number, prefix?: string): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, size);
  if (prefix) return `${prefix}${nanoid()}`;
  return nanoid();
}

/**
 * 生成随机ID
 * ID包含数字、大小写字母、下划线、横杠
 * @param size 长度
 * @param prefix 前缀
 * @returns string
 */
export function generateUuid(size: number, prefix?: string): string {
  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
  const nanoid = customAlphabet(alphabet, size);
  if (prefix) return `${prefix}${nanoid()}`;
  return nanoid();
}

/**
 * 随机数 纯数字0-9
 * @param size 长度
 * @returns number
 */
export function generateNumber(size: number): number {
  const nanoid = customAlphabet('0123456789', size);
  return parseInt(nanoid());
}
