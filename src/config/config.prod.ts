import { MidwayConfig } from '@midwayjs/core';

export default {
  // 核心服务配置
  koa: {
    proxy: true, // 如果部署在反向代理中需要开启此配置，不是就关闭，以防被恶意用户伪造请求 IP 等信息。
  },

  // 安全
  security: {
    csrf: {
      // 允许调用的域名地址的，例如：http://<Referer>/mask-api
      refererWhiteList: ['Referer'],
    },
  },

  //
} as MidwayConfig;
