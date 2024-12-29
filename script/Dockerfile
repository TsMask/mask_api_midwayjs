FROM node:18-alpine

RUN npm config set registry https://registry.npmmirror.com

# 设置时区和语言环境
ENV TZ="Asia/Shanghai"
ENV LANG="en_US.UTF-8"

## 工作目录存放程序源码
WORKDIR /app

## 复制实际需要的文件到工作目录
COPY ./assets ./assets
COPY ./src ./src
COPY ./bootstrap.js ./
COPY ./package.json ./
COPY ./tsconfig.json ./

## 使用pm2启动需要安装为全局依赖，随后安装程序依赖
RUN npm install pm2 -g && npm install

## 源码编译，清除开发依赖
RUN npm run build && npm prune --omit=dev

## 暴露端口要与程序端口一致
EXPOSE 6275

## 程序启动命令
CMD ["npm", "run", "start:docker"]

# 构建 约817MB
# docker build -t mask_api:0.0.1 .
# docker run -it mask_api:0.0.1 sh
