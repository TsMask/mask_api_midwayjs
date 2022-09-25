import { Configuration, App } from '@midwayjs/decorator';
import * as koa from '@midwayjs/koa';
import * as task from '@midwayjs/task';
import * as typeorm from '@midwayjs/typeorm';
import * as redis from '@midwayjs/redis';
import * as staticFile from '@midwayjs/static-file';
import * as info from '@midwayjs/info';
import * as swagger from '@midwayjs/swagger';
import { join } from 'path';
import { DefaultErrorFilter } from './framework/filter/default.filter';
import { NotFoundFilter } from './framework/filter/notfound.filter';
import { ReportMiddleware } from './framework/middleware/report.middleware';
import { TokenMiddleware } from './framework/middleware/token.middleware';
import { UnauthorizedFilter } from './framework/filter/unauthorized.filter';

@Configuration({
  imports: [
    koa, // 核心程序服务
    task, // 任务调度
    staticFile, // 静态文件映射
    typeorm, // 数据库ORM
    redis,
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

  async onReady() {
    this.app.getLogger().warn('配置环境 => %s', this.app.getEnv());
    // add middleware 添加使用中间件
    this.app.useMiddleware([TokenMiddleware, ReportMiddleware]);
    // add filter 添加使用错误过滤器
    this.app.useFilter([
      NotFoundFilter,
      UnauthorizedFilter,
      DefaultErrorFilter,
    ]);
  }
}
