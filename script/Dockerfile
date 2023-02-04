FROM node:18-alpine AS build

## 如果各公司有自己的私有源，可以替换registry地址
## 腾讯源 http://mirrors.cloud.tencent.com/npm/
## 淘宝源 https://registry.npmmirror.com
## 华为源 https://mirrors.huaweicloud.com/repository/npm/
RUN npm config set registry https://registry.npmmirror.com

ENV TZ="Asia/Shanghai"

## 工作目录存放程序源码
WORKDIR /home/mask_app

## 复制实际需要的文件到工作目录
COPY ./src ./src
COPY ./bootstrap.js ./
COPY ./package.json ./
COPY ./tsconfig.json ./

## 使用pm2启动需要安装为全局依赖
RUN npm install pm2 -g

## 安装程序依赖
RUN npm install

## 进行源码编译
RUN npm run build
RUN npm prune --production

## 暴露端口要与程序端口一致
EXPOSE 6275

## 程序启动命令
CMD ["npm", "run", "start:docker"]

# 编译成镜像
# docker build -t midway_api:1.0.0 .

# 运行镜像-link互联服务
# docker run -itd --name midway-serve --privileged=true --restart=always --link=mysql<Docker服务>:mysql --link=redis<Docker服务>:redis -v /home/<资源路径>:/home/mask -p <Docker定义端口>:6275 -m 396m midway_api:1.0.0

# 运行镜像-net网络服务
# docker run -itd --name midway-serve1 --privileged=true --restart=always -p <Docker定义端口>:6275 -m 396m -v /home/mask:/home/mask midway_api:1.0.0
