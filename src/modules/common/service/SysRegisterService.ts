import { Provide, Inject } from '@midwayjs/decorator';
import { CAPTCHA_CODE_KEY } from '../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { SysUserServiceImpl } from '../../system/service/impl/SysUserServiceImpl';
import { SysLogininforServiceImpl } from '../../monitor/service/impl/SysLogininforServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { STATUS_YES } from '../../../framework/constants/CommonConstants';
import { SysUser } from '../../system/model/SysUser';
import { RegisterBodyVo } from '../model/RegisterBodyVo';

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
  private sysLogininforService: SysLogininforServiceImpl;

  /**
   * 账号注册
   * @param registerBodyVo 注册参数信息
   * @returns 注册信息
   */
  async register(registerBodyVo: RegisterBodyVo): Promise<string> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr =
      await this.sysConfigService.selectConfigValueByKey(
        'sys.account.captchaEnabled'
      );
    const captchaEnabled = parseBoolean(captchaEnabledStr);
    if (captchaEnabled) {
      await this.validateCaptcha(registerBodyVo.code, registerBodyVo.uuid);
    }

    const { username, password, userType } = registerBodyVo;
    const sysUser = new SysUser();
    sysUser.userName = username;

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      username
    );
    if (!uniqueUserName) {
      return `注册用户【${sysUser.userName}】失败，注册账号已存在`;
    }

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
      await this.sysLogininforService.newLogininfor(
        sysUser.userName,
        STATUS_YES,
        '注册成功',
        ...il,
        ...ob
      );
      return 'ok';
    }
    return '注册失败，请联系系统管理人员';
  }

  /**
   * 校验验证码
   * @param code 验证码
   * @param uuid 唯一标识
   * @return void 或 异常
   */
  private async validateCaptcha(code: string, uuid: string): Promise<void> {
    const verifyKey = CAPTCHA_CODE_KEY + uuid;
    const captcha = await this.redisCache.get(verifyKey);
    await this.redisCache.del(verifyKey);
    if (!captcha) {
      throw new Error('验证码已失效');
    }
    if (code !== captcha) {
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
