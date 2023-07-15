import { Provide, Inject } from '@midwayjs/decorator';
import {
  CAPTCHA_CODE_KEY,
  PWD_ERR_CNT_KEY,
} from '../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { SysMenuServiceImpl } from '../../system/service/impl/SysMenuServiceImpl';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/ValueParseUtils';
import { SysUserServiceImpl } from '../../system/service/impl/SysUserServiceImpl';
import {
  IP_INNER_ADDR,
  STATUS_NO,
  STATUS_YES,
} from '../../../framework/constants/CommonConstants';
import { bcryptCompare } from '../../../framework/utils/CryptoUtils';
import {
  ADMIN_PERMISSION,
  ADMIN_ROLE_KEY,
} from '../../../framework/constants/AdminConstants';
import { RouterVo } from '../../../framework/vo/RouterVo';
import { ContextService } from '../../../framework/service/ContextService';
import { SysLogininforServiceImpl } from '../../monitor/service/impl/SysLogininforServiceImpl';
import { TokenService } from '../../../framework/service/TokenService';
import { SysUser } from '../../system/model/SysUser';

/**
 * 账号身份操作服务
 *
 * @author TsMask
 */
@Provide()
export class AccountService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysLogininforService: SysLogininforServiceImpl;

  @Inject()
  private redisCache: RedisCache;

  /**
   * 校验验证码
   * @param username 登录用户名
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 结果
   */
  async validateCaptcha(
    username: string,
    code: string,
    uuid: string
  ): Promise<void> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr =
      await this.sysConfigService.selectConfigValueByKey(
        'sys.account.captchaEnabled'
      );
    if (parseBoolean(captchaEnabledStr)) {
      const verifyKey = CAPTCHA_CODE_KEY + uuid;
      const captcha = await this.redisCache.get(verifyKey);
      if (!captcha) {
        // 解析ip地址和请求用户代理信息
        const il = await this.contextService.ipaddrLocation();
        const ob = await this.contextService.uaOsBrowser();
        await this.sysLogininforService.newLogininfor(
          username,
          STATUS_NO,
          `验证码失效 ${code}`,
          ...il,
          ...ob
        );
        // 验证码失效
        throw new Error('验证码已失效');
      }
      this.redisCache.del(verifyKey);
      if (captcha !== code) {
        // 解析ip地址和请求用户代理信息
        const il = await this.contextService.ipaddrLocation();
        const ob = await this.contextService.uaOsBrowser();
        await this.sysLogininforService.newLogininfor(
          username,
          STATUS_NO,
          `验证码错误 ${code}`,
          ...il,
          ...ob
        );
        // 验证码错误
        throw new Error('验证码错误');
      }
    }
  }

  /**
   * 登录方式-用户名
   * @param username 登录用户名
   * @param password 密码
   * @return 结果
   */
  async loginByUsername(username: string, password: string): Promise<string> {
    // 验证登录次数
    const maxRetryCount = this.contextService.getConfig(
      'user.password.maxRetryCount'
    );
    // 错误锁定时间
    const lockTime = this.contextService.getConfig('user.password.lockTime');
    // 验证缓存记录次数
    const cacheKey = PWD_ERR_CNT_KEY + username;
    let retryCount = await this.redisCache.get(cacheKey);
    if (!retryCount) {
      retryCount = '0';
    }
    // 是否超过错误值
    if (parseNumber(retryCount) >= parseNumber(maxRetryCount)) {
      const msg = `密码输入错误 ${maxRetryCount} 次，帐户锁定 ${lockTime} 分钟`;
      this.contextService.getLogger().info(msg);
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        username,
        STATUS_NO,
        msg,
        ...il,
        ...ob
      );
      throw new Error(msg);
    }

    // 查询用户登录账号
    const sysUser = await this.sysUserService.selectUserByUserName(username);
    if (sysUser.userName != username) {
      const msg = `登录用户：${username} 不存在`;
      this.contextService.getLogger().info(msg);
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        username,
        STATUS_NO,
        msg,
        ...il,
        ...ob
      );
      throw new Error('用户不存在或密码错误');
    }
    if (sysUser.delFlag === STATUS_YES) {
      const msg = `登录用户：${username} 已被删除`;
      this.contextService.getLogger().info(msg);
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        username,
        STATUS_NO,
        msg,
        ...il,
        ...ob
      );
      throw new Error('对不起，您的账号已被删除');
    }
    if (sysUser.status === STATUS_NO) {
      const msg = `登录用户：${username} 已被停用`;
      this.contextService.getLogger().info(msg);
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        username,
        STATUS_NO,
        msg,
        ...il,
        ...ob
      );
      throw new Error('用户已封禁，请联系管理员');
    }

    // 匹配用户密码，清除错误记录次数
    const compareBool = await bcryptCompare(password, sysUser.password);
    if (compareBool) {
      await this.clearLoginRecordCache(username);
    } else {
      const errCount = parseNumber(retryCount) + 1;
      await this.redisCache.setByExpire(
        cacheKey,
        errCount,
        parseNumber(lockTime) * 60
      );
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        username,
        STATUS_NO,
        `密码输入错误 ${errCount} 次`,
        ...il,
        ...ob
      );
      throw new Error('用户不存在/密码错误');
    }

    // 登录用户信息
    // 检查是否管理员，给予拥有所有权限
    const isAdmin = this.contextService.isAdmin(sysUser.userId);
    const loginUser = await this.tokenService.createLoginUser(sysUser, isAdmin);

    // 解析ip地址和请求用户代理信息
    const il = await this.contextService.ipaddrLocation();
    const ob = await this.contextService.uaOsBrowser();
    const ilobArgs = il.concat(ob);
    const tokenStr = await this.tokenService.createToken(loginUser, ilobArgs);
    // 记录登录信息
    await this.recordLoginInfo(loginUser.userId);
    await this.sysLogininforService.newLogininfor(
      username,
      STATUS_YES,
      '登录成功',
      ...ilobArgs
    );
    return tokenStr;
  }

  /**
   * 记录登录信息
   * @param userId 用户ID
   * @returns 是否登记完成
   */
  private async recordLoginInfo(userId: string) {
    const sysUser = new SysUser();
    sysUser.userId = userId;
    const ip = this.contextService.getContext().ip;
    sysUser.loginIp = ip.includes(IP_INNER_ADDR)
      ? ip.replace(IP_INNER_ADDR, '')
      : ip;
    sysUser.loginDate = Date.now();
    return await this.sysUserService.updateUser(sysUser);
  }

  /**
   * 清除错误记录次数
   * @param username 登录用户名
   */
  async clearLoginRecordCache(username: string): Promise<boolean> {
    const cacheKey = PWD_ERR_CNT_KEY + username;
    if (await this.redisCache.hasKey(cacheKey)) {
      const rows = await this.redisCache.del(cacheKey);
      return rows > 0;
    }
    return false;
  }

  /**
   * 角色和菜单权限
   * @returns
   */
  async roleAndMenuPerms(): Promise<Record<string, any>> {
    const user = this.contextService.getSysUser();
    const data = {
      permissions: [],
      roles: [],
      user: user,
    };
    // 管理员拥有所有权限
    const isAdmin = this.contextService.isAdmin(user.userId);
    if (isAdmin) {
      data.permissions = [ADMIN_PERMISSION];
      data.roles = [ADMIN_ROLE_KEY];
    } else {
      data.permissions = await this.sysMenuService.selectMenuPermsByUserId(
        user.userId
      );
      data.roles = await this.sysMenuService.selectMenuPermsByUserId(
        user.userId
      );
    }
    return data;
  }

  /**
   * 前端路由菜单
   * @param userId 用户ID
   * @param isAdmin 是否管理员
   * @returns
   */
  async routeMenus(): Promise<RouterVo[]> {
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);
    let buildMenus: RouterVo[] = [];
    if (isAdmin) {
      const menus = await this.sysMenuService.selectMenuTreeByUserId('*');
      buildMenus = await this.sysMenuService.buildRouteMenus(menus, '');
    } else {
      const menus = await this.sysMenuService.selectMenuTreeByUserId(userId);
      buildMenus = await this.sysMenuService.buildRouteMenus(menus, '');
    }
    return buildMenus;
  }

  /**
   * 登出清除token
   */
  async logout(): Promise<void> {
    // 获取token在请求头标识信息
    const token = await this.contextService.getHeaderToken();
    if (!token) return;

    // 存在token时记录退出信息
    const userName = await this.tokenService.removeToken(token);
    if (userName) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogininforService.newLogininfor(
        userName,
        STATUS_YES,
        '退出成功',
        ...il,
        ...ob
      );
    }
  }
}
