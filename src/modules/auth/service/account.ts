import { Provide, Inject, Singleton } from '@midwayjs/core';

import {
  CACHE_CAPTCHA_CODE,
  CACHE_PWD_ERR_COUNT,
} from '../../../framework/constants/cache_key';
import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '../../../framework/constants/system';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/parse/parse';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { UserInfo } from '../../../framework/token/user_info';
import { GlobalConfig } from '../../../framework/config/config';
import { bcryptCompare } from '../../../framework/utils/crypto/bcrypt';
import { SysConfigService } from '../../system/service/sys_config';
import { SysMenuService } from '../../system/service/sys_menu';
import { SysRoleService } from '../../system/service/sys_role';
import { SysUserService } from '../../system/service/sys_user';
import { Router } from '../../system/model/vo/router';

/**账号身份操作 服务层处理 */
@Provide()
@Singleton()
export class AccountService {
  /**缓存操作 */
  @Inject()
  private redis: RedisCache;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**菜单服务 */
  @Inject()
  private sysMenuService: SysMenuService;

  /**角色服务 */
  @Inject()
  private sysRoleService: SysRoleService;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**用户信息服务 */
  @Inject()
  private sysUserService: SysUserService;

  /**
   * 校验验证码
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 错误结果信息
   */
  public async validateCaptcha(code: string, uuid: string): Promise<string> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
      'sys.account.captchaEnabled'
    );
    if (!parseBoolean(captchaEnabledStr)) {
      return '';
    }
    if (!code || !uuid) {
      return 'captcha empty';
    }
    const verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
    const captcha = await this.redis.get('', verifyKey);
    if (!captcha) {
      return 'captcha expire';
    }
    await this.redis.del('', verifyKey);
    if (captcha !== code.toLowerCase()) {
      return 'captcha error';
    }
    return '';
  }

  /**
   * 登录创建用户信息
   * @param username 登录用户名
   * @param password 密码
   * @return [UserInfo, string] 登录用户信息对象和错误结果信息
   */
  public async byUsername(
    username: string,
    password: string
  ): Promise<[UserInfo, string]> {
    const info = new UserInfo();

    // 检查密码重试次数
    const [retryKey, retryCount, lockTime, err] = await this.passwordRetryCount(
      username
    );
    if (err) {
      return [info, err];
    }

    // 查询用户登录账号
    const sysUser = await this.sysUserService.findByUserName(username);
    if (sysUser.userName !== username) {
      return [info, 'user does not exist or password is incorrect'];
    }
    if (sysUser.delFlag === STATUS_YES) {
      return [
        info,
        'sorry, your account has been deleted. Sorry, your account has been deleted',
      ];
    }
    if (sysUser.statusFlag === STATUS_NO) {
      return [info, 'sorry, your account has been disabled'];
    }

    // 检验用户密码
    const compareBool = await bcryptCompare(password, sysUser.password);
    if (compareBool) {
      // 清除错误记录次数
      await this.clearLoginRecordCache(username);
    } else {
      await this.redis.set('', retryKey, retryCount + 1, lockTime);
      return [info, 'user does not exist or password is incorrect'];
    }

    // 登录用户信息
    info.userId = sysUser.userId;
    info.deptId = sysUser.deptId;
    info.user = sysUser;
    // 用户权限组标识
    if (this.config.isSystemUser(sysUser.userId)) {
      info.permissions = [SYS_PERMISSION_SYSTEM];
    } else {
      const perms = await this.sysMenuService.findPermsByUserId(sysUser.userId);
      info.permissions = [...new Set(perms)];
    }
    return [info, ''];
  }

  /**
   * 用户ID刷新令牌创建用户信息
   * @param userId 登录ID
   * @return [UserInfo, string] 登录用户信息对象和错误结果信息
   */
  public async byUserId(userId: number): Promise<[UserInfo, string]> {
    const info = new UserInfo();

    // 查询用户登录账号
    const sysUser = await this.sysUserService.findById(userId);
    if (sysUser.userId !== userId) {
      return [info, 'user does not exist'];
    }
    if (sysUser.delFlag === STATUS_YES) {
      return [
        info,
        'sorry, your account has been deleted. Sorry, your account has been deleted',
      ];
    }
    if (sysUser.statusFlag === STATUS_NO) {
      return [info, 'sorry, your account has been disabled'];
    }

    // 登录用户信息
    info.userId = sysUser.userId;
    info.deptId = sysUser.deptId;
    info.user = sysUser;
    // 用户权限组标识
    if (this.config.isSystemUser(sysUser.userId)) {
      info.permissions = [SYS_PERMISSION_SYSTEM];
    } else {
      const perms = await this.sysMenuService.findPermsByUserId(sysUser.userId);
      info.permissions = [...new Set(perms)];
    }
    return [info, ''];
  }

  /**
   * 更新登录时间和IP
   * @param info 登录用户信息对象
   * @returns 记录完成
   */
  public async updateLoginDateAndIP(info: UserInfo): Promise<boolean> {
    const item = await this.sysUserService.findById(info.userId);
    item.password = ''; // 密码不更新
    item.loginIp = info.loginIp;
    item.loginTime = info.loginTime;
    const rows = await this.sysUserService.update(item);
    return rows > 0;
  }

  /**
   * 清除错误记录次数
   * @param username 登录用户名
   * @returns boolean
   */
  public async clearLoginRecordCache(username: string): Promise<boolean> {
    const base64UserName = Buffer.from(username, 'utf8').toString('base64');
    const cacheKey = CACHE_PWD_ERR_COUNT + ':' + base64UserName;
    const hasKey = await this.redis.has('', cacheKey);
    if (hasKey > 0) {
      const rows = await this.redis.del('', cacheKey);
      return rows > 0;
    }
    return false;
  }

  /**
   * 密码重试次数
   * @param username 登录用户名
   * @returns [retryKey, retryCount, lockTime, err]
   */
  public async passwordRetryCount(
    username: string
  ): Promise<[string, number, number, string]> {
    // 验证登录次数和错误锁定时间
    const maxRetryCountStr = await this.sysConfigService.findValueByKey(
      'sys.account.passwordRetryMaxCount'
    );
    const lockTimeStr = await this.sysConfigService.findValueByKey(
      'sys.account.passwordRetryLockTime'
    );
    const maxRetryCount: number = parseNumber(maxRetryCountStr);
    const lockTime: number = parseNumber(lockTimeStr);
    // 验证缓存记录次数
    const base64UserName = Buffer.from(username, 'utf8').toString('base64');
    const retryKey = CACHE_PWD_ERR_COUNT + ':' + base64UserName;
    let retryCount = await this.redis.get('', retryKey);
    if (!retryCount) {
      retryCount = '0';
    }
    // 是否超过错误值
    const retryCountInt = parseNumber(retryCount);
    if (retryCountInt >= maxRetryCount) {
      const msg = `密码输入错误 ${maxRetryCount} 次，帐户锁定 ${lockTime} 分钟`;
      return [retryKey, retryCountInt, lockTime * 60, msg];
    }
    return [retryKey, retryCountInt, lockTime * 60, ''];
  }

  /**
   * 角色和菜单数据权限
   * @param userId 用户ID
   * @param isSystemUser 是否为系统管理员
   * @returns [角色key数组, 菜单权限key数组]
   */
  public async roleAndMenuPerms(
    userId: number,
    isSystemUser: boolean
  ): Promise<[string[], string[]]> {
    if (isSystemUser) {
      return [[SYS_ROLE_SYSTEM_KEY], [SYS_PERMISSION_SYSTEM]];
    }
    // 角色key
    const roleGroup: string[] = [];
    const roles = await this.sysRoleService.findByUserId(userId);
    for (const role of roles) {
      roleGroup.push(role.roleKey);
    }
    // 菜单权限key
    const perms = await this.sysMenuService.findPermsByUserId(userId);
    return [roleGroup, perms];
  }

  /**
   * 前端路由所需要的菜单
   * @param userId 用户ID
   * @param isSystemUser 是否为系统管理员
   * @returns 路由菜单数组
   */
  public async routeMenus(
    userId: number,
    isSystemUser: boolean
  ): Promise<Router[]> {
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
}
