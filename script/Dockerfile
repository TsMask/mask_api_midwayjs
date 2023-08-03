FROM node:18-alpine

RUN npm config set registry https://registry.npmmirror.com

ENV TZ="Asia/Shanghai"

## 工作目录存放程序源码
WORKDIR /home/mask_api_midwayjs

## 复制实际需要的文件到工作目录
COPY ./assets ./assets
COPY ./src ./src
COPY ./bootstrap.js ./
COPY ./package.json ./
COPY ./tsconfig.json ./

## 使用pm2启动需要安装为全局依赖
RUN npm install pm2 -g

## 安装程序依赖，需要编译
RUN npm install

## 进行源码编译
RUN npm run build

## 暴露端口要与程序端口一致
EXPOSE 6275

## 程序启动命令
CMD ["npm", "run", "start:docker"]
