import { MidwayConfig } from '@midwayjs/core';

export default {
  // Logger 程序日志
  midwayLogger: {
    default: {
      level: 'info',
    },
  },

  // 安全
  security: {
    csrf: {
      // 允许调用的域名地址的，例如：http://192.168.56.101/mask-antd/
      refererWhiteList: ['localhost:6265', '127.0.0.1:6265'],
    },
  },

  //
} as MidwayConfig;
