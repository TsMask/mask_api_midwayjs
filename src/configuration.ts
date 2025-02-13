import { posix } from 'node:path';

import {
  Configuration,
  App,
  Inject,
  MidwayDecoratorService,
} from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as staticFile from '@midwayjs/static-file';
import * as jwt from '@midwayjs/jwt';
import * as bull from '@midwayjs/bull';
import * as crossDomain from '@midwayjs/cross-domain';
import * as security from '@midwayjs/security';

import { checkDirPathExists } from './framework/utils/file/utils';
import { MethodDecorators } from './framework/decorator';
import { Middlewares } from './framework/middleware';
import { ErrorCatchFilters } from './framework/catch';

@Configuration({
  imports: [
    koa, // 核心程序服务
    validate, // 参数校验
    security, // 安全
    crossDomain, // 跨域
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis, // 缓存数据Redis
    jwt, // 鉴权和校验Token
    bull, // 任务队列Bull
  ],
  importConfigs: [posix.join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Inject()
  decoratorService: MidwayDecoratorService;

  /**
   * 在依赖注入容器 ready 的时候执行
   */
  async onReady(): Promise<void> {
    // 注册中间件
    this.app.useMiddleware(Middlewares);
    // 注册捕获异常处理器
    this.app.useFilter(ErrorCatchFilters);
    // 注册方法装饰器
    for (const { key, fn } of MethodDecorators) {
      this.decoratorService.registerMethodHandler(key, fn);
    }
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
    // 输出当期服务环境运行配置
    this.app.getLogger().warn('当期服务环境运行配置 => %s', this.app.getEnv());
  }
}
