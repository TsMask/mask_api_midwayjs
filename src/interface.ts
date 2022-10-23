import '@midwayjs/core';
import { LoginUser } from './framework/core/vo/LoginUser';

/**扩展 Midway 通用的 Context */
declare module '@midwayjs/core' {
  interface Context {
    /**登录用户身份权限信息 */
    loginUser: LoginUser;
  }
}
