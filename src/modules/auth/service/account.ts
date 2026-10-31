import { Provide, Inject, Singleton } from '@midwayjs/core';

import {
  CACHE_CAPTCHA_CODE,
  CACHE_PWD_ERR_COUNT,
  CACHE_SMS_CODE,
  CACHE_SMS_CODE_COOLDOWN,
} from '../../../internal/shared/constants/cache_key';
import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '../../../internal/shared/constants/system';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
import {
  parseBoolean,
  parseNumber,
} from '../../../internal/shared/parse/parse';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { UserInfo } from '../../../internal/web/token/user_info';
import { GlobalConfig } from '../../../internal/config/config';
import { passwordVerify } from '../../../internal/shared/crypto/password';
import { SysConfigService } from '../../system/service/sys_config';
import { SysMenuService } from '../../system/service/sys_menu';
import { SysRoleService } from '../../system/service/sys_role';
import { SysUserService } from '../../system/service/sys_user';
import { SysUser } from '../../system/model/sys_user';
import { AuthMenu } from '../../system/model/vo/auth_menu';

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
      'sys.account.captcha_enabled',
      'sys.account.captchaEnabled'
    );
    if (!parseBoolean(captchaEnabledStr)) {
      return '';
    }
    if (!code || !uuid) {
      return 'captcha empty';
    }
    const verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
    const captcha = await this.redis.getDel('', verifyKey);
    if (!captcha) {
      return 'captcha expire';
    }
    if (captcha !== code.toLowerCase()) {
      return 'captcha error';
    }
    return '';
  }

  /**
   * 校验并一次性消费短信登录验证码
   * @param phone 手机号
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 错误结果信息
   */
  public async validateCaptchaSMS(
    phone: string,
    code: string,
    uuid: string
  ): Promise<string> {
    if (!code || code.length !== 6) {
      return '短信验证码格式错误';
    }
    if (!uuid) {
      return '短信验证码已失效';
    }

    const codeKey = CACHE_SMS_CODE + ':' + uuid;
    const codeValue = await this.redis.get('', codeKey);
    if (!codeValue) {
      return '短信验证码已失效';
    }
    if (codeValue !== `${phone}:${code}`) {
      return '短信验证码错误';
    }

    await this.redis.del('', codeKey);
    await this.redis.del('', CACHE_SMS_CODE_COOLDOWN + ':' + phone);
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
    const [, , , err] = await this.passwordRetryCount(username);
    if (err) {
      return [info, err];
    }

    // 查询用户登录账号
    const sysUser = await this.sysUserService.findByUserName(username);
    if (sysUser.userName !== username) {
      return [info, 'user does not exist or password is incorrect'];
    }
    if (sysUser.userDel === STATUS_YES) {
      return [info, 'sorry, your account has been deleted'];
    }
    if (sysUser.userStatus === STATUS_NO) {
      return [info, 'sorry, your account has been disabled'];
    }

    // 检验用户密码
    const compareBool = await passwordVerify(password, sysUser.userPassword);
    if (compareBool) {
      if (!sysUser.userPassword.startsWith('$argon2')) {
        sysUser.userPassword = password;
        await this.sysUserService.update(sysUser);
      }
      await this.clearLoginRecordCache(username);
      return this.buildUserInfo(sysUser);
    }
    return [info, 'user does not exist or password is incorrect'];
  }

  /**
   * 用户ID刷新令牌创建用户信息
   * @param userId 登录ID
   * @return [UserInfo, string] 登录用户信息对象和错误结果信息
   */
  public async byUserId(userId: number): Promise<[UserInfo, string]> {
    const sysUser = await this.sysUserService.findById(userId);
    if (sysUser.id !== userId) {
      return [new UserInfo(), 'user does not exist'];
    }
    return this.buildUserInfo(sysUser);
  }

  /**
   * 手机号验证码登录创建用户信息
   * @param phone 手机号
   * @return [UserInfo, string] 登录用户信息对象和错误结果信息
   */
  public async byPhone(phone: string): Promise<[UserInfo, string]> {
    const sysUser = await this.sysUserService.findByPhone(phone);
    if (sysUser.userPhone !== phone || sysUser.id <= 0) {
      return [new UserInfo(), 'user does not exist'];
    }
    return this.buildUserInfo(sysUser);
  }

  /**
   * 更新登录时间和IP
   * @param info 登录用户信息对象
   * @returns 记录完成
   */
  public async updateLoginDateAndIP(info: UserInfo): Promise<boolean> {
    const item = await this.sysUserService.findById(info.userId);
    item.userPassword = ''; // 密码不更新
    item.userLoginIp = info.loginIp;
    item.userLoginTime = info.loginTime;
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
    const maxRetryCountStr = await this.sysConfigService.findValueByKey(
      'sys.user.max_retry_count',
      'sys.account.passwordRetryMaxCount'
    );
    const lockTimeStr = await this.sysConfigService.findValueByKey(
      'sys.user.lock_time',
      'sys.account.passwordRetryLockTime'
    );
    const maxRetryCount: number = parseNumber(maxRetryCountStr);
    const lockTime: number = parseNumber(lockTimeStr);

    const base64UserName = Buffer.from(username, 'utf8').toString('base64');
    const retryKey = CACHE_PWD_ERR_COUNT + ':' + base64UserName;

    const retryCount = await this.redis.incrWithExpire(
      '',
      retryKey,
      lockTime * 60
    );

    if (retryCount >= maxRetryCount) {
      const msg = `密码输入错误 ${maxRetryCount} 次，帐户锁定 ${lockTime} 分钟`;
      return [retryKey, retryCount, lockTime * 60, msg];
    }
    return [retryKey, retryCount, lockTime * 60, ''];
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
  ): Promise<AuthMenu[]> {
    let buildMenus: AuthMenu[];
    if (isSystemUser) {
      const menus = await this.sysMenuService.buildTreeMenusByUserId(0);
      buildMenus = this.sysMenuService.buildAuthMenus(menus);
    } else {
      const menus = await this.sysMenuService.buildTreeMenusByUserId(userId);
      buildMenus = this.sysMenuService.buildAuthMenus(menus);
    }
    return buildMenus;
  }

  /**
   * 构建用户信息
   * @param sysUser 系统用户信息
   * @returns [UserInfo, string] 用户信息对象和错误结果信息
   */
  private async buildUserInfo(sysUser: SysUser): Promise<[UserInfo, string]> {
    const info = new UserInfo();
    if (sysUser.userDel === STATUS_YES) {
      return [
        info,
        'sorry, your account has been deleted. Sorry, your account has been deleted',
      ];
    }
    if (sysUser.userStatus === STATUS_NO) {
      return [info, 'sorry, your account has been disabled'];
    }
    info.userId = sysUser.id;
    info.deptId = sysUser.deptId;
    info.userName = sysUser.userName;
    info.roleKeys = (sysUser.roles ?? []).map(role => role.roleKey);
    info.user = sysUser;
    if (this.config.isSystemUser(sysUser.id)) {
      info.permissions = [SYS_PERMISSION_SYSTEM];
    } else {
      const perms = await this.sysMenuService.findPermsByUserId(sysUser.id);
      info.permissions = [...new Set(perms)];
    }
    return [info, ''];
  }
}
