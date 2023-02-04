# 基于 Midwayjs 的管理系统后端接口服务

<p>
    <a target="_blank" href="http://www.midwayjs.org">
        <img src="https://img.shields.io/badge/Build-Midway-green.svg"  alt="Build Midwayjs">
    </a>
    <a target="_blank" href="https://nodejs.org">
        <img src="https://img.shields.io/badge/Build-Nodejs-green.svg" alt="Build Node">
    </a>
    <img src="https://img.shields.io/badge/Release-V0.0.5-orange.svg" alt="Release V0.0.5">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License MIT">
</p>  

## 介绍

项目选择 [RuoYi-Vue](https://gitee.com/y_project/RuoYi-Vue) 进行重构改造，基于 `Node` + `TypeScript` 的后端开发框架 `Midwayjs` 进行开发。

如需进一步了解框架，参见 [Midwayjs](http://www.midwayjs.org) 官方文档。

前端代码仓库地址 [mask_element_vue3](https://gitee.com/TsMask/mask_element_vue3)

> 有任何问题或者建议，可以在 [_Issues_](https://gitee.com/TsMask/mask_api_midwayjs/issues) 或通过QQ群：[_57242844_](https://jq.qq.com/?_wv=1027&k=z6Y4YQcB) 提给作者。  
> 如果觉得项目对您有帮助，可以来个Star ⭐

## 内置功能

1. 用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2. 部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。
3. 岗位管理：配置系统用户所属担任职务。
4. 菜单管理：配置系统菜单，操作权限，按钮权限标识等。
5. 角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6. 字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7. 参数管理：对系统动态配置常用参数。
8. 通知公告：系统通知公告信息发布维护。
9. 操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
10. 登录日志：系统登录日志记录查询包含登录异常。
11. 在线用户：当前系统中活跃用户状态监控。
12. 调度任务：在线（添加、修改、删除)任务调度包含执行结果日志。
13. 服务监控：监视当前系统CPU、内存、磁盘、堆栈等相关信息。
14. 缓存监控：对系统的缓存信息查询，命令统计等。

## 项目结构

```text
mask_api_midwayjs
├── script                      目录-程序所需的初始脚本
├── src                         目录-源代码
├   ├── assets                  目录-程序内部静态资源文件
├   ├── config                  目录-程序相关运行参数配置
├   ├── framework               目录-程序核心通用代码
├   ├── modules                 目录-业务模块
├   ├   ├── system              目录-系统内部接口模块
├   ├   ├   ├── controller      目录-接口路由控制层
├   ├   ├   ├── model           目录-数据对象模型层
├   ├   ├   ├── repository      目录-CURD数据存储层
├   ├   ├   ├── service         目录-业务逻辑服务层
├   ├   └── ...
├   ├── typings                 目录-程序通用类型定义
├   ├── configuration.ts        文件-程序框架启动入口
├   └──interface.ts             文件-程序通用接口函数自定义声明
├── test                        目录-测试单元
├── .editorconfig
├── .eslintrc.json
├── .gitignore
├── .prettierrc.js
├── bootstrap.js                文件-程序部署PM2启动运行入口
├── jest.config.js
├── LICENSE
├── package.json                文件-程序依赖及启动命令信息
├── README.en.md
├── README.md
└── tsconfig.json               文件-typescript配置
```

## 快速启动

你需要先安装准备 **开发环境** 后使用 **程序命令**

### 开发环境

| 技术 | 说明 | 版本 |
| ---- | ---- | ---- |
| Nodejs | node项目的运行环境 | 16+ |
| Redis | 缓存存储程序 | 6+ |
| Mysql | 数据存储程序 | 8+ |

需要使用 `db_init.sql` 文件初始化数据库数据，

> 管理员账号密码：admin/admin@1234  
> 普通人员账号密码：mask/mask@1234

### 程序命令

> 使用国内源可以加速下载依赖库  
> 腾讯源 <http://mirrors.cloud.tencent.com/npm/>  
> 淘宝源 <https://registry.npmmirror.com>  
> 华为源 <https://mirrors.huaweicloud.com/repository/npm/>  
> npm install --registry <https://registry.npmmirror.com>

#### 本地开发-Window/Liunx

```bash
npm install                 # 安装项目所需依赖
npm run dev                 # 开发模式启动项目
open http://localhost:6275  # 启动成功后得到服务访问地址
```

#### 生产部署-Liunx

```bash
npm install             # 安装项目所需依赖
npm run build           # 构建生产项目代码
npm prune --production  # 移除开发依赖
npm run start           # 窗口启动项目
npm run start:pm2       # PM2启动项目
```

更多部署信息请移步 [Midway-启动和部署](http://www.midwayjs.org/docs/deployment)。

#### 内置指令

- 使用 `npm run lint` 来做代码风格检查。
- 使用 `npm run lint:fix` 来做代码风格检查并修复格式。
- 使用 `npm run ci` 来做代码盖率信息检查。
- 使用 `npm run test` 来执行单元测试。

## MASK前后端分离交流群

[![加入QQ群](https://img.shields.io/badge/QQ群-57242844-blue.svg)](https://jq.qq.com/?_wv=1027&k=z6Y4YQcB)
