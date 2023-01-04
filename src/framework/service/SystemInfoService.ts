import {
  hostname,
  homedir,
  type,
  release,
  cpus,
  networkInterfaces,
  uptime,
  freemem,
  totalmem,
} from 'os';
import {
  Inject,
  MidwayEnvironmentService,
  MidwayInformationService,
} from '@midwayjs/core';
import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { diskinfo } from '@dropb/diskinfo';
import { parseBit } from '../utils/ValueParseUtils';
import { parseDateToStr } from '../utils/DateFnsUtils';
import ms = require('ms');

/**
 * 服务器系统相关信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SystemInfoService {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  @Inject()
  private environment: MidwayEnvironmentService;

  /**
   * 获取程序项目信息
   * @returns 程序项目信息对象
   */
  getProjectInfo(): ProjectInfoType {
    const pkg = this.midwayInformationService.getPkg();
    return {
      appDir: this.midwayInformationService.getAppDir(),
      env: this.environment.getCurrentEnvironment(),
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
    return {
      platform: process.platform,
      node: process.versions.node,
      v8: process.versions.v8,
      processId: process.pid,
      arch: process.arch,
      uname: type(),
      release: release(),
      hostname: hostname(),
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
    const t = Date().toString().split(' ');
    return {
      current: parseDateToStr(new Date()),
      uptime: ms(uptime() * 1000),
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
      }
      // ignore localhost
      if (newType === 'lo') {
        return;
      }
      pre[newType] = netItemList
        .sort(item => {
          if (item.family === 'IPv4') {
            return -1;
          }
          return 1;
        })
        .map(netItem => {
          return `${netItem.family} ${netItem.address}`;
        })
        .join(' / ');
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
