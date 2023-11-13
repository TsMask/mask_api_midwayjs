import { Provide, Inject } from '@midwayjs/decorator';
import { CAPTCHA_CODE_KEY } from '../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { SysUserServiceImpl } from '../../system/service/impl/SysUserServiceImpl';
import { SysLogLoginServiceImpl } from '../../system/service/impl/SysLogLoginServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../framework/constants/CommonConstants';
import { SysUser } from '../../system/model/SysUser';

/**
 * 注册校验方法
 *
 * @author TsMask
 */
@Provide()
export class SysRegisterService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysLogLoginService: SysLogLoginServiceImpl;

  /**
   * 账号注册
   *
   * @param username 登录用户名
   * @param password 密码
   * @param userType 用户类型
   * @returns 注册信息
   */
  async register(
    username: string,
    password: string,
    userType: string
  ): Promise<string> {
    // 是否开启用户注册功能 true开启，false关闭
    const registerUserStr = await this.sysConfigService.selectConfigValueByKey(
      'sys.account.registerUser'
    );
    if (!parseBoolean(registerUserStr)) {
      return `注册用户【${username}】失败，很抱歉，系统已关闭外部用户注册通道`;
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      username
    );
    if (!uniqueUserName) {
      return `注册用户【${username}】失败，注册账号已存在`;
    }

    const sysUser = new SysUser();
    sysUser.userName = username;
    sysUser.nickName = username; // 昵称使用名称账号
    sysUser.status = STATUS_YES; // 账号状态激活
    sysUser.password = password;
    // 归属部门为根节点
    sysUser.deptId = '100';
    // 标记用户类型
    sysUser.userType = userType || 'sys';
    // 新增用户的角色管理
    sysUser.roleIds = this.registerRoleInit(userType);
    // 新增用户的岗位管理
    sysUser.postIds = this.registerPostInit(userType);
    // 创建来源
    sysUser.createBy = '注册';

    // 添加到数据库中
    const insertId = await this.sysUserService.insertUser(sysUser);
    if (insertId) {
      // 解析ip地址和请求用户代理信息
      const il = await this.contextService.ipaddrLocation();
      const ob = await this.contextService.uaOsBrowser();
      await this.sysLogLoginService.createSysLogLogin(
        sysUser.userName,
        STATUS_YES,
        '注册成功',
        ...il,
        ...ob
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
   * 注册初始角色
   * @param userType 用户类型
   * @returns 角色id组
   */
  private registerRoleInit(userType: string): string[] {
    if (userType === 'sys') {
      return [];
    }
    return [];
  }

  /**
   * 注册初始岗位
   * @param userType 用户类型
   * @returns 岗位id组
   */
  private registerPostInit(userType: string): string[] {
    if (userType === 'sys') {
      return [];
    }
    return [];
  }
}
