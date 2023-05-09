import { Provide, Inject } from '@midwayjs/decorator';
import {
  CAPTCHA_CODE_KEY,
  PWD_ERR_CNT_KEY,
} from '../constants/CacheKeysConstants';
import { RedisCache } from '../cache/RedisCache';
import { TokenService } from './TokenService';
import { LoginUser } from '../model/LoginUser';
import { parseBoolean, parseNumber } from '../utils/ValueParseUtils';
import { bcryptCompare } from '../utils/CryptoUtils';
import { SysConfigServiceImpl } from '../../modules/system/service/impl/SysConfigServiceImpl';
import { SysUserServiceImpl } from '../../modules/system/service/impl/SysUserServiceImpl';
import { SysLogininforServiceImpl } from '../../modules/monitor/service/impl/SysLogininforServiceImpl';
import { ContextService } from './ContextService';
import {
  IP_INNER_ADDR,
  STATUS_NO,
  STATUS_YES,
} from '../constants/CommonConstants';
import { LoginBodyVo } from '../../modules/system/model/vo/LoginBodyVo';
import { SysUser } from '../../modules/system/model/SysUser';
import { TOKEN_KEY } from '../constants/TokenConstants';

/**
 * 登录校验方法
 *
 * @author TsMask
 */
@Provide()
export class SysLoginService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysLogininforService: SysLogininforServiceImpl;

  /**
   * 登出清除token
   */
  async logout(): Promise<void> {
    // 获取token在请求头标识信息
    const ctx = this.contextService.getContext();
    const token = await this.tokenService.getHeaderToken(ctx.get(TOKEN_KEY));
    if (!token) return;

    // 存在token时记录退出信息
    const userName = await this.tokenService.removeToken(token);
    if (userName) {
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_YES,
        '退出成功',
        userName
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
    }
  }

  /**
   * 登录生成token
   * @param loginBodyVo 登录参数信息
   * @returns 生成的token
   */
  async login(loginBodyVo: LoginBodyVo): Promise<string> {
    // 验证码检查，从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr =
      await this.sysConfigService.selectConfigValueByKey(
        'sys.account.captchaEnabled'
      );
    const captchaEnabled = parseBoolean(captchaEnabledStr);
    if (captchaEnabled) {
      await this.validateCaptcha(
        loginBodyVo.username,
        loginBodyVo.code,
        loginBodyVo.uuid
      );
    }
    // 用户验证
    const loginUser = await this.loadUserByUsername(
      loginBodyVo.username,
      loginBodyVo.password
    );
    // 记录登录信息
    await this.recordLoginInfo(loginUser.userId);
    const sysLogininfor = await this.contextService.newSysLogininfor(
      STATUS_YES,
      '登录成功',
      loginBodyVo.username
    );
    await this.sysLogininforService.insertLogininfor(sysLogininfor);
    // 生成token
    const clientIp = this.contextService.getContext().ip;
    const userAgent = this.contextService.getContext().get('user-agent');
    return await this.tokenService.createToken(loginUser, clientIp, userAgent);
  }

  /**
   * 校验验证码
   * @param username 登录用户名
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 结果
   */
  private async validateCaptcha(
    username: string,
    code: string,
    uuid: string
  ): Promise<void> {
    const verifyKey = CAPTCHA_CODE_KEY + uuid;
    const captcha = await this.redisCache.get(verifyKey);
    await this.redisCache.del(verifyKey);
    if (!captcha) {
      // 验证码失效
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        `验证码失效 ${code}`,
        username
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('验证码已失效');
    }
    if (code !== captcha) {
      // 验证码错误
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        `验证码错误 ${code}`,
        username
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('验证码错误');
    }
  }

  /**
   * 用户验证处理
   * @param username 登录用户名
   * @param password 登录密码
   * @returns 登录用户信息
   */
  private async loadUserByUsername(
    username: string,
    password: string
  ): Promise<LoginUser> {
    const sysUser: SysUser = await this.sysUserService.selectUserByUserName(
      username
    );
    if (!sysUser) {
      const msg = `登录用户：${username} 不存在`;
      this.contextService.getLogger().info(msg);
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        msg,
        username
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('用户不存在或密码错误');
    }
    if (sysUser.delFlag === STATUS_YES) {
      const msg = `登录用户：${username} 已被删除`;
      this.contextService.getLogger().info(msg);
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        msg,
        username
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('对不起，您的账号已被删除');
    }
    if (sysUser.status === STATUS_NO) {
      const msg = `登录用户：${username} 已被停用`;
      this.contextService.getLogger().info(msg);
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        msg,
        username
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('用户已封禁，请联系管理员');
    }
    // 检查密码
    await this.validatePassword(sysUser.userName, sysUser.password, password);
    // 检查是否管理员，给予拥有所有权限
    const isAdmin = this.contextService.isAdmin(sysUser.userId);
    return await this.tokenService.createLoginUser(sysUser, isAdmin);
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
   * 验证登录次数和密码校验
   * @param loginName 用户名
   * @param hashPassword 加密密码
   * @param originPassword 原始密码
   */
  private async validatePassword(
    loginName: string,
    hashPassword: string,
    originPassword: string
  ): Promise<void> {
    // 从本地配置获取user信息
    const userConfig = this.contextService.getConfig('user');
    const { maxRetryCount, lockTime } = userConfig.password;
    // 验证缓存记录次数
    const cacheKey = PWD_ERR_CNT_KEY + loginName;
    let retryCount = await this.redisCache.get(cacheKey);
    if (!retryCount) {
      retryCount = '0';
    }
    // 是否超过错误值
    if (parseNumber(retryCount) >= parseNumber(maxRetryCount)) {
      const msg = `密码输入错误 ${maxRetryCount} 次，帐户锁定 ${lockTime} 分钟`;
      this.contextService.getLogger().info(msg);
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        msg,
        loginName
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error(msg);
    }
    // 匹配用户密码，清除错误记录次数
    const compareBool = await bcryptCompare(originPassword, hashPassword);
    if (compareBool) {
      await this.clearLoginRecordCache(loginName);
    } else {
      const errCount = parseNumber(retryCount) + 1;
      await this.redisCache.setByExpire(
        cacheKey,
        errCount,
        parseNumber(lockTime) * 60
      );
      const sysLogininfor = await this.contextService.newSysLogininfor(
        STATUS_NO,
        `密码输入错误 ${errCount} 次`,
        loginName
      );
      await this.sysLogininforService.insertLogininfor(sysLogininfor);
      throw new Error('用户不存在/密码错误');
    }
  }

  /**
   * 清除错误记录次数
   * @param loginName 登录用户名
   */
  async clearLoginRecordCache(loginName: string): Promise<boolean> {
    const cacheKey = PWD_ERR_CNT_KEY + loginName;
    if (await this.redisCache.hasKey(cacheKey)) {
      const rows = await this.redisCache.del(cacheKey);
      return rows > 0;
    }
    return false;
  }
}
