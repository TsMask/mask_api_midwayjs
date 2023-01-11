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
        host: '192.168.56.101',
        port: 3306,
        username: 'root',
        password: 'root@1234',
        database: 'mask_api_midwayjs',
        logging: true, // 输出sql日志
      },
    },
  },

  // Redis缓存
  redis: {
    client: {
      port: 6379,
      host: '192.168.56.101',
      password: 'redis@1234',
      db: 1,
    },
  },

  // Bull 任务队列
  bull: {
    defaultQueueOptions: {
      redis: {
        port: 6379,
        host: '192.168.56.101',
        password: 'redis@1234',
        db: 1, // Redis db_num
      },
    },
  },
} as MidwayConfig;
