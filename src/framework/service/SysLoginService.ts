import { Provide, Inject } from '@midwayjs/decorator';
import { LoginBody } from '../core/vo/LoginBody';
import { SysUser } from '../core/model/SysUser';
import {
  CAPTCHA_CODE_KEY,
  PWD_ERR_CNT_KEY,
} from '../../common/constants/CacheKeysConstants';
import { RedisCache } from '../redis/RedisCache';
import { Context } from '@midwayjs/koa';
import { TokenService } from './TokenService';
import { LoginUser } from '../core/vo/LoginUser';
import { UserStatus } from '../../common/enums/UserStatusEnum';
import { PermissionService } from './PermissionService';
import { parseNumber } from '../../common/utils/ParseUtils';
import { bcryptCompare } from '../../common/utils/CryptoUtils';
import { SysConfigServiceImpl } from '../../modules/system/service/impl/SysConfigServiceImpl';
import { SysUserServiceImpl } from '../../modules/system/service/impl/SysUserServiceImpl';

/**
 * 登录校验方法
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysLoginService {
  @Inject()
  private ctx: Context;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private permissionService: PermissionService;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  /**
   * 登录生成token
   * @param loginBody 登录参数信息
   * @returns 生成的token
   */
  public async login(loginBody: LoginBody): Promise<string> {
    // 验证码开关及验证码检查
    const captchaEnabled = await this.sysConfigService.selectCaptchaEnabled();
    if (captchaEnabled) {
      await this.validateCaptcha(loginBody.code, loginBody.uuid);
    }
    // 用户验证
    const loginUser = await this.loadUserByUsername(
      loginBody.username,
      loginBody.password
    );
    // 记录登录信息
    await this.recordLoginInfo(loginUser.userId);
    // 生成token
    return await this.tokenService.createToken(loginUser);
  }

  /**
   * 校验验证码
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 结果
   */
  private async validateCaptcha(code: string, uuid: string): Promise<void> {
    const verifyKey = CAPTCHA_CODE_KEY + uuid;
    const captcha = await this.redisCache.get(verifyKey);
    await this.redisCache.del(verifyKey);
    if (!captcha) {
      // 记录登录信息
      // TODO com/ruoyi/framework/manager/factory/AsyncFactory.java
      this.ctx.logger.info('验证码失效 %s', code);
      // 验证码失效
      throw new Error('user.captcha.expire');
    }
    if (code !== captcha) {
      // 记录登录信息
      // TODO com/ruoyi/framework/manager/factory/AsyncFactory.java
      this.ctx.logger.info('验证码错误 %s', code);
      // 验证码错误
      throw new Error('user.captcha.error');
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
    const sysUser = await this.sysUserService.selectUserByUserName(username);
    if (!sysUser) {
      this.ctx.logger.info('登录用户：%s 不存在.', username);
      throw new Error('user.not.exists');
    }
    if (sysUser.delFlag === UserStatus.DELETED) {
      this.ctx.logger.info('登录用户：%s 已被删除.', username);
      throw new Error('user.password.delete');
    }
    if (sysUser.status === UserStatus.DISABLE) {
      this.ctx.logger.info('登录用户：%s 已被停用.', username);
      throw new Error('user.blocked');
    }
    // 检查密码
    await this.validatePassword(sysUser.userName, sysUser.password, password);
    // 用户权限组标识
    const permissions = await this.permissionService.getMenuPermission(sysUser);
    return await this.tokenService.createLoginUser(sysUser, permissions);
  }

  /**
   * 记录登录信息
   * @param userId 用户ID
   * @returns 是否登记完成
   */
  private async recordLoginInfo(userId: string) {
    const user = new SysUser();
    user.userId = userId;
    user.loginIp = this.ctx.ip;
    user.loginTime = new Date().getTime();
    return await this.sysUserService.updateUserProfile(user);
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
    const userConfig = this.ctx.app.getConfig('user');
    const { maxRetryCount, lockTime } = userConfig.password;
    // 验证缓存记录次数
    const cacheKey = PWD_ERR_CNT_KEY + loginName;
    let retryCount = await this.redisCache.get(cacheKey);
    if (retryCount === null) {
      retryCount = '0';
    }
    // 是否超过错误值
    if (parseNumber(retryCount) >= parseNumber(maxRetryCount)) {
      this.ctx.logger.info(
        '密码输入错误 %s 次，帐户锁定 %s 分钟',
        maxRetryCount,
        lockTime
      );
      throw new Error('user.password.retry.limit.exceed');
    }
    // 匹配用户密码，清除错误记录次数
    const compareBool = await bcryptCompare(originPassword, hashPassword);
    if (compareBool) {
      this.clearLoginRecordCache(loginName);
    } else {
      retryCount = `${parseNumber(retryCount) + 1}`;
      this.ctx.logger.info('密码输入错误 %s 次', retryCount);
      // throw new Error("user.password.retry.limit.count");
      throw new Error('user.password.not.match');
    }
  }

  /**
   * 清楚登录错误次数
   * @param loginName 登录用户名
   */
  public async clearLoginRecordCache(loginName: string): Promise<void> {
    const cacheKey = PWD_ERR_CNT_KEY + loginName;
    const hasBool = await this.redisCache.hasKey(cacheKey);
    if (hasBool) {
      await this.redisCache.del(cacheKey);
    }
  }
}
