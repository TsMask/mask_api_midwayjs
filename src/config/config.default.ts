import { MidwayConfig } from '@midwayjs/core';

export default (): MidwayConfig => {
  // 程序文件路径 示例（ Windows配置D:/home/mask，Linux配置 /home/mask）
  const filePath = 'D:/home/mask';

  return {
    // use for cookie sign key, should change to your own and keep security
    keys: '1662290627179_89234',

    /**char 字符验证码配置 */
    charCaptcha: {
      /**干扰线条的数量 */
      noise: 4,
      /**验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有 */
      color: true,
      // 验证码图片背景颜色
      background: '#f5f5f5',
      /**验证码长度 */
      size: 4,
      /**验证码字符中排除 0o1i */
      ignoreChars: '0o1i',
    },

    /**math 数值计算码配置 */
    mathCaptcha: {
      /**干扰线条的数量 */
      noise: 4,
      /**验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有 */
      color: true,
      // 验证码图片背景颜色
      background: '#f5f5f5',
      /**计算式，默认"+"，可选"+", "-" or "+/-" */
      mathOperator: '+',
      /**算数值最小值，默认1 */
      mathMin: 1,
      /**算数值最大值，默认9 */
      mathMax: 9,
    },

    /**核心服务配置 http://www.midwayjs.org/docs/extensions/koa */
    koa: {
      /**服务端口 */
      port: 6275,
    },

    /**请求数据解析大小限制 */
    bodyParser: {
      enableTypes: ['json', 'form', 'text', 'xml'],
      formLimit: '1mb',
      jsonLimit: '1mb',
      textLimit: '1mb',
      xmlLimit: '1mb',
    },

    /**Logger 程序日志 http://www.midwayjs.org/docs/logger#配置日志根目录 */
    midwayLogger: {
      default: {
        dir: `${filePath}/logs`,
      },
    },

    /**文件上传 http://www.midwayjs.org/docs/extensions/upload#配置示例 */
    upload: {
      /**默认为file，即上传到服务器临时目录，可以配置为 stream */
      mode: 'file',
      /**最大上传文件大小，默认为 10mb */
      fileSize: '50mb',
      /**文件扩展名白名单，程序内文件服务进行配置 */
      whitelist: null,
      /**上传的文件临时存储路径 */
      tmpdir: `${filePath}/tmpPath`,
      /**上传的文件在临时目录中多久之后自动删除，默认为 5 分钟 */
      cleanTimeout: 5 * 60 * 1000,
      /**设置原始body是否是base64格式，默认为false，一般用于腾讯云的兼容 */
      base64: false,
    },

    /**静态文件配置 http://www.midwayjs.org/docs/extensions/static_file */
    staticFile: {
      dirs: {
        default: {
          prefix: '/static',
          dir: `${filePath}/static`,
        },
        // 文件上传资源目录映射
        upload: {
          prefix: '/upload',
          dir: `${filePath}/uploadPath`,
        },
      },
    },

    /**TypeORM 数据源 http://www.midwayjs.org/docs/extensions/orm */
    typeorm: {
      dataSource: {
        // 默认数据库实例
        default: {
          /**数据库类型 */
          type: 'mysql',
          host: '127.0.0.1',
          port: 3306,
          username: '<用户名>',
          password: '<密码>',
          database: '<数据库>',
          /**输出sql日志 */
          logging: false,
        },
      },
      // 多个数据源时可以用这个指定默认的数据源
      defaultDataSourceName: 'default',
    },

    /**Redis 缓存数据 http://www.midwayjs.org/docs/extensions/redis */
    redis: {
      client: {
        port: 6379, // Redis port
        host: '127.0.0.1', // Redis host
        password: '<密码>',
        db: 0, // Redis db_num
      },
    },

    /**Bull 任务队列 http://www.midwayjs.org/docs/extensions/bull */
    bull: {
      defaultQueueOptions: {
        redis: {
          port: 6379, // Redis port
          host: '127.0.0.1', // Redis host
          password: '<密码>',
          db: 0, // Redis db_num
        },
        prefix: 'bull_task', // Redis key
        // 默认的任务配置
        defaultJobOptions: {
          // 成功后移除任务记录，最多保留最近 10 条记录
          removeOnComplete: 10,
          // 失败后移除任务记录，最多保留最近 10 条记录
          removeOnFail: 10,
        },
      },
      // 清理之前的任务
      clearRepeatJobWhenStart: true,
    },

    /**JWT 令牌配置 http://www.midwayjs.org/docs/extensions/jwt */
    jwt: {
      /**令牌算法 */
      algorithm: 'HS512',
      /**令牌密钥 */
      secret: 'abcdefghijklmnopqrstuvwxyz', // fs.readFileSync('xxxxx.key')
      /**令牌有效期（默认30分钟） */
      expiresIn: '640m', // https://github.com/vercel/ms
    },
    /**请求头令牌自定义标识 */
    jwtHeader: 'Authorization',
    /**验证令牌有效期，相差不足xx分钟，自动刷新缓存 */
    jwtRefreshIn: '20m', // https://github.com/vercel/ms

    /**用户配置 */
    user: {
      /**密码 */
      password: {
        /**密码最大错误次数 */
        maxRetryCount: 5,
        /**密码锁定时间,单位分钟（默认10分钟） */
        lockTime: 10,
      },
      /**管理员列表 */
      adminList: ['1'],
    },

    /**有序唯一分布式ID */
    flakeIdgen: {
      /**机器编号 */
      id: 46,
      /**基准时间 (2022 - 1970) * 31536000 * 1000 */
      epoch: 1639872000000,
    },
    //
  };
};
