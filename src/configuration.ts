import { Configuration, App, Inject } from '@midwayjs/decorator';
import * as koa from '@midwayjs/koa';
import * as task from '@midwayjs/task';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as staticFile from '@midwayjs/static-file';
import * as info from '@midwayjs/info';
import * as swagger from '@midwayjs/swagger';
import * as jwt from '@midwayjs/jwt';
import { join } from 'path';
import { DefaultErrorFilter } from './framework/filter/DefaultErrorFilter';
import { NotFoundErrorFilter } from './framework/filter/NotFoundErrorFilter';
import { UnauthorizedErrorFilter } from './framework/filter/UnauthorizedErrorFilter';
import { ReportMiddleware } from './framework/middleware/ReportMiddleware';
import { MidwayDecoratorService } from '@midwayjs/core';
import {
  DECORATOR_AUTH_TOKEN_KEY,
  AuthTokenVerify,
} from './framework/decorator/AuthTokenDecorator';
import { ForbiddenErrorFilter } from './framework/filter/ForbiddenErrorFilter';

@Configuration({
  imports: [
    koa, // 核心程序服务
    task, // 任务调度
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis, // 缓存数据Redis
    jwt, // 鉴权和校验token
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

  async onReady() {
    this.app.getLogger().warn('配置环境 => %s', this.app.getEnv());
    // add middleware 添加使用中间件
    this.app.useMiddleware([ReportMiddleware]);
    // add filter 添加使用错误过滤器
    this.app.useFilter([
      NotFoundErrorFilter,
      ForbiddenErrorFilter,
      UnauthorizedErrorFilter,
      DefaultErrorFilter,
    ]);
    // 注册实现的方法装饰器-授权认证
    this.decoratorService.registerMethodHandler(
      DECORATOR_AUTH_TOKEN_KEY,
      AuthTokenVerify
    );
  }
}
