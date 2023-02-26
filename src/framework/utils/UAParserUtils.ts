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
