import { Configuration, App, Inject } from '@midwayjs/decorator';
import * as koa from '@midwayjs/koa';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as staticFile from '@midwayjs/static-file';
import * as jwt from '@midwayjs/jwt';
import * as upload from '@midwayjs/upload';
import * as bull from '@midwayjs/bull';
import * as crossDomain from '@midwayjs/cross-domain';
import { join } from 'path';
import { DefaultErrorFilter } from './framework/filter/DefaultErrorFilter';
import { ForbiddenErrorFilter } from './framework/filter/ForbiddenErrorFilter';
import { NotFoundErrorFilter } from './framework/filter/NotFoundErrorFilter';
import { UnauthorizedErrorFilter } from './framework/filter/UnauthorizedErrorFilter';
import { ReportMiddleware } from './framework/middleware/ReportMiddleware';
import { MidwayDecoratorService } from '@midwayjs/core';
import {
  DECORATOR_METHOD_PRE_AUTHORIZE_KEY,
  PreAuthorizeVerify,
} from './framework/decorator/PreAuthorizeMethodDecorator';
import {
  DECORATOR_METHOD_OPER_LOG_KEY,
  OperLogSave,
} from './framework/decorator/OperLogMethodDecorator';
import {
  DECORATOR_METHOD_RATE_LIMIT_KEY,
  RateLimitVerify,
} from './framework/decorator/RateLimitMethodDecorator';
import {
  DECORATOR_METHOD_REPEAT_SUBMIT_KEY,
  RepeatSubmitVerify,
} from './framework/decorator/RepeatSubmitMethodDecorator';
import { checkExistsAndMkdir } from './framework/utils/FileUtils';

@Configuration({
  imports: [
    koa, // 核心程序服务
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis, // 缓存数据Redis
    jwt, // 鉴权和校验Token
    upload, // 文件上传
    bull, // 任务队列Bull
    crossDomain, // 跨域cros
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App()
  app: koa.Application;

  @Inject()
  decoratorService: MidwayDecoratorService;

  /**
   * 在依赖注入容器 ready 的时候执行
   */
  async onReady(): Promise<void> {
    // add middleware 添加使用中间件
    this.app.useMiddleware([ReportMiddleware]);
    // add filter 添加使用错误过滤器
    this.app.useFilter([
      NotFoundErrorFilter,
      ForbiddenErrorFilter,
      UnauthorizedErrorFilter,
      DefaultErrorFilter,
    ]);
    // 用户身份授权认证校验-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_METHOD_PRE_AUTHORIZE_KEY,
      PreAuthorizeVerify
    );
    // 访问操作日志记录-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_METHOD_OPER_LOG_KEY,
      OperLogSave
    );
    // 限流-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_METHOD_RATE_LIMIT_KEY,
      RateLimitVerify
    );
    // 防止表单重复提交-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_METHOD_REPEAT_SUBMIT_KEY,
      RepeatSubmitVerify
    );
  }

  /**
   * 在应用服务启动后执行
   */
  async onServerReady(): Promise<void> {
    // 读取静态文件配置目录检查并初始创建目录
    const staticDir: string = this.app.getConfig('staticFile.dirs.default.dir');
    const uploadDir: string = this.app.getConfig('staticFile.dirs.upload.dir');
    await checkExistsAndMkdir(staticDir);
    await checkExistsAndMkdir(uploadDir);
    // 输出当期服务环境运行配置
    this.app.getLogger().warn('当期服务环境运行配置 => %s', this.app.getEnv());
  }
}
