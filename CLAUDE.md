# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Midwayjs v4 的管理系统后端 API 服务，从 RuoYi-Vue (Java Spring Boot) 重构为 Node.js 版本。使用 Koa 作为 HTTP 框架，TypeORM 操作 MySQL，Redis 做缓存，BullMQ 做任务队列。

**Node 版本要求:** >=24.0.0

## 常用命令

```bash
npm run dev          # 开发模式（watch + 自动重启）
npm run build        # TypeScript 编译到 dist/
npm run test         # 运行 Jest 测试（NODE_ENV=unittest）
npm run cov          # 测试覆盖率报告
npm run lint         # mwts lint 检查
npm run lint:fix     # mwts lint 自动修复
npm start            # 生产模式启动
```

运行单个测试文件：`npx jest test/utils/DateUtils.test.ts`

## 架构分层

项目采用 **四层架构**，遵循 Midwayjs 的依赖注入模式：

```text
modules/
  └── <模块名>/
      ├── controller/   # 路由处理，@Controller 装饰器
      ├── service/      # 业务逻辑，@Inject 注入依赖
      ├── repository/   # 数据访问层，TypeORM Repository
      ├── model/        # 实体模型和 DTO
      └── vo/           # 视图对象（返回给前端的数据结构）
```

### 业务模块

- `auth` — 认证（登录、注册、验证码）
- `system` — 系统管理（用户、角色、菜单、部门、岗位、字典、参数、通知）
- `monitor` — 监控（操作日志、在线用户、缓存）
- `job` — 调度任务（任务、任务日志、BullMQ 处理器）
- `common` — 公共接口（文件上传、通用查询）
- `demo` — 示例模块

### 框架层 (src/internal/)

存放与业务无关的基础设施代码，目录结构按 Go 版本同步：

- config/ — 全局配置类型定义（config.ts）
- infra/cache/ — Redis 缓存读写封装；infra/database/ — TypeORM 数据源绑定；infra/cron/ — 基于 @midwayjs/bullmq 的定时任务封装（队列注册、Job Scheduler 定时调度、单次执行与执行日志回调）；infra/ip2region/ — IP 地址归属解析
- shared/constants/ — 常量定义；shared/crypto/ — 加密/哈希/密码处理；shared/file/ — 文件上下文、csv/excel、上传、静态资源路径；shared/parse/ 解析；shared/regular/ 正则；shared/date/ 日期；shared/generate/ ID 生成
- web/middleware/ — HTTP 中间件：ReportMiddleware、AuthorizeUserMiddleware、OperateLogMiddleware、RepeatSubmitMiddleware、RateLimitMiddleware，以及全局错误过滤器 ErrorCatch、ValidateError、NotFound（通过 error_filter.ts 聚合导出）
- web/reqctx/ — 请求上下文：loginUserToUserID、loginUserToDataScopeSQL、authorization、isSystemUser、uaOsBrowser 等
- web/resp/ — 统一响应格式：Resp.ok() / Resp.okData(data) / Resp.errMsg(msg)
- web/token/ — JWT 令牌签发与校验（HS512 算法，access + refresh 双令牌）

## 编码约定

### 控制器模式

```typescript
@Controller('/system/users')
export class SysUserController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private sysUserService: SysUserService;

  @Get('/list')
  async list() {
    // 业务逻辑
    return Resp.okData(data);
  }
}
```

- 路由参数用 `@Param`、`@Query`、`@Body` 装饰器
- 请求头通过 `this.c.header('xxx')` 获取
- 中间件通过装饰器按需挂载：`@Middleware(AuthorizeUserMiddleware)`、`@Middleware(OperateLogMiddleware)`

### 配置体系

环境配置文件在 `src/config/`：

- `config.default.ts` — 基础配置（数据库、Redis、JWT、文件上传等），导出函数接收 `MidwayAppInfo`
- `config.local.ts` — 本地开发覆盖
- `config.unittest.ts` — 测试环境配置
- `config.prod.ts` — 生产环境配置

环境变量通过 `.env` 文件注入（参考 `.env.example`），在配置中用 `process.env.XXX` 读取。

### 测试

- 测试文件放在 `test/` 目录，命名 `*.test.ts`
- 使用 Jest + ts-jest，`NODE_ENV=unittest` 加载测试配置
- 目前仅 `test/utils/` 下有工具函数的单元测试

## 关键技术点

- **依赖注入**：所有 Controller、Service、Repository 均通过 Midwayjs 装饰器管理（`@Controller`、`@Service`、`@Inject`、`@Provide`）
- **TypeORM 实体**：在 `modules/*/model/` 下定义，通过 `src/typings/entities.ts` 统一注册扫描
- **参数校验**：Joi + `@Valid` 装饰器，校验失败返回 422 状态码
- **静态资源**：文件上传和静态文件目录在项目根目录的 `../mask_file/` 下（由配置生成），不在项目仓库内
- **数据库**：MySQL 8.0，SQL 脚本在 `script/` 目录
- **部署**：Docker + PM2 集群模式，服务端口 6275，`script/` 下有 Dockerfile 和 docker-compose.yaml
