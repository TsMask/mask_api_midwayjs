import { Configuration, App, Inject } from '@midwayjs/decorator';
import * as koa from '@midwayjs/koa';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as staticFile from '@midwayjs/static-file';
import * as info from '@midwayjs/info';
import * as swagger from '@midwayjs/swagger';
import * as jwt from '@midwayjs/jwt';
import * as upload from '@midwayjs/upload';
import * as bull from '@midwayjs/bull';
import { join } from 'path';
import { DefaultErrorFilter } from './framework/filter/DefaultErrorFilter';
import { ForbiddenErrorFilter } from './framework/filter/ForbiddenErrorFilter';
import { NotFoundErrorFilter } from './framework/filter/NotFoundErrorFilter';
import { UnauthorizedErrorFilter } from './framework/filter/UnauthorizedErrorFilter';
import { ReportMiddleware } from './framework/middleware/ReportMiddleware';
import { MidwayDecoratorService } from '@midwayjs/core';
import {
  DECORATOR_PRE_AUTHORIZE_KEY,
  PreAuthorizeVerify,
} from './framework/decorator/PreAuthorizeDecorator';
import {
  DECORATOR_OPER_LOG_KEY,
  OperLogSave,
} from './framework/decorator/OperLogDecorator';
import {
  DECORATOR_RATE_LIMIT_KEY,
  RateLimitVerify,
} from './framework/decorator/RateLimitDecorator';
import {
  DECORATOR_REPEAT_SUBMIT_KEY,
  RepeatSubmitVerify,
} from './framework/decorator/RepeatSubmitDecorator';

@Configuration({
  imports: [
    koa, // 核心程序服务
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis, // 缓存数据Redis
    jwt, // 鉴权和校验Token
    upload, // 文件上传
    bull, // 任务队列Bull
    {
      component: info, // 程序部署信息 /_info
      enabledEnvironment: ['local'], // 声明使用环境
    },
    {
      component: swagger, // 程序接口文档 /swagger-ui/index.html
      enabledEnvironment: ['local'], // 声明使用环境
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class ContainerLifeCycle {
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
      DECORATOR_PRE_AUTHORIZE_KEY,
      PreAuthorizeVerify
    );
    // 访问操作日志记录-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_OPER_LOG_KEY,
      OperLogSave
    );
    // 限流-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_RATE_LIMIT_KEY,
      RateLimitVerify
    );
    // 防止表单重复提交-方法装饰器
    this.decoratorService.registerMethodHandler(
      DECORATOR_REPEAT_SUBMIT_KEY,
      RepeatSubmitVerify
    );
  }

  /**
   * 在应用服务启动后执行
   */
  async onServerReady(): Promise<void> {
    this.app.getLogger().warn('当期服务环境运行配置 => %s', this.app.getEnv());
  }
}
