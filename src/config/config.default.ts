import { MidwayAppInfo, MidwayConfig } from '@midwayjs/core';

export default (appInfo: MidwayAppInfo): MidwayConfig => {
  return {
    // use for cookie sign key, should change to your own and keep security
    keys: '1662290627179_89234',

    /**项目相关配置 */
    project: {
      /**名称 */
      name: 'RuoYi-Midwayjs',
      /**版本 */
      version: '0.0.2',
      /**版权年份 */
      copyrightYear: 2022,
      // 实例演示开关
      demoEnabled: true,
      // 文件路径 示例（ Windows配置D:/home/ruoyi/uploadPath，Linux配置 /home/ruoyi/uploadPath）
      profile: 'D:/home/ruoyi/uploadPath',
      // 获取ip地址开关
      addressEnabled: false,
      /**验证码类型 math 数组计算 char 字符验证 */
      captchaType: 'math',
    },

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

    /**math 数组计算码配置 */
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

    /**核心服务配置 */
    koa: {
      /**服务端口 */
      port: 7001,
    },

    /**请求数据解析大小限制 */
    bodyParser: {
      enableTypes: ['json', 'form', 'text', 'xml'],
      formLimit: '1mb',
      jsonLimit: '1mb',
      textLimit: '1mb',
      xmlLimit: '1mb',
    },

    // 任务调度 单进程
    task: {
      prefix: 'midway-task', // 这些任务存储的 key，都是 midway-task 开头，以便区分用户原有redis 里面的配置。
      defaultJobOptions: {
        repeat: {
          tz: 'Asia/Shanghai', // Task 等参数里面设置的比如（0 0 0 * * *）本来是为了0点执行，但是由于时区不对，所以国内用户时区设置一下。
        },
      },
    },

    /**静态文件配置 http://www.midwayjs.org/docs/extensions/static_file */
    staticFile: {
      dirs: {
        default: {
          prefix: '/static',
          dir: `${appInfo.appDir}\\static`,
        },
        // key 不重复即可，value 会和默认的配置合并。
        // template: {
        //   prefix: '/public/template', // 可同前缀或相同
        //   dir: `${appInfo.appDir}\\template`,
        // },
      },
    },

    /**TypeORM 数据源 http://www.midwayjs.org/docs/extensions/orm */
    typeorm: {
      dataSource: {
        // 默认数据库实例
        default: {
          /**数据库类型 */
          type: 'mysql',
          host: '',
          port: 3306,
          username: '',
          password: '',
          database: '',
          /**用于同步表结构 */
          synchronize: false,
          /**输出sql日志 */
          logging: false,
          /** 输出时间字段转字符串格式 yyyy-MM-dd hh:mm:ss */
          dateStrings: false,
        },
      },
    },

    /**Redis 缓存数据 http://www.midwayjs.org/docs/extensions/redis */
    redis: {
      client: {
        port: 6379, // Redis port
        host: '127.0.0.1', // Redis host
        password: '',
        db: 1,
      },
    },

    /**jwt令牌配置 https://github.com/auth0/node-jsonwebtoken */
    jwt: {
      /**令牌算法 */
      algorithm: 'HS512',
      /**令牌密钥 */
      secret: 'abcdefghijklmnopqrstuvwxyz', // fs.readFileSync('xxxxx.key')
      /**令牌有效期（默认30分钟） */
      expiresIn: '240m', // https://github.com/vercel/ms
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
        /**密码锁定时间（默认10分钟） */
        lockTime: 10,
      },
      /**超级管理员列表 */
      superAdmin: ['1'],
    },

    //
  };
};
