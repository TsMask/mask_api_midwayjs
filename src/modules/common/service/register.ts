import { Provide, Inject } from '@midwayjs/core';
import { CACHE_CAPTCHA_CODE } from '../../../framework/constants/cache_key';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { ContextService } from '../../../framework/service/ContextService';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { SysUser } from '../../system/model/sys_user';
import { SysConfigService } from '../../system/service/sys_config';
import { SysLogLoginService } from '../../system/service/sys_log_login';
import { SysUserService } from '../../system/service/sys_user';

/**
 * 注册校验方法
 */
@Provide()
export class RegisterService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private sysConfigService: SysConfigService;

  @Inject()
  private sysUserService: SysUserService;

  @Inject()
  private sysLogLoginService: SysLogLoginService;

  /**
   * 账号注册
   *
   * @param username 登录用户名
   * @param password 密码
   * @returns 注册信息
   */
  async register(username: string, password: string): Promise<string> {
    // 是否开启用户注册功能 true开启，false关闭
    const registerUserStr = await this.sysConfigService.findValueByKey(
      'sys.account.registerUser'
    );
    if (!parseBoolean(registerUserStr)) {
      return `注册用户【${username}】失败，很抱歉，系统已关闭外部用户注册通道`;
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueByUserName(
      username,
      0
    );
    if (!uniqueUserName) {
      return `注册用户【${username}】失败，注册账号已存在`;
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

    // 添加到数据库中
    const insertId = await this.sysUserService.insert(sysUser);
    if (insertId) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.insert(
        sysUser.userName,
        STATUS_YES,
        '注册成功',
        [...il, ...ob]
      );
      return 'ok';
    }
    return `注册用户【${username}】失败，请联系系统管理人员`;
  }

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
    const captcha = await this.redisCache.get(verifyKey);
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
    await this.redisCache.del(verifyKey);
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
