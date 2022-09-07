import { MidwayConfig } from '@midwayjs/core';

export default {
  // 核心服务配置
  koa: {
    port: 7001, // 服务端口
  },

  // 数据源 单数据库实例
  orm: {
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'admin',
    password: 'admin1234',
    database: 'ry-vue',
    logging: true, // 输出sql日志
  },
} as MidwayConfig;
