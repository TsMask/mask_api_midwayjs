import { Provide, Inject, Singleton } from '@midwayjs/core';

import { CACHE_CAPTCHA_CODE } from '../../../internal/shared/constants/cache_key';
import { STATUS_YES } from '../../../internal/shared/constants/common';
import { parseBoolean } from '../../../internal/shared/parse/parse';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { generateString } from '../../../internal/shared/generate/generate';
import { SysConfigService } from '../../system/service/sys_config';
import { SysUserService } from '../../system/service/sys_user';
import { SysUser } from '../../system/model/sys_user';
import { AccountService } from './account';

/**账号注册操作 服务层处理 */
@Provide()
@Singleton()
export class RegisterService {
  /**缓存操作 */
  @Inject()
  private redis: RedisCache;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**用户信息服务 */
  @Inject()
  private sysUserService: SysUserService;

  /**账号身份操作服务 */
  @Inject()
  private accountService: AccountService;

  /**
   * 校验验证码
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 错误结果信息
   */
  public async validateCaptcha(code: string, uuid: string): Promise<string> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
      'sys.account.captcha_enabled'
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
    if (captcha !== code) {
      return 'captcha error';
    }
    return '';
  }

  /**
   * 校验手机号注册短信验证码
   * @param phone 手机号
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 错误结果信息
   */
  public async validateSmsCaptcha(
    phone: string,
    code: string,
    uuid: string
  ): Promise<string> {
    return await this.accountService.validateCaptchaSMS(phone, code, uuid);
  }

  /**
   * 账号注册
   * @param username 登录用户名
   * @param password 密码
   * @returns [用户ID, 错误信息]
   */
  public async byUserName(
    username: string,
    password: string
  ): Promise<[number, string]> {
    // 是否开启用户注册功能 true开启，false关闭
    const registerUserStr =
      await this.sysConfigService.findValueByKey('sys.user.register');
    const captchaEnabled = parseBoolean(registerUserStr);
    if (!captchaEnabled) {
      return [0, '很抱歉，系统已关闭外部用户注册通道'];
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueByUserName(
      username,
      0
    );
    if (!uniqueUserName) {
      return [0, `注册用户【${username}】失败，注册账号已存在`];
    }

    const sysUser = new SysUser();
    sysUser.user_name = username;
    sysUser.user_nick = username; // 昵称使用名称账号
    sysUser.user_password = password; // 原始密码
    sysUser.user_gender = '0'; // 性别未选择
    sysUser.user_status = STATUS_YES; // 账号状态激活
    sysUser.dept_id = 100; // 归属部门为根节点
    sysUser.create_by = 'reg-user'; // 创建来源

    // 新增用户的角色管理
    sysUser.role_ids = this.registerRoleInit();
    // 新增用户的岗位管理
    sysUser.post_ids = this.registerPostInit();

    const insertId = await this.sysUserService.insert(sysUser);
    if (insertId) {
      return [insertId, ''];
    }
    return [0, `注册用户【${username}】失败，请联系系统管理员`];
  }

  /**
   * 手机号验证码注册
   * @param phone 手机号
   * @returns [用户ID, 错误信息]
   */
  public async byPhone(phone: string): Promise<[number, string]> {
    const registerUserStr =
      await this.sysConfigService.findValueByKey('sys.user.register');
    if (!parseBoolean(registerUserStr)) {
      return [0, '很抱歉，系统已关闭外部用户注册通道'];
    }

    const uniqueUserName = await this.sysUserService.checkUniqueByUserName(
      phone,
      0
    );
    if (!uniqueUserName) {
      return [0, `注册用户【${phone}】失败，注册账号已存在`];
    }
    const uniquePhone = await this.sysUserService.checkUniqueByPhone(phone, 0);
    if (!uniquePhone) {
      return [0, `注册用户【${phone}】失败，手机号码已存在`];
    }

    const sysUser = new SysUser();
    sysUser.user_name = phone;
    sysUser.user_phone = phone;
    sysUser.user_nick = phone;
    sysUser.user_password = generateString(32);
    sysUser.user_gender = '0';
    sysUser.user_status = STATUS_YES;
    sysUser.dept_id = 100;
    sysUser.create_by = 'reg-phone';
    sysUser.role_ids = this.registerRoleInit();
    sysUser.post_ids = this.registerPostInit();

    const insertId = await this.sysUserService.insert(sysUser);
    if (insertId > 0) {
      return [insertId, ''];
    }
    return [0, `注册用户【${phone}】失败，请联系系统管理员`];
  }

  /**
   * 注册初始角色
   * @returns 角色id组
   */
  private registerRoleInit(): number[] {
    return [];
  }

  /**
   * 注册初始岗位
   * @returns 岗位id组
   */
  private registerPostInit(): number[] {
    return [];
  }
}
