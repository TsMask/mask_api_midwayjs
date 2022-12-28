// 依赖来源 https://github.com/date-fns/date-fns
import { parse, format, differenceInSeconds } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**年 列如：2022 */
export const YYYY = 'yyyy';

/**年-月 列如：2022-12 */
export const YYYY_MM = 'yyyy-MM';

/**年-月-日 列如：2022-12-30 */
export const YYYY_MM_DD = 'yyyy-MM-dd';

/**年月日时分秒 列如：20221230010159 */
export const YYYYMMDDHHMMSS = 'yyyyMMddHHmmss';

/**年-月-日 时:分:秒 列如：2022-12-30 01:01:59 */
export const YYYY_MM_DD_HH_MM_SS = 'yyyy-MM-dd HH:mm:ss';

/**
 * 格式时间字符串
 * @param dateStr 时间字符串
 * @param formatStr 时间格式 默认yyyy-MM-dd HH:mm:ss
 * @returns Date对象
 */
export function parseStrToDate(
  dateStr: string,
  formatStr: string = YYYY_MM_DD_HH_MM_SS
): Date {
  return parse(dateStr, formatStr, new Date(), { locale: zhCN });
}

/**
 * 格式时间
 * @param date Date对象
 * @param formatStr 时间格式 默认yyyy-MM-dd HH:mm:ss
 * @returns 时间格式字符串
 */
export function parseDateToStr(
  date: Date,
  formatStr: string = YYYY_MM_DD_HH_MM_SS
): string {
  return format(date, formatStr, { locale: zhCN });
}

/**
 * 格式时间成日期路径
 *
 * 年/月/日 => 2022/12/12
 * @returns 时间格式字符串
 */
export function parseDatePath(): string {
  return format(new Date(), 'yyyy/MM/dd', { locale: zhCN });
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
  const diff: number = differenceInSeconds(endDate, startDate, {
    roundingMethod: 'ceil',
  });
  if (Number.isNaN(diff)) return false;
  return diff < interval;
}
