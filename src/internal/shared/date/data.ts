// 依赖来源 https://github.com/iamkun/dayjs
import dayjs = require('dayjs');
// 导入本地化语言并设为默认使用
require('dayjs/locale/zh-cn');
dayjs.locale('zh-cn');

/**年-月-日 时:分:秒 列如：2022-12-30 01:01:59 */
export const YYYY_MM_DD_HH_MM_SS = 'YYYY-MM-DD HH:mm:ss';

/**RFC3339 时间格式 */
export const RFC3339 = 'YYYY-MM-DDTHH:mm:ssZ';

/**
 * 格式时间字符串
 * @param dateStr 时间字符串
 * @param formatStr 时间格式 默认YYYY-MM-DD HH:mm:ss
 * @returns Date对象
 */
export function parseStrToDate(
  dateStr: string,
  formatStr: string = YYYY_MM_DD_HH_MM_SS
): Date {
  return dayjs(dateStr, formatStr).toDate();
}

/**
 * 格式时间
 * @param date 可转的Date对象
 * @param formatStr 时间格式 默认YYYY-MM-DD HH:mm:ss
 * @returns 时间格式字符串
 */
export function parseDateToStr(
  date: string | number | Date,
  formatStr: string = YYYY_MM_DD_HH_MM_SS
): string {
  return dayjs(date).format(formatStr);
}

/**
 * 将时间数字格式化为 RFC3339
 */
export function parseDateToRFC3339(date: string | number | Date): string {
  if (date === '' || date === null || date === undefined) {
    return '0001-01-01T00:00:00Z';
  }
  const value = Number(date);
  if (Number.isFinite(value) && value === 0) {
    return '0001-01-01T00:00:00Z';
  }
  return dayjs(date).format(RFC3339);
}

/**
 * 格式时间成日期路径
 *
 * 年/月 列如：2022/12
 * @returns 时间格式字符串 YYYY/MM
 */
export function parseDatePath(date: number | Date = Date.now()): string {
  return dayjs(date).format('YYYY/MM');
}
