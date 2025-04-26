# https 测试证书

## 1. 生成证书

```bash
openssl req -x509 -newkey rsa:4096 -keyout www.mask.cn.key -out www.mask.cn_chain.crt -days 3650 -nodes -subj "/C=CN/ST=Beijing/L=Beijing/O=Mask/OU=Mask/CN=www.mask.cn"
```

## 2. 配置文件

```ts
import { resolve, normalize } from 'node:path';

export default {
  koa: {
    // ...

    /**是否开启https2, 不开启则http1.1 */
    http2: true,
    /**服务端私钥 */
    key: normalize(resolve(process.cwd(), './script/https/www.mask.cn.key')),
    /**服务端证书 */
    cert: normalize(resolve(process.cwd(), './script/https/www.mask.cn_chain.crt')),
  },
 
  // ...
} as MidwayConfig;

```
