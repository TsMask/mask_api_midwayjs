FROM node:18-alpine

WORKDIR /app

ENV TZ="Asia/Shanghai"

COPY . .

## 使用pm2启动需要安装为全局依赖
#RUN npm install pm2 -g --registry=https://registry.npmmirror.com

## 如果各公司有自己的私有源，可以替换registry地址
## 腾讯源 http://mirrors.cloud.tencent.com/npm/
## 淘宝源 https://registry.npmmirror.com
## 华为源 https://mirrors.huaweicloud.com/repository/npm/
RUN npm install --registry=https://registry.npmmirror.com

RUN npm run build

## 如果端口更换，这边可以更新一下
EXPOSE 6275

## 一般启动
CMD ["npm", "run", "start"]
## 使用pm2启动
#CMD ["NODE_ENV=production", "pm2-runtime", "start", "./bootstrap.js", "--name", "midway_app", "-i", "4"]

# 编译
# docker build -t midway_app .

# 运行
# docker run -itd -p 7001:6275 midway_app