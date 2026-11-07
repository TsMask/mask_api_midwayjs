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
import * as systeminformation from 'systeminformation';
import type { Systeminformation } from 'systeminformation';

import {
  Inject,
  Provide,
  Singleton,
  MidwayInformationService,
  App,
} from '@midwayjs/core';
import type { Application } from '@midwayjs/koa';

import { parseDateToStr } from '../../../internal/shared/date/date';
import { parseBit } from '../../../internal/shared/parse/parse';

/**服务器系统相关信息 服务层处理 */
@Provide()
@Singleton()
export class SystemInfoService {
  private cachedOsInfo?: Systeminformation.OsData;
  private cachedCpuInfo?: Systeminformation.CpuData;

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
      app_dir: this.app.getAppDir(),
      env: this.app.getEnv(),
      name: pkg.name || '-',
      version: pkg.version || '-',
    };
  }

  /**系统信息 */
  public async systemInfo(): Promise<Record<string, any>> {
    let osInfo = this.cachedOsInfo;
    let timeInfo: Systeminformation.TimeData | undefined;
    if (!osInfo) {
      try {
        const [info, time] = await Promise.all([
          systeminformation.osInfo(),
          systeminformation.time(),
        ]);
        osInfo = info;
        this.cachedOsInfo = info;
        timeInfo = time;
      } catch {
        console.warn('Failed to get system info');
      }
    }
    if (!timeInfo) {
      try {
        timeInfo = await systeminformation.time();
      } catch {
        timeInfo = undefined;
      }
    }
    const runTime: number = this.app.getAttr('runTime');
    return {
      platform: osInfo?.platform || platform(),
      platform_version: osInfo?.distro || type(),
      arch: osInfo?.arch || arch(),
      arch_version: osInfo?.kernel || release(),
      os: osInfo?.release || version(),
      hostname: osInfo?.hostname || hostname(),
      boot_time: Math.ceil(timeInfo?.uptime ?? uptime()),
      process_id: process.pid,
      run_arch: process.arch,
      run_version: process.version,
      run_time: Math.ceil((Date.now() - runTime) / 1000),
      home_dir: homedir(),
      cmd: process.cwd(),
      exec_command: ([] as string[])
        .concat(process.argv, process.execArgv)
        .join(' '),
    };
  }

  /**系统时间信息 */
  public async timeInfo(): Promise<Record<string, string>> {
    const now = new Date();
    // 获取当前时间
    const current = parseDateToStr(now);
    let timezone = '';
    let timezone_name = '';
    try {
      const time = await systeminformation.time();
      timezone = time.timezone;
      timezone_name = time.timezoneName;
    } catch {
      const t = now.toString().split(' ');
      if (t.length >= 7) {
        timezone = t[5];
        timezone_name = t
          .slice(6)
          .join(' ')
          .replace(/\(/g, '')
          .replace(/\)/g, '');
      }
    }
    return { current, timezone, timezone_name };
  }

  /**内存信息 */
  public async memoryInfo(): Promise<Record<string, string>> {
    const memory = process.memoryUsage();
    let total = totalmem();
    let available = freemem();
    try {
      const memInfo = await systeminformation.mem();
      total = memInfo.total;
      available = memInfo.available;
    } catch {
      console.warn('Failed to get memory info');
    }
    return {
      usage: total > 0 ? ((1 - available / total) * 100).toFixed(2) : '0.00',
      freemem: parseBit(available),
      totalmem: parseBit(total), // 总内存大小（GB）
      rss: parseBit(memory.rss), // 常驻内存大小（RSS）
      heap_total: parseBit(memory.heapTotal), // 堆总大小
      heap_used: parseBit(memory.heapUsed), // 堆已使用大小
      external: parseBit(memory.external), // 外部内存大小（非堆）
    };
  }

  /**CPU信息 */
  public async cpuInfo(): Promise<Record<string, any>> {
    let model = '-';
    let speed = '-';
    let core = 0;
    const used: string[] = [];
    try {
      const [info, currentLoad] = await Promise.all([
        this.cachedCpuInfo
          ? Promise.resolve(this.cachedCpuInfo)
          : systeminformation.cpu(),
        systeminformation.currentLoad(),
      ]);
      const cpuInfo = info;
      this.cachedCpuInfo = info;
      core = cpuInfo.cores || currentLoad.cpus.length;
      model = cpuInfo.brand.trim();
      speed =
        cpuInfo.speed > 0 ? `${Math.round(cpuInfo.speed * 1000)}MHz` : '-';
      used.push(
        ...currentLoad.cpus.map((item: { load: number }) =>
          item.load.toFixed(2)
        )
      );
    } catch {
      console.warn('Failed to get cpu info');
      const cpuInfo = cpus();
      if (cpuInfo.length > 0 && cpuInfo[0]) {
        core = cpuInfo.length;
        speed = `${cpuInfo[0].speed}MHz`;
        model = cpuInfo[0].model.trim();
      }
      for (const item of cpuInfo) {
        const v = item.times;
        const value = v.idle + v.user + v.nice + v.sys + v.irq;
        used.push(Number((1 - v.idle / value) * 100).toFixed(2));
      }
    }

    return {
      model: model,
      speed: speed,
      core: core,
      core_used: used,
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
      for (const v of addrs!) {
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
    try {
      const disks = await systeminformation.fsSize();
      return disks.map(disk => ({
        size: parseBit(disk.size),
        used: parseBit(disk.used),
        avail: parseBit(disk.available),
        percent: disk.use.toFixed(2),
        target: disk.mount || disk.fs,
      }));
    } catch {
      console.warn('Failed to get disk info');
      return [];
    }
  }
}
