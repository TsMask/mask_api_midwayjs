// 依赖来源 https://github.com/faisalman/ua-parser-js
import UAParser = require('ua-parser-js');

/**
 * 获取ua信息
 * @param ua 请求头 user-agent
 * @returns 信息对象
 */
export function getUaInfo(ua: string) {
  return new UAParser(ua);
}

/**
 * 获取浏览器信息
 * @param ua 请求头 user-agent
 * @returns 信息对象
 */
export function getUaBrowser(ua: string) {
  const uaParser = new UAParser(ua);
  return uaParser.getBrowser();
}

/**
 * 获取系统信息
 * @param ua 请求头 user-agent
 * @returns 信息对象
 */
export function getUaOS(ua: string) {
  const uaParser = new UAParser(ua);
  return uaParser.getOS();
}
