// 依赖来源 https://github.com/faisalman/ua-parser-js
import ua = require('ua-parser-js');

/**
 * 获取ua信息
 * @param ua 请求头 user-agent
 * @returns 信息对象
 */
export function getUaInfo(useragent: string) {
  return new ua.UAParser(useragent);
}
