import {
  uptime,
  platform,
  version,
  arch,
  type,
  release,
  hostname,
  homedir,
  totalmem,
  freemem,
  cpus,
  networkInterfaces,
} from 'node:os';

import {
  Inject,
  Provide,
  Singleton,
  MidwayInformationService,
  App,
} from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
import { diskinfo } from '@dropb/diskinfo';

import { parseDateToStr } from '../../../framework/utils/date/data';
import { parseBit } from '../../../framework/utils/parse/parse';

/**服务器系统相关信息 服务层处理 */
@Provide()
@Singleton()
export class SystemInfoService {
  /**内置的信息服务，提供基础的项目数据 */
  @Inject()
  private midwayInformationService: MidwayInformationService;

  /**主框架中的 app 对象 */
  @App('koa')
  private app: Application;

  /**程序项目信息 */
  public projectInfo(): Record<string, string> {
    const pkg = this.midwayInformationService.getPkg();
    return {
      appDir: this.app.getAppDir(),
      env: this.app.getEnv(),
      name: pkg.name || '-',
      version: pkg.version || '-',
    };
  }

  /**系统信息 */
  public systemInfo(): Record<string, any> {
    const runTime: number = this.app.getAttr('runTime');
    return {
      platform: platform(),
      platformVersion: type(),
      arch: arch(),
      archVersion: release(),
      os: version(),
      hostname: hostname(),
      bootTime: Math.ceil(uptime()),
      processId: process.pid,
      runArch: process.arch,
      runVersion: process.version,
      runTime: Math.ceil((Date.now() - runTime) / 1000),
      homeDir: homedir(),
      cmd: process.cwd(),
      execCommand: [].concat(process.argv, process.execArgv).join(' '),
    };
  }

  /**系统时间信息 */
  public timeInfo(): Record<string, string> {
    const now = new Date();
    const t = now.toString().split(' ');
    // 获取当前时间
    const current = parseDateToStr(now);
    // 获取时区
    let timezone = '';
    // 获取时区名称
    let timezoneName = '';
    if (t.length >= 7) {
      timezone = t[5];
      timezoneName = t.slice(6).join(' ').replace(/\(/g, '').replace(/\)/g, '');
    }
    return { current, timezone, timezoneName };
  }

  /**内存信息 */
  public memoryInfo(): Record<string, string> {
    const memory = process.memoryUsage();
    const total = totalmem();
    const free = freemem();
    return {
      usage: ((1 - free / total) * 100).toFixed(2), // 内存利用率
      freemem: parseBit(free), // 可用内存大小（GB）
      totalmem: parseBit(total), // 总内存大小（GB）
      rss: parseBit(memory.rss), // 常驻内存大小（RSS）
      heapTotal: parseBit(memory.heapTotal), // 堆总大小
      heapUsed: parseBit(memory.heapUsed), // 堆已使用大小
      external: parseBit(memory.external), // 外部内存大小（非堆）
    };
  }

  /**CPU信息 */
  public cpuInfo(): Record<string, any> {
    let model = '-';
    let speed = '-';
    let core = 0;
    const cpuInfo = cpus();
    if (cpuInfo.length > 0 && cpuInfo[0]) {
      core = cpuInfo.length;
      speed = `${cpuInfo[0].speed}MHz`;
      model = cpuInfo[0].model.trim();
    }

    const used: string[] = [];
    for (const item of cpuInfo) {
      const v = item.times;
      const value = v.idle + v.user + v.nice + v.sys + v.irq;
      used.push(Number((1 - v.idle / value) * 100).toFixed(2));
    }

    return {
      model: model,
      speed: speed,
      core: core,
      coreUsed: used,
    };
  }

  /**网络信息 */
  public networkInfo(): Record<string, string> {
    const ipAdders: Record<string, string> = {};
    const interfaces = networkInterfaces();
    for (const v of Object.keys(interfaces)) {
      let name = v;
      if (name[name.length - 1] === '0') {
        name = name.slice(0, -1);
        name = name.trim();
      }
      // ignore localhost
      if (
        name.startsWith('lo') ||
        name.startsWith('veth') ||
        name.startsWith('Loopback')
      ) {
        continue;
      }
      const arr: string[] = [];
      const addrs = interfaces[v];
      for (const v of addrs) {
        if (v.family === 'IPv6' && v.address.includes('::')) {
          arr.push('IPv6 ' + v.address);
        }
        if (v.family === 'IPv4' && v.address.includes('.')) {
          arr.push('IPv4 ' + v.address);
        }
      }
      ipAdders[v] = arr.join(' / ');
    }
    return ipAdders;
  }

  /**磁盘信息 */
  public async diskInfo(): Promise<Record<string, string>[]> {
    const disks = await diskinfo();
    const diskInfos = disks.map(disk => {
      return {
        size: parseBit(disk.size),
        used: parseBit(disk.used),
        avail: parseBit(disk.avail),
        percent: disk.pcent,
        target: disk.target,
      };
    });
    return diskInfos;
  }
}
