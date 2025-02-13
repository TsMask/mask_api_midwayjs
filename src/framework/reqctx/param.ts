import { type Context } from '@midwayjs/koa';

import { clientIP, realAddressByIp } from '../ip2region/ip2region';
import { uaInfo } from '../utils/ua/ua';

/**
 * 解析ip地址
 * @param c 上下文对象
 * @returns [ip地址, 地理位置]
 */
export async function ipaddrLocation(c: Context): Promise<[string, string]> {
  const ipaddr = clientIP(c.ip);
  const location = await realAddressByIp(ipaddr);
  return [ipaddr, location];
}

/**
 * 解析请求用户代理信息
 * @param c 上下文对象
 * @returns [操作系统, 浏览器]
 */
export async function uaOsBrowser(c: Context): Promise<[string, string]> {
  const ua = uaInfo(c.get('user-agent'));
  const oName = ua.getOS().name;
  const oVersion = ua.getOS().version;
  let os = '-';
  if (oName && oVersion) {
    os = `${oName} ${oVersion}`;
  }
  const bName = ua.getBrowser().name;
  const bVersion = ua.getBrowser().version;
  let browser = '-';
  if (bName && bVersion) {
    browser = `${bName} ${bVersion}`;
  }
  return [os, browser];
}
