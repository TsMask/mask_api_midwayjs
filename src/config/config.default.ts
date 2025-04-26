import { resolve, normalize, join } from 'node:path';
import { MidwayConfig } from '@midwayjs/core';

export default (): MidwayConfig => {
  // 程序资源文件路径，与项目目录同级
  const filePath = resolve(process.cwd(), '../mask_file');
  return {
    // use for cookie sign key, should change to your own and keep security
    keys: '1662290627179_89234',

    /**核心服务配置 http://www.midwayjs.org/docs/extensions/koa */
    koa: {
      /**服务端口 */
      port: 6275,
      /**是否开启代理 */
      proxy: false,
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
        level: 'warn',
        transports: {
          file: {
            dir: normalize(join(filePath, '/logs')),
          },
          error: {
            dir: normalize(join(filePath, '/logs')),
          },
        },
      },
    },

    /**文件上传 https://midwayjs.org/docs/extensions/upload */
    upload: {
      /**最大上传文件大小，默认为 10mb */
      fileSize: '10mb',
      /**文件扩展名白名单 */
      whitelist: [
        // 图片
        '.bmp',
        '.webp',
        '.gif',
        '.jpg',
        '.jpeg',
        '.png',
        // word excel powerpoint
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        // 文本文件
        '.html',
        '.htm',
        '.txt',
        // pdf
        '.pdf',
        // 压缩文件
        '.zip',
        '.gz',
        '.tgz',
        '.gzip',
        // 音视频格式
        '.mp3',
        '.mp4',
        '.avi',
        '.rmvb',
      ],
      /**上传的文件临时存储路径 */
      tmpdir: normalize(join(filePath, '/temp')),
      /**上传的文件在临时目录中多久之后自动删除，默认为 5 分钟 */
      cleanTimeout: 5 * 60 * 1000,
      /**设置原始body是否是base64格式，默认为false，一般用于腾讯云的兼容 */
      base64: false,
    },

    /**静态文件配置 https://midwayjs.org/docs/extensions/static_file */
    staticFile: {
      dirs: {
        // 默认资源，dir目录需要预先创建
        default: {
          prefix: '/static',
          dir: normalize(join(filePath, '/static')),
        },
        // 文件上传资源目录映射
        upload: {
          prefix: '/upload',
          dir: normalize(join(filePath, '/upload')),
        },
      },
    },

    /**跨域 https://midwayjs.org/docs/extensions/cross_domain */
    cors: {
      // 设置 Access-Control-Allow-Origin 的值，【默认值】会获取请求头上的 origin
      // 也可以配置为一个回调方法，传入的参数为 request，需要返回 origin 值
      // 例如：http://test.midwayjs.org
      // 如果请求设置了 credentials，则 origin 不能设置为 *
      origin: '*',
      // 设置 Access-Control-Allow-Credentials，【默认值】false
      // 也可以配置为一个回调方法，传入的参数为 request，返回值为 true 或 false
      credentials: true,
      // 设置 Access-Control-Max-Age
      maxAge: 31536000,
      // 允许跨域的方法，【默认值】为 GET,HEAD,PUT,POST,DELETE,PATCH
      allowMethods: ['OPTIONS', 'HEAD', 'GET', 'POST', 'PUT', 'DELET'],
      // 设置 Access-Control-Allow-Headers 的值，【默认值】会获取请求头上的 Access-Control-Request-Headers
      allowHeaders: [
        'X-App-Code',
        'X-App-Version',
        'Authorization',
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Content-Language',
        'Accept',
        'Range',
      ],
      // 设置 Access-Control-Expose-Headers 的值
      exposeHeaders: ['"X-RepeatSubmit-Rest'],
    },

    /**安全 https://midwayjs.org/docs/extensions/security */
    security: {
      csrf: {
        enable: true,
        type: 'referer',
        refererWhiteList: ['127.0.0.1:6275'],
      },
      xframe: {
        enable: true,
        value: 'SAMEORIGIN',
      },
      csp: {
        enable: true,
      },
      hsts: {
        enable: false,
        maxAge: 365 * 24 * 3600,
        includeSubdomains: false,
      },
      noopen: {
        enable: false,
      },
      nosniff: {
        enable: false,
      },
      xssProtection: {
        enable: true,
        value: '1; mode=block',
      },
    },

    /**JWT 令牌配置 */
    jwt: {
      /**令牌算法 HS256 HS384 HS512 */
      algorithm: 'HS512',
      /**令牌密钥 */
      secret: 'abcdefghijklmnopqrstuvwxyz',
      /**访问令牌有效期（默认15分钟） */
      expiresIn: 15,
      /**刷新令牌有效期（默认7*24*60分钟） */
      refreshIn: 10080,
    },

    /**TypeORM 数据源 https://midwayjs.org/docs/extensions/orm */
    typeorm: {
      dataSource: {
        // 默认数据库实例
        default: {
          /**数据库类型 */
          type: 'mysql',
          host: '127.0.0.1',
          port: 3306,
          username: '<mysql username>',
          password: '<mysql password>',
          database: '<mysql database>',
          logging: false, // 输出sql日志
          /**配置实体模型以扫描形式 */
          entities: ['modules/*/model/*{.ts,.js}'],
        },
      },
      // 多个数据源时可以用这个指定默认的数据源
      defaultDataSourceName: 'default',
    },

    /**Redis 缓存数据 http://www.midwayjs.org/docs/extensions/redis */
    redis: {
      client: {
        port: 6379,
        host: '127.0.0.1',
        password: '<redis password>',
        db: 0,
      },
    },

    /**Bull 任务队列 http://www.midwayjs.org/docs/extensions/bull */
    bull: {
      defaultQueueOptions: {
        redis: {
          port: 6379,
          host: '127.0.0.1',
          password: '<redis password>',
          db: 0,
        },
        prefix: 'bull_queue', // Redis key
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

    /**参数校验 http://www.midwayjs.org/docs/extensions/validate */
    validate: {
      validationOptions: {
        allowUnknown: true, // 允许未定义的字段
        stripUnknown: false, // 剔除参数中的未定义属性
        // 临时禁用全局校验
        // @Body() user: Partial<UserDTO>
      },
    },

    /**系统用户，将用户ID设定为系统管理员角色 */
    systemUser: [1],

    /**char 字符验证码配置 */
    charCaptcha: {
      /**宽度 */
      width: 120,
      /**高度 */
      height: 40,
      /**干扰线条的数量 */
      noise: 4,
      /**验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有 */
      color: true,
      // 验证码图片背景颜色
      background: '#fafafa',
      /**验证码长度 */
      size: 4,
      /**验证码字符中排除 0o1i */
      ignoreChars: '0o1i',
    },

    /**math 数值计算码配置 */
    mathCaptcha: {
      /**宽度 */
      width: 120,
      /**高度 */
      height: 40,
      /**干扰线条的数量 */
      noise: 4,
      /**验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有 */
      color: true,
      /**验证码图片背景颜色 */
      background: '#fafafa',
      /**计算式，默认"+"，可选"+", "-" or "+/-" */
      mathOperator: '+/-',
      /**算数值最小值，默认1 */
      mathMin: 1,
      /**算数值最大值，默认9 */
      mathMax: 15,
    },

    //
  };
};
