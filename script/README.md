# 脚本与资源说明

本目录存放项目运行所需的数据库脚本、部署配置和构建相关文件。

## 目录结构

```text
script/
├── db_init.sql            # MySQL 数据库初始化（全量）
├── db_init_demo.sql       # Demo 模块数据表（可选导入）
├── Dockerfile             # 标准 Docker 镜像构建脚本
├── docker-compose.yaml    # 一键部署（应用 + MySQL + Redis）
└── README.md              # 本说明文件
```

## 初始化数据库

| 文件 | 说明 |
| ------ | ------ |
| db_init.sql | 初始化 MySQL 数据库，包含全部表结构和基础数据 |
| db_init_demo.sql | 初始化 demo 模块示例数据，不需要可不导入 |

默认账号/密码

| 角色 | 账号 | 密码 |
| ------ | ------ | ------ |
| 系统管理员 | system | Abcd@1234.. |
| 管理员 | admin | Abcd@1234.. |
| 普通人员 | user | Abcd@1234.. |

## 国内源

使用国内源可以加速下载依赖库：

- 腾讯源 <http://mirrors.cloud.tencent.com/npm/>
- 淘宝源 <https://registry.npmmirror.com>
- 华为源 <https://mirrors.huaweicloud.com/repository/npm/>

```shell
npm install --registry https://registry.npmmirror.com
```

## Docker 部署

### 标准构建

通过 `Dockerfile` 构建镜像，采用源码编译方式，内置 pm2 进程管理：

```shell
# 构建镜像
docker build -f script/Dockerfile -t mask_api:0.0.1 .

# 运行容器
docker run -d \
  --privileged=true \
  --restart=always \
  -p 8080:6275 \
  -e TZ="Asia/Shanghai" \
  -v <主机路径>/config.js:/app/dist/config/config.prod.js \
  -m 512M \
  --name mask_api \
  mask_api:0.0.1
```
