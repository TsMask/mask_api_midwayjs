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

> **账号/密码**  
> **管理员**：maskAdmin/Admin@1234  
> **普通人员**：maskUser/User@1234  

## Docker 部署

- `Dockerfile` 构建Docker镜像脚本文件
