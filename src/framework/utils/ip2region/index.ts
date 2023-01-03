import { join } from 'path';
// 导入包
import { newWithFileOnly } from './ip2region';
// 指定ip2region数据文件路径
const dbPath = join(__dirname, './ip2region.xdb');

/**
 * 查询IP所在地
 * @param ip ip地址
 * @returns 返回结果 {region: '中国|0|江苏省|苏州市|电信', ioCount: 3, took: 1.342389}
 */
export async function getRegionSearchByIp(ip: string) {
  let data = { region: '0|0|0|0|0', ioCount: 0, took: 0 };
  try {
    // 创建searcher对象
    const searcher = newWithFileOnly(dbPath);
    // 查询
    data = await searcher.search(ip);
    // data: {region: '中国|0|江苏省|苏州市|电信', ioCount: 3, took: 1.342389}
  } catch (e) {
    console.error('getRegionSearchByIp err =>', e.message);
  }
  return data;
}

/**
 * 获取地址IP所在地
 * @param ip ip地址
 * @returns 返回结果 江苏省 苏州市
 */
export async function getRealAddressByIp(ip: string) {
  if (ip.includes('127.0.0.1')) return '内网IP';
  try {
    // 创建searcher对象
    const searcher = newWithFileOnly(dbPath);
    // 查询
    const data = await searcher.search(ip);
    if (data.region) {
      const region_arr = data.region.split('|');
      const province = region_arr[2] === '0' ? '未知' : region_arr[2];
      const city = region_arr[3] === '0' ? '未知' : region_arr[3];
      return `${province} ${city}`;
    }
  } catch (e) {
    console.error('getRealAddressByIp err =>', e.message);
  }
  // 未知IP
  return '未知IP';
}
