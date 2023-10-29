import { Inject, Provide, Singleton } from '@midwayjs/decorator';
import { diskinfo } from '@dropb/diskinfo';
import { MidwayInformationService, App } from '@midwayjs/core';
import { Application } from '@midwayjs/koa';
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
} from 'os';
import { parseDateToStr } from '../../../../framework/utils/DateUtils';
import { parseBit } from '../../../../framework/utils/ValueParseUtils';
import { ISystemInfoService } from '../ISystemInfoService';

/**
 * 服务器系统相关信息 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SystemInfoServiceImpl implements ISystemInfoService {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  @App()
  private app: Application;

  /**
   * 获取程序项目信息
   * @returns 程序项目信息对象
   */
  getProjectInfo(): ProjectInfoType {
    const pkg = this.midwayInformationService.getPkg();
    return {
      appDir: this.app.getAppDir(),
      env: this.app.getEnv(),
      name: pkg.name || '',
      version: pkg.version || '',
      dependencies: pkg.dependencies || {},
    };
  }

  /**
   * 获取系统信息
   * @returns 系统信息对象
   */
  getSystemInfo(): SystemInfoType {
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

  /**
   * 获取系统时间信息
   * @returns 系统时间信息对象
   */
  getTimeInfo(): TimeInfoType {
    const now = new Date();
    const t = now.toString().split(' ');
    return {
      current: parseDateToStr(now),
      timezone: t.length >= 7 ? t[5] : '',
      timezoneName:
        t.length >= 7
          ? t.slice(6).join(' ').replace(/\(/g, '').replace(/\)/g, '')
          : '',
    };
  }

  /**
   * 获取内存信息
   * @returns 内存信息对象
   */
  getMemoryInfo(): MemoryInfoType {
    const memory = process.memoryUsage();
    const total = totalmem();
    const free = freemem();
    return {
      usage: ((1 - free / total) * 100).toFixed(2),
      freemem: parseBit(free),
      totalmem: parseBit(total),
      rss: parseBit(memory.rss),
      heapTotal: parseBit(memory.heapTotal),
      heapUsed: parseBit(memory.heapUsed),
      external: parseBit(memory.external),
    };
  }

  /**
   * 获取CPU信息
   * @returns CPU信息对象
   */
  getCPUInfo(): CPUInfoType {
    const cpu = cpus();
    const model = cpu[0] ? cpu[0].model.trim() : '未知';
    const speed = cpu[0] ? `${cpu[0].speed}MHz` : '未知';
    const core = cpu.length;
    const coreUsed = cpu.map(cpuInfo => {
      const times = cpuInfo.times;
      const value =
        times.idle + times.user + times.nice + times.sys + times.irq;
      return Number((1 - times.idle / value) * 100).toFixed(2);
    });
    return {
      model: model,
      speed: speed,
      core: core,
      coreUsed,
    };
  }

  /**
   * 获取网络信息
   * @returns 网络信息对象
   */
  getNetworkInfo(): Record<string, any> {
    const net = networkInterfaces();
    return Object.keys(net).reduce((pre, type) => {
      const netItemList = net[type];
      let newType = type;
      if (type[type.length - 1] === '0') {
        newType = type.slice(0, -1);
        newType = newType.trim();
      }
      // ignore localhost
      if (newType === 'lo') {
        return pre;
      }
      // 过滤地址
      const addrs: string[] = [];
      for (const item of netItemList) {
        if (item.family === 'IPv6' && item.address.includes('::')) {
          addrs.push('IPv6 ' + item.address);
        }
        if (item.family === 'IPv4' && item.address.includes('.')) {
          addrs.push('IPv4 ' + item.address);
        }
      }
      pre[newType] = addrs.join(' / ');
      return pre;
    }, {});
  }

  /**
   * 获取磁盘信息
   * @returns 磁盘信息列表
   */
  async getDiskInfo(): Promise<DiskInfoType[]> {
    const disks = await diskinfo();
    const diskInfos = disks.map(disk => {
      return {
        size: parseBit(disk.size),
        used: parseBit(disk.used),
        avail: parseBit(disk.avail),
        pcent: disk.pcent,
        target: disk.target,
      };
    });
    return diskInfos;
  }
}
