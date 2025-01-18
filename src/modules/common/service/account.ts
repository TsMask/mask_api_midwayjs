import { Provide, Inject } from '@midwayjs/core';
import {
  CACHE_CAPTCHA_CODE,
  CACHE_PWD_ERR_COUNT,
} from '../../../framework/constants/cache_key';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/ValueParseUtils';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { bcryptCompare } from '../../../framework/utils/CryptoUtils';
import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '../../../framework/constants/system';
import { Router } from '../../system/model/vo/router';
import { ContextService } from '../../../framework/service/ContextService';
import { TokenService } from '../../../framework/utils/token/token';
import { SysConfigService } from '../../system/service/sys_config';
import { SysLogLoginService } from '../../system/service/sys_log_login';
import { SysMenuService } from '../../system/service/sys_menu';
import { SysRoleService } from '../../system/service/sys_role';
import { SysUserService } from '../../system/service/sys_user';
import { TokenInfo } from '../../../framework/utils/token/token_info';

/**
 * 账号身份操作服务
 */
@Provide()
export class AccountService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private sysMenuService: SysMenuService;

  @Inject()
  private sysRoleService: SysRoleService;

  @Inject()
  private sysConfigService: SysConfigService;

  @Inject()
  private sysUserService: SysUserService;

  @Inject()
  private sysLogLoginService: SysLogLoginService;

  @Inject()
  private redisCache: RedisCache;

  /**
   * 校验验证码
   * @param username 登录用户名
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 结果
   */
  public async validateCaptcha(
    username: string,
    code: string,
    uuid: string
  ): Promise<void> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
      'sys.account.captchaEnabled'
    );
    if (!parseBoolean(captchaEnabledStr)) {
      return;
    }
    if (!code || !uuid) {
      // 验证码信息错误
      throw new Error('验证码信息错误');
    }
    const verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
    const captcha = await this.redisCache.get('', verifyKey);
    if (!captcha) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.insert(
        username,
        STATUS_NO,
        `验证码失效 ${code}`,
        [...il, ...ob]
      );
      // 验证码失效
      throw new Error('验证码已失效');
    }
    await this.redisCache.del('', verifyKey);
    if (captcha !== code) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.insert(
        username,
        STATUS_NO,
        `验证码错误 ${code}`,
        [...il, ...ob]
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
  public async loginByUsername(
    username: string,
    password: string
  ): Promise<string> {
    // 解析ip地址和请求用户代理信息
    const il = await this.contextService.ipaddrLocation();
    const ob = await this.contextService.uaOsBrowser();
    const ilobArgs = [...il, ...ob];

    // 检查密码重试次数
    const retryPwdObj = await this.passwordRetryCount(username, ilobArgs);

    // 查询用户登录账号
    const sysUser = await this.sysUserService.findByUserName(username);
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
    if (sysUser.statusFlag === STATUS_NO) {
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
        '',
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
    const loginUser = new TokenInfo();
    loginUser.userId = sysUser.userId;
    loginUser.deptId = sysUser.deptId;
    loginUser.user = sysUser;
    // 用户权限组标识
    const isSystemUser = this.contextService.isSystemUser(sysUser.userId);
    if (isSystemUser) {
      loginUser.permissions = [SYS_PERMISSION_SYSTEM];
    } else {
      loginUser.permissions = await this.sysMenuService.findPermsByUserId(
        sysUser.userId
      );
    }

    // 生成令牌，创建系统访问记录
    const tokenStr = await this.tokenService.create(loginUser, ilobArgs);
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
  public async createLogLogin(
    username: string,
    status: string,
    msg: string,
    ilobArgs: string[],
    throwMsg: string
  ) {
    this.contextService.getLogger().info(msg);
    await this.sysLogLoginService.insert(username, status, msg, ilobArgs);
    throw new Error(throwMsg);
  }

  /**
   * 更新登录时间和IP
   * @param userId 用户ID
   * @returns 是否登记完成
   */
  public async updateLoginDateAndIP(loginUser: TokenInfo): Promise<boolean> {
    const sysUser = loginUser.user;
    const user = await this.sysUserService.findById(sysUser.userId);
    user.loginIp = sysUser.loginIp;
    user.loginTime = sysUser.loginTime;
    const rows = await this.sysUserService.update(user);
    return rows > 0;
  }

  /**
   * 清除错误记录次数
   * @param username 登录用户名
   */
  public async clearLoginRecordCache(username: string): Promise<boolean> {
    const cacheKey = CACHE_PWD_ERR_COUNT + ':' + username;
    if (await this.redisCache.has('', cacheKey)) {
      const rows = await this.redisCache.del('', cacheKey);
      return rows > 0;
    }
    return false;
  }

  /**
   * 密码重试次数
   * @param username 登录用户名
   * @param ilobArgs 客户端IP UA标识
   */
  public async passwordRetryCount(
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
    const cacheKey = CACHE_PWD_ERR_COUNT + ':' + username;
    let retryCount = await this.redisCache.get('', cacheKey);
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
  public async roleAndMenuPerms(): Promise<{
    permissions: string[];
    roles: string[];
  }> {
    const userId = this.contextService.getUserId();
    const isSystemUser = this.contextService.isSystemUser(userId);

    // 管理员拥有所有权限
    if (isSystemUser) {
      return {
        permissions: [SYS_PERMISSION_SYSTEM],
        roles: [SYS_ROLE_SYSTEM_KEY],
      };
    }
    const perms = await this.sysMenuService.findPermsByUserId(userId);
    // 角色key
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.findByUserId(userId);
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
  public async routeMenus(): Promise<Router[]> {
    const userId = this.contextService.getUserId();
    const isSystemUser = this.contextService.isSystemUser(userId);

    let buildMenus: Router[] = [];
    if (isSystemUser) {
      const menus = await this.sysMenuService.buildTreeMenusByUserId(0);
      buildMenus = await this.sysMenuService.buildRouteMenus(menus, '');
    } else {
      const menus = await this.sysMenuService.buildTreeMenusByUserId(userId);
      buildMenus = await this.sysMenuService.buildRouteMenus(menus, '');
    }
    return buildMenus;
  }

  /**
   * 登出清除token
   */
  public async logout(): Promise<void> {
    // 获取token在请求头标识信息
    const token = await this.contextService.getHeaderToken();
    if (!token) return;

    // 存在token时记录退出信息
    const userName = await this.tokenService.remove(token);
    if (userName) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.insert(userName, STATUS_YES, '退出成功', [
        ...il,
        ...ob,
      ]);
    }
  }
}
