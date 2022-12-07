import { MidwayConfig } from '@midwayjs/core';

export default {
  // 核心服务配置
  koa: {
    port: 7001, // 服务端口
  },

  // 接口文档
  swagger: {
    version: '1.0.0', // 默认值: 1.0.0
    title: '若依 Midwayjs', //  默认值: My Project
    description: '使用swagger-ui@midwayjs本地调试用', // 默认值: This is a swagger-ui for midwayjs project
    termsOfService: 'https://gitee.com', // 团队
    // 联系人
    contact: {
      name: 'TsMask',
      url: 'https://gitee.com/TsMask',
      email: '340112800@qq.com',
    },
    // 服务协议
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
    // 请求服务域名
    servers: [
      {
        url: 'http://127.0.0.1:7001',
        description: 'Local server',
      },
      {
        url: 'http://development-server.com',
        description: 'Development server',
      },
      {
        url: 'https://production-server.com',
        description: 'Production server',
      },
    ],
    // 给标签说明
    tags: [
      {
        name: 'default',
        description: '默认',
      },
    ],
    swaggerPath: '/swagger-ui', //  默认值: /swagger-ui
    tagSortable: true, //对路由 tag 进行 ascii 排序
  },

  // 数据源
  typeorm: {
    dataSource: {
      // 单数据库实例
      default: {
        host: '192.168.56.101',
        port: 3306,
        username: 'root',
        password: 'root@1234',
        database: 'ruoyi-api-midwayjs',
        synchronize: false, // 用于同步表结构, 上线设置false
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
} as MidwayConfig;
