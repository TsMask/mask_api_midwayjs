# 程序可用脚本

## 国内源

使用国内源可以加速下载依赖库  

- 腾讯源 <http://mirrors.cloud.tencent.com/npm/>  
- 淘宝源 <https://registry.npmmirror.com>  
- 华为源 <https://mirrors.huaweicloud.com/repository/npm/>  

```shell
npm install --registry https://registry.npmmirror.com
```

## 初始化数据库

- `db_init.sql` 初始化MySQL数据库数据
- `db_init_demo.sql` 初始化demo模块数据表，不需要可不导入

> **账号/密码**  
> **系统管理员**：system/Abcd@1234..  
> **管理员**：admin/Abcd@1234..  
> **普通人员**：user/Abcd@1234..  

## Docker 部署

- `Dockerfile` 构建Docker镜像脚本文件

```shell
# 构建
docker build -t mask_api:0.0.1 .

# 启动
docker run -d \
--privileged=true \
--restart=always \
-p 8080:6275 \
-e TZ="Asia/Shanghai" \
-v <主机路径>/config.js:/app/dist/config/config.prod.js \
-m 512M \
--name mask_api_001 \
mask_api:0.0.1

```
