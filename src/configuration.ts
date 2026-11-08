import {
  Configuration,
  App,
  CommonJSFileDetector,
} from '@midwayjs/core';
// 核心服务
import * as koa from '@midwayjs/koa';
import * as validation from '@midwayjs/validation';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as busboy from '@midwayjs/busboy';
import * as staticFile from '@midwayjs/static-file';
import * as crossDomain from '@midwayjs/cross-domain';
import * as security from '@midwayjs/security';
// 配置文件
import * as DefaultConfig from './config/config.default';
import * as LocalConfig from './config/config.local';
import * as UnittestConfig from './config/config.unittest';
import * as dotenv from 'dotenv';
dotenv.config();
// 工具函数
import { checkDirPathExists } from './internal/shared/file/utils';
import { ReportMiddleware } from './internal/web/middleware/report';
import { ErrorCatchFilters } from './internal/web/middleware/error_filter';
import { JobConfiguration } from './modules/job/job';
import { SystemConfiguration } from './modules/system/system';

@Configuration({
  imports: [
    koa, // 核心程序服务
    validation, // 参数校验
    security, // 安全
    crossDomain, // 跨域
    busboy, // 文件上传
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis, // 缓存数据Redis
    JobConfiguration, // 调度任务模块
    SystemConfiguration, // 系统模块
  ],
  detector: new CommonJSFileDetector({ conflictCheck: false }),
  importConfigs: [
    {
      default: DefaultConfig,
      local: LocalConfig,
      unittest: UnittestConfig,
    },
  ],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  /**
   * 在依赖注入容器 ready 的时候执行
   */
  async onReady(): Promise<void> {
    // 注册中间件
    this.app.useMiddleware([ReportMiddleware as any]);
    // 注册捕获异常处理器
    this.app.useFilter(ErrorCatchFilters);
  }

  /**
   * 在应用服务启动后执行
   */
  async onServerReady(): Promise<void> {
    // 读取静态文件配置目录检查并初始创建目录
    const staticDir: string = this.app.getConfig('staticFile.dirs.default.dir');
    const uploadDir: string = this.app.getConfig('staticFile.dirs.upload.dir');
    await checkDirPathExists(staticDir);
    await checkDirPathExists(uploadDir);
    // 记录程序开始运行的时间点
    this.app.setAttr('runTime', Date.now());
    // 输出当前服务环境运行配置
    this.app.getLogger().warn('当前服务环境运行配置 => %s', this.app.getEnv());
  }
}
