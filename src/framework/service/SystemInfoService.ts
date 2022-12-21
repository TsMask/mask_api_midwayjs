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
import { parseBit } from '../../common/utils/ValueParseUtils';
import { parseDateToStr } from '../../common/utils/DateFnsUtils';
import ms = require('ms');

/**
 * 服务器相关信息
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
  getProjectInfo(): projectInfo {
    const pkg = this.midwayInformationService.getPkg();
    return {
      appDir: this.midwayInformationService.getAppDir(),
      env: this.environment.getCurrentEnvironment(),
      name: this.midwayInformationService.getProjectName(),
      version: pkg.version || '',
      dependencies: pkg.dependencies || {},
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
   * 获取系统信息
   * @returns 系统信息对象
   */
  getSystemInfo(): systemInfo {
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
  getTimeInfo(): timeInfo {
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
  getMemoryInfo(): memoryInfo {
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
  getCPUInfo(): cpuInfo {
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
   * 获取磁盘信息
   * @returns 磁盘信息列表
   */
  async getDiskInfo(): Promise<diskInfo[]> {
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

/**项目信息 */
type projectInfo = {
  /**项目路径 */
  appDir: string;
  /**项目环境 */
  env: string;
  /**项目名称 */
  name: string;
  /**项目版本 */
  version: string;
  /**项目依赖 */
  dependencies: any;
};

/**系统信息 */
type systemInfo = {
  /**运行平台 */
  platform: string;
  /**Node版本 */
  node: string;
  /**V8版本 */
  v8: string;
  /**进程PID号 */
  processId: number;
  /**系统架构 */
  arch: string;
  /**系统平台 */
  uname: string;
  /**系统发行版本 */
  release: string;
  /**主机名称 */
  hostname: string;
  /**主机用户目录 */
  homeDir: string;
  /**项目路径 */
  cmd: string;
  /**执行命令 */
  execCommand: string;
};

/**时间信息 */
type timeInfo = {
  /**当期时间 */
  current: string;
  /**系统启动时间 */
  uptime: string;
  /**时区 */
  timezone: string;
  /**时区名称 */
  timezoneName: string;
};

/**内存信息 */
type memoryInfo = {
  /**内存使用率 */
  usage: string;
  /**系统剩余内存 */
  freemem: string;
  /**系统总内存 */
  totalmem: string;
  /**分配给进程总内存 */
  rss: string;
  /**堆总内存 */
  heapTotal: string;
  /**已分配堆内存 */
  heapUsed: string;
  /**系统链接库占用内存 */
  external: string;
};

/**CPU信息 */
type cpuInfo = {
  /**型号 */
  model: string;
  /**速率MHz */
  speed: string;
  /**核心 */
  core: number;
  /**核心使用率% */
  coreUsed: string[];
};

/**磁盘信息 */
type diskInfo = {
  /**总大小 */
  size: string;
  /**已使用大小 */
  used: string;
  /**剩余大小 */
  avail: string;
  /**空间使用率% */
  pcent: string;
  /**路径盘符 */
  target: string;
};
