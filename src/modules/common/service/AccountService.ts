import { Provide, Inject } from '@midwayjs/core';
import {
  CAPTCHA_CODE_KEY,
  PWD_ERR_CNT_KEY,
} from '../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../framework/cache/RedisCache';
import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/ValueParseUtils';
import {
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
import { TokenService } from '../../../framework/service/TokenService';
import { LoginUser } from '../../../framework/vo/LoginUser';
import { SysUserServiceImpl } from '../../system/service/impl/SysUserServiceImpl';
import { SysMenuServiceImpl } from '../../system/service/impl/SysMenuServiceImpl';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { SysRoleServiceImpl } from '../../system/service/impl/SysRoleServiceImpl';
import { SysLogLoginServiceImpl } from '../../system/service/impl/SysLogLoginServiceImpl';

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
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysLogLoginService: SysLogLoginServiceImpl;

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
    if (!parseBoolean(captchaEnabledStr)) {
      return;
    }
    if (!code || !uuid) {
      // 验证码信息错误
      throw new Error('验证码信息错误');
    }
    const verifyKey = CAPTCHA_CODE_KEY + uuid;
    const captcha = await this.redisCache.get(verifyKey);
    if (!captcha) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.createSysLogLogin(
        username,
        STATUS_NO,
        `验证码失效 ${code}`,
        ...il,
        ...ob
      );
      // 验证码失效
      throw new Error('验证码已失效');
    }
    await this.redisCache.del(verifyKey);
    if (captcha !== code) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.createSysLogLogin(
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

  /**
   * 登录方式-用户名
   * @param username 登录用户名
   * @param password 密码
   * @return 结果
   */
  async loginByUsername(username: string, password: string): Promise<string> {
    // 解析ip地址和请求用户代理信息
    const il = await this.contextService.ipaddrLocation();
    const ob = await this.contextService.uaOsBrowser();
    const ilobArgs = [...il, ...ob];

    // 检查密码重试次数
    const retryPwdObj = await this.passwordRetryCount(username, ilobArgs);

    // 查询用户登录账号
    const sysUser = await this.sysUserService.selectUserByUserName(username);
    if (!sysUser || sysUser.userName !== username) {
      const msg = `登录用户：${username} 不存在`;
      const throwMsg = '用户不存在或密码错误';
      this.createLogLogin(username, STATUS_NO, msg, ilobArgs, throwMsg);
      return;
    }
    if (sysUser.delFlag === STATUS_YES) {
      const msg = `登录用户：${username} 已被删除`;
      const throwMsg = '对不起，您的账号已被删除';
      this.createLogLogin(username, STATUS_NO, msg, ilobArgs, throwMsg);
      return;
    }
    if (sysUser.status === STATUS_NO) {
      const msg = `登录用户：${username} 已被停用`;
      const throwMsg = '对不起，您的账号已禁用';
      this.createLogLogin(username, STATUS_NO, msg, ilobArgs, throwMsg);
      return;
    }

    // 检验用户密码
    const compareBool = await bcryptCompare(password, sysUser.password);
    if (compareBool) {
      // 清除错误记录次数
      await this.clearLoginRecordCache(username);
    } else {
      // 尝试登录错误计数累加
      const errCount = parseNumber(retryPwdObj.retryCount) + 1;
      await this.redisCache.setByExpire(
        retryPwdObj.cacheKey,
        errCount,
        parseNumber(retryPwdObj.lockTime) * 60
      );
      const msg = `密码输入错误 ${errCount} 次`;
      const throwMsg = '用户不存在/密码错误';
      this.createLogLogin(username, STATUS_NO, msg, ilobArgs, throwMsg);
      return;
    }

    // 登录用户信息
    const loginUser = new LoginUser();
    loginUser.userId = sysUser.userId;
    loginUser.deptId = sysUser.deptId;
    loginUser.user = sysUser;
    // 用户权限组标识
    const isAdmin = this.contextService.isAdmin(sysUser.userId);
    if (isAdmin) {
      loginUser.permissions = [ADMIN_PERMISSION];
    } else {
      loginUser.permissions = await this.sysMenuService.selectMenuPermsByUserId(
        sysUser.userId
      );
    }

    // 生成令牌，创建系统访问记录
    const tokenStr = await this.tokenService.createToken(loginUser, ilobArgs);
    if (tokenStr) {
      const msg = '登录成功';
      const throwMsg = '用户不存在/密码错误';
      this.createLogLogin(username, STATUS_YES, msg, ilobArgs, throwMsg);
      return;
    }
    return tokenStr;
  }

  /**
   * 根据错误信息，创建系统访问记录
   * @param username 用户名
   * @param msg 记录消息
   * @param ilobArgs 客户端IP UA标识
   * @param throwMsg 抛出错误消息
   */
  async createLogLogin(
    username: string,
    status: string,
    msg: string,
    ilobArgs: string[],
    throwMsg: string
  ) {
    this.contextService.getLogger().info(msg);
    await this.sysLogLoginService.createSysLogLogin(
      username,
      status,
      msg,
      ...ilobArgs
    );
    throw new Error(throwMsg);
  }

  /**
   * 更新登录时间和IP
   * @param userId 用户ID
   * @returns 是否登记完成
   */
  async updateLoginDateAndIP(loginUser: LoginUser): Promise<boolean> {
    const sysUser = loginUser.user;
    const user = await this.sysUserService.selectUserById(sysUser.userId);
    user.loginIp = sysUser.loginIp;
    user.loginDate = sysUser.loginDate;
    const rows = await this.sysUserService.updateUser(user);
    return rows > 0;
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
   * 密码重试次数
   * @param username 登录用户名
   * @param ilobArgs 客户端IP UA标识
   */
  async passwordRetryCount(
    username: string,
    ilobArgs: string[]
  ): Promise<{
    cacheKey: string;
    retryCount: string;
    lockTime: number;
  }> {
    // 验证登录次数
    const maxRetryCount: number = this.contextService.getConfig(
      'user.password.maxRetryCount'
    );
    // 错误锁定时间
    const lockTime: number = this.contextService.getConfig(
      'user.password.lockTime'
    );
    // 验证缓存记录次数
    const cacheKey = PWD_ERR_CNT_KEY + username;
    let retryCount = await this.redisCache.get(cacheKey);
    if (!retryCount) {
      retryCount = '0';
    }
    // 是否超过错误值
    const retryCountInt = parseNumber(retryCount);
    if (retryCountInt >= maxRetryCount) {
      const msg = `密码输入错误 ${maxRetryCount} 次，帐户锁定 ${lockTime} 分钟`;
      this.createLogLogin(username, STATUS_YES, msg, ilobArgs, msg);
      return;
    }
    return {
      cacheKey,
      retryCount,
      lockTime,
    };
  }

  /**
   * 角色和菜单权限
   * @returns
   */
  async roleAndMenuPerms(): Promise<{
    permissions: string[];
    roles: string[];
  }> {
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);

    // 管理员拥有所有权限
    if (isAdmin) {
      return {
        permissions: [ADMIN_PERMISSION],
        roles: [ADMIN_ROLE_KEY],
      };
    }
    const perms = await this.sysMenuService.selectMenuPermsByUserId(userId);
    // 角色key
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.selectRoleListByUserId(userId);
    for (const role of roles) {
      roleGroup.push(role.roleKey);
    }
    return {
      permissions: perms,
      roles: roleGroup,
    };
  }

  /**
   * 前端路由菜单
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
      await this.sysLogLoginService.createSysLogLogin(
        userName,
        STATUS_YES,
        '退出成功',
        ...il,
        ...ob
      );
    }
  }
}
