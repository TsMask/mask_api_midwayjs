import { Provide, Inject, Singleton } from '@midwayjs/core';

import { CACHE_CAPTCHA_CODE } from '../../../framework/constants/cache_key';
import { STATUS_YES } from '../../../framework/constants/common';
import { parseBoolean } from '../../../framework/utils/parse/parse';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { SysConfigService } from '../../system/service/sys_config';
import { SysUserService } from '../../system/service/sys_user';
import { SysUser } from '../../system/model/sys_user';

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
    if (captcha !== code) {
      return 'captcha error';
    }
    return '';
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
    const registerUserStr = await this.sysConfigService.findValueByKey(
      'sys.account.registerUser'
    );
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
    sysUser.userName = username;
    sysUser.nickName = username; // 昵称使用名称账号
    sysUser.password = password; // 原始密码
    sysUser.sex = '0'; // 性别未选择
    sysUser.statusFlag = STATUS_YES; // 账号状态激活
    sysUser.deptId = 100; // 归属部门为根节点
    sysUser.createBy = 'register'; // 创建来源

    // 新增用户的角色管理
    sysUser.roleIds = this.registerRoleInit();
    // 新增用户的岗位管理
    sysUser.postIds = this.registerPostInit();

    const insertId = await this.sysUserService.insert(sysUser);
    if (insertId) {
      return [insertId, ''];
    }
    return [0, `注册用户【${username}】失败，请联系系统管理人员`];
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
