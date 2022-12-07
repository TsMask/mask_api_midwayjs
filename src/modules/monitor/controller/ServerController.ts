import { Controller, Get } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';

/**
 * 服务器监控
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/server')
export class ServerController {
  /**
   * 信息
   * @returns 返回结果
   */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:server:list'] })
  async list(): Promise<Result> {
    return Result.okData({
      cpu: {
        cpuNum: 4,
        total: 431500.0,
        sys: 18.08,
        used: 28.99,
        wait: 0.0,
        free: 50.01,
      },
      mem: { total: 7.91, used: 6.61, free: 1.31, usage: 83.49 },
      jvm: {
        total: 137.5,
        max: 1801.0,
        free: 63.94,
        version: '1.8.0_212',
        home: 'D:\\Program Files\\Java\\jdk1.8.0_212\\jre',
        name: 'Java HotSpot(TM) 64-Bit Server VM',
        startTime: '2022-10-22 15:08:41',
        usage: 53.5,
        used: 73.56,
        inputArgs:
          '[-XX:TieredStopAtLevel=1, -Xverify:none, -Dspring.output.ansi.enabled=always, -javaagent:D:\\Program Files\\ideaIU-2021.2.3\\lib\\idea_rt.jar=57529:D:\\Program Files\\ideaIU-2021.2.3\\bin, -Dcom.sun.management.jmxremote, -Dspring.jmx.enabled=true, -Dspring.liveBeansView.mbeanDomain, -Dspring.application.admin.enabled=true, -Dfile.encoding=UTF-8]',
        runTime: '0天12小时49分钟',
      },
      sys: {
        computerName: 'DESKTOP-UQH5H0Q',
        computerIp: '192.168.43.96',
        userDir: 'D:\\Projects\\IdeaProjects\\RuoYi-Vue',
        osName: 'Windows 10',
        osArch: 'amd64',
      },
      sysFiles: [
        {
          dirName: 'C:\\',
          sysTypeName: 'NTFS',
          typeName: '本地固定磁盘 (C:)',
          total: '97.4 GB',
          free: '11.1 GB',
          used: '86.3 GB',
          usage: 88.61,
        },
        {
          dirName: 'D:\\',
          sysTypeName: 'NTFS',
          typeName: '本地固定磁盘 (D:)',
          total: '140.5 GB',
          free: '31.6 GB',
          used: '108.9 GB',
          usage: 77.53,
        },
      ],
    });
  }
}
