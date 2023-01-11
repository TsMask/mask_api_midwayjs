// 依赖来源 https://github.com/iamkun/dayjs
import dayjs = require('dayjs');
// 导入本地化语言并设为默认使用
require('dayjs/locale/zh-cn');
dayjs.locale('zh-cn');

/**年 列如：2022 */
export const YYYY = 'YYYY';

/**年-月 列如：2022-12 */
export const YYYY_MM = 'YYYY-MM';

/**年-月-日 列如：2022-12-30 */
export const YYYY_MM_DD = 'YYYY-MM-DD';

/**年月日时分秒 列如：20221230010159 */
export const YYYYMMDDHHMMSS = 'YYYYMMDDHHmmss';

/**年-月-日 时:分:秒 列如：2022-12-30 01:01:59 */
export const YYYY_MM_DD_HH_MM_SS = 'YYYY-MM-DD HH:mm:ss';

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
 * @param date Date对象
 * @param formatStr 时间格式 默认YYYY-MM-DD HH:mm:ss
 * @returns 时间格式字符串
 */
export function parseDateToStr(
  date: Date,
  formatStr: string = YYYY_MM_DD_HH_MM_SS
): string {
  return dayjs(date).format(formatStr);
}

/**
 * 格式时间成日期路径
 *
 * 年/月 列如：2022/12
 * @returns 时间格式字符串 YYYY/MM
 */
export function parseDatePath(): string {
  return dayjs(new Date()).format('YYYY/MM');
}

/**
 * 判断两次时间差是否小于间隔时间
 * @param endDate 结束时间
 * @param startDate 开始时间
 * @param interval 时间间隔，单位秒
 * @returns true | false
 */
export function diffSeconds(
  endDate: number | Date,
  startDate: number | Date,
  interval: number
): boolean {
  const diff = Math.ceil(dayjs(endDate).diff(startDate, 's'));
  if (Number.isNaN(diff)) return false;
  return diff < interval;
}
