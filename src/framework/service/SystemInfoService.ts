import {
  hostname,
  homedir,
  cpus,
  networkInterfaces,
  uptime,
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

/**内存信息 */
type memoryInfo = {
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

  projectInfo(): Record<string, string | number> {
    return {
      Project: this.midwayInformationService.getProjectName(),
      AppDir: this.midwayInformationService.getAppDir(),
      BaseDir: this.midwayInformationService.getBaseDir(),
      Root: this.midwayInformationService.getRoot(),
      Env: this.environment.getCurrentEnvironment(),
    };
  }

  getSystemInfo(): Record<string, string | number> {
    const _platform = process.platform;
    return {
      Platform: _platform === 'win32' ? 'Windows' : _platform,
      Node: process.versions.node,
      V8: process.versions.v8,
      ProcessId: process.pid,
      Arch: process.arch,
      Hostname: hostname(),
      HomeDir: homedir(),
      CWD: process.cwd(),
      ExecCommand: [].concat(process.argv, process.execArgv).join(' '),
    };
  }

  getTimeInfo(): Record<string, string | number> {
    const t = new Date().toString().split(' ');
    return {
      Current: Date.now(),
      Uptime: uptime(),
      Timezone: t.length >= 7 ? t[5] : '',
      TimezoneName:
        t.length >= 7
          ? t.slice(6).join(' ').replace(/\(/g, '').replace(/\)/g, '')
          : '',
    };
  }

  getDependenciesInfo(): Record<string, string | number> {
    const pkg = this.midwayInformationService.getPkg();
    const dependencies = pkg.dependencies || {};
    const info = {};
    Object.keys(dependencies).forEach(modName => {
      console.log(modName);
      // const modInfo = safeRequire(join(modName, 'package.json'), {});
      info[modName] = `${'Not Found'}(${dependencies[modName]})`;
    });
    return info;
  }

  getEnvInfo(): Record<string, string | number> {
    const env = {};
    Object.keys(process.env).forEach(envName => {
      env[envName] = process.env[envName];
      // env[envName] = this.filterSecretContent(envName, process.env[envName]);
    });
    return env;
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

  /**
   * 获取内存信息
   * @returns 内存信息对象
   */
  getMemoryInfo(): memoryInfo {
    const memory = process.memoryUsage();
    return {
      totalmem: parseBit(totalmem()),
      rss: parseBit(memory.rss),
      heapTotal: parseBit(memory.heapTotal),
      heapUsed: parseBit(memory.heapUsed),
      external: parseBit(memory.external),
    };
  }

  /**
   * 获取CPU信息
   * @returns 内存信息对象
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
          return {
            family: netItem.family,
            address: netItem.address,
          };
        });
      return pre;
    }, {});
  }
}
