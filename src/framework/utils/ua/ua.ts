// 依赖来源 https://github.com/faisalman/ua-parser-js
import { UAParser } from 'ua-parser-js';
/**
 * 获取user-agent信息
 * @param userAgent 请求头 user-agent
 * @returns 信息对象
 */
export function uaInfo(userAgent: string) {
  return new UAParser(userAgent);
}
