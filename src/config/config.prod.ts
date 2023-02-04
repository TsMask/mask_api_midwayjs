import { MidwayConfig } from '@midwayjs/core';

export default {
  // 核心服务配置
  koa: {
    port: 6275, // 服务端口
  },

  // TypeORM 数据源
  typeorm: {
    dataSource: {
      // 单数据库实例
      default: {
        port: 3306,
        host: 'mysql',
        username: '<账号>',
        password: '<密码>',
        database: '<数据库名称>',
      },
    },
  },

  // Redis缓存
  redis: {
    client: {
      port: 6379,
      host: 'redis',
      password: '<没有留空字符串>',
      db: 2,
    },
  },

  // Bull 任务队列
  bull: {
    defaultQueueOptions: {
      redis: {
        port: 6379,
        host: 'redis',
        password: '<没有留空字符串>',
        db: 2,
      },
    },
  },
} as MidwayConfig;
