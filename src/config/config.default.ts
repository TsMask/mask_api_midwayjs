import { MidwayAppInfo, MidwayConfig } from '@midwayjs/core';

export default (appInfo: MidwayAppInfo): MidwayConfig => {
  return {
    // use for cookie sign key, should change to your own and keep security
    keys: '1662290627179_89234',

    // 核心服务配置
    koa: {
      port: 7001, // 服务端口
    },

    // 请求数据解析大小限制
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

    // 静态文件配置
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

    // 数据源
    typeorm: {
      dataSource: {
        // 单数据库实例
        default: {
          type: 'mysql',
          host: '',
          port: 3306,
          username: '',
          password: '',
          database: undefined,
          synchronize: false, // 如果第一次使用，不存在表，有同步的需求可以写 true
          logging: false, // 输出sql日志
          dateStrings: true, // 输出时间字段转字符串 yyyy-MM-dd hh:mm:ss
        },
      },
    },

    // 登录密码 加密与重试
    password: {
      secret: 'e2b668c3b631', // 应用密匙+用户随机盐
      errorLimit: 6, // 密码错误最大重试次数
      errorRetryTime: 1000 * 60 * 30, // 密码错误重试次数超限之后的冻结时间（单位毫秒）
    },

    // 登录令牌 自签
    token: {
      secret: 'e2b668c3b631', // 加密密钥
      algorithm: 'sha1', // 加密算法  'sha1' | 'sha256' | 'sha512' | 'md5'
      exp: 1000 * 60 * 60 * 2, // 过期时间（单位毫秒）
      iss: 'pb_midway', // 签发人
    },

    // 短信验证码
    sms: {
      exp: 1000 * 60 * 5, // 验证码过期时间，单位：毫秒
      key: 'your sms key', // 短信密钥key
      secret: 'your sms secret', // 短信密钥secret
    },

    // 邮件验证码
    email: {
      exp: 1000 * 60 * 5, // 验证码过期时间，单位：毫秒
      key: 'your sms key', // 短信密钥key
      secret: 'your sms secret', // 短信密钥secret
    },

    //
  };
};
