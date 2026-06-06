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
- `monitor` — 监控（定时任务、操作日志、在线用户、缓存）
- `common` — 公共接口（文件上传、通用查询）
- `demo` — 示例模块

### 框架层 (`src/framework/`)

存放与业务无关的基础设施代码：

- `middleware/` — 全局中间件：`ReportMiddleware`（请求日志）、`AuthorizeUserMiddleware`（鉴权）、`OperateLogMiddleware`（操作日志）、`RepeatSubmitMiddleware`（防重复提交）
- `catch/` — 全局异常过滤器 `ErrorCatchFilters`，统一处理 404、参数校验、业务异常
- `resp/` — 统一响应格式：`Resp.ok()` / `Resp.okData(data)` / `Resp.errMsg(msg)`，状态码见 `code.ts`
- `token/` — JWT 令牌签发与验证（HS512 算法，access + refresh 双令牌）
- `reqctx/auth` — 请求上下文获取当前登录用户信息（`loginUserToUserID`、`loginUserToDataScopeSQL` 等）
- `utils/` — 工具函数（加解密、日期、文件操作、正则校验、ID 生成、IP 归属地等）
- `constants/` — 常量定义（缓存 key、菜单类型、角色权限、令牌前缀等）

## 编码约定

### 控制器模式

```typescript
@Controller('/system/user')
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
