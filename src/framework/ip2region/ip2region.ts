// 依赖来源 https://gitee.com/lionsoul/ip2region

// 读取xdb工具包
import { loadContentFromFile, newWithBuffer } from './binding';
import { resolve } from 'node:path';
// 指定ip2region数据文件路径
const dbPath = resolve(__dirname, '../../assets/ip2region.xdb');
// 读取文件Buffer缓存
const ip2regionBuffer = loadContentFromFile(dbPath);
// 检索实例
const searcher = newWithBuffer(ip2regionBuffer);
// 网络地址(内网)
const LOCAT_HOST = '127.0.0.1';

/**
 * 查询IP所在地
 * @param ip ip地址 218.4.167.70
 * @returns 返回结果 国家|区域|省份|城市|ISP
 * {"region":"中国|0|江苏省|苏州市|电信","ioCount":0,"took":326.8}
 */
export async function regionSearchByIp(ip: string): Promise<{
  region: string;
  ioCount: number;
  took: number;
}> {
  let data = { region: '0|0|0|0|0', ioCount: 0, took: 0 };
  ip = clientIP(ip);
  if (ip === LOCAT_HOST) {
    data.region = '0|0|0|内网IP|内网IP';
  }
  try {
    data = await searcher.search(ip);
  } catch (e) {
    console.error('failed to RegionSearchByIp err =>', e.message);
  }
  return data;
}

/**
 * 获取地址IP所在地
 * @param ip ip地址 218.4.167.70
 * @returns 返回结果 江苏省 苏州市
 */
export async function realAddressByIp(ip: string): Promise<string> {
  ip = clientIP(ip);
  if (ip === LOCAT_HOST) {
    return '内网IP';
  }
  try {
    const { region } = await searcher.search(ip);
    if (region) {
      const [, , province, city] = region.split('|');
      if (province === '0' && city === '0') {
        return '未知';
      }
      if (province === '0' && city !== '0') {
        return city;
      }
      return `${province} ${city}`;
    }
  } catch (e) {
    console.error('failed to RealAddressByIp err =>', e.message);
  }
  // 未知IP
  return '未知';
}

/**
 * 处理客户端IP地址显示iPv4
 * @param ip 上下文ip地址 ::1 127.0.0.1
 * @returns 返回结果 iPv4
 */
export function clientIP(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === LOCAT_HOST || ip === '::1') {
    return LOCAT_HOST;
  }
  return ip;
}
