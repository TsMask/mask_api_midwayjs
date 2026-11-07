import { Inject, Provide, Singleton } from '@midwayjs/core';

import {
  CACHE_PASSWORD_RESET_CODE,
  CACHE_PASSWORD_RESET_COOLDOWN,
} from '../../../internal/shared/constants/cache_key';
import {
  STATUS_NO,
} from '../../../internal/shared/constants/common';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { UserTokenService } from '../../../internal/web/token/user_token';
import { GlobalConfig } from '../../../internal/config/config';
import {
  generateCode,
  generateNumber,
} from '../../../internal/shared/generate/generate';
import { parseNumber } from '../../../internal/shared/parse/parse';
import {
  validEmail,
  validMobile,
  validUsername,
} from '../../../internal/shared/regular/regular';
import { SysConfigService } from '../../system/service/sys_config';
import { SysUserService } from '../../system/service/sys_user';

/**找回密码目标 */
interface PasswordResetTarget {
  userId: number;
  userName: string;
  channel: 'email' | 'phone';
  contact: string;
}

/**找回密码操作 服务层处理 */
@Provide()
@Singleton()
export class PasswordResetService {
  @Inject()
  private config: GlobalConfig;

  @Inject()
  private redis: RedisCache;

  @Inject()
  private token: UserTokenService;

  @Inject()
  private sysConfigService: SysConfigService;

  @Inject()
  private sysUserService: SysUserService;

  /**
   * 查询找回密码联系方式
   * @param username 用户账号
   * @returns 联系方式信息
   */
  public async lookup(
    username: string
  ): Promise<{ channel: string; maskedContact: string } | string> {
    const target = await this.findTarget(username);
    if (typeof target === 'string') {
      return target;
    }
    return {
      channel: target.channel,
      maskedContact:
        target.channel === 'email'
          ? this.maskEmail(target.contact)
          : this.maskPhone(target.contact),
    };
  }

  /**
   * 发送找回密码验证码。本地环境返回验证码便于调试。
   * @param username 用户账号
   * @returns 验证码信息或错误信息
   */
  public async sendCaptchaEmail(
    username: string
  ): Promise<Record<string, any> | string> {
    const target = await this.findTarget(username);
    if (typeof target === 'string') {
      return target;
    }
    if (this.config.getEnv() !== 'local') {
      return target.channel === 'email' ? '邮箱服务未配置' : '短信服务未配置';
    }

    const expiresIn = await this.configNumber(
      target.channel === 'email'
        ? 'sys.account.captcha_email_expires_in_seconds'
        : 'sys.account.captcha_sms_expires_in_seconds',
      300
    );
    const resendInterval = await this.configNumber(
      target.channel === 'email'
        ? 'sys.account.captcha_email_resend_interval_seconds'
        : 'sys.account.captcha_sms_resend_interval_seconds',
      60
    );
    const cooldownKey = CACHE_PASSWORD_RESET_COOLDOWN + ':' + target.contact;
    if (await this.redis.get('', cooldownKey)) {
      return '验证码发送过于频繁，请稍后再试';
    }

    const code = this.generateCode();
    const uuid = generateCode(32);
    const codeKey = CACHE_PASSWORD_RESET_CODE + ':' + uuid;
    const created = await this.redis.set(
      '',
      codeKey,
      `${target.userName}:${target.contact}:${code}`,
      expiresIn
    );
    const cooldownCreated = await this.redis.set(
      '',
      cooldownKey,
      target.contact,
      resendInterval
    );
    if (!created || !cooldownCreated) {
      await this.redis.del('', codeKey);
      await this.redis.del('', cooldownKey);
      return '验证码生成失败';
    }

    return {
      uuid,
      expires_in: expiresIn,
      resend_interval: resendInterval,
      ...(this.config.getEnv() === 'local' ? { text: code } : {}),
    };
  }

  /**
   * 校验找回密码验证码并重置登录密码
   * @param username 用户账号
   * @param code 验证码
   * @param uuid 唯一标识
   * @param password 新密码
   * @returns 错误信息
   */
  public async reset(
    username: string,
    code: string,
    uuid: string,
    password: string
  ): Promise<string> {
    const target = await this.findTarget(username);
    if (typeof target === 'string') {
      return target;
    }
    if (!code || code.length !== 6 || !uuid) {
      return '验证码格式错误';
    }

    const codeKey = CACHE_PASSWORD_RESET_CODE + ':' + uuid;
    const codeValue = await this.redis.get('', codeKey);
    if (!codeValue) {
      return '验证码已失效';
    }
    if (codeValue !== `${target.userName}:${target.contact}:${code}`) {
      return '验证码错误';
    }

    const user = await this.sysUserService.findByUserName(target.userName);
    if (user.id !== target.userId) {
      return '用户不存在或账号不可自助找回密码';
    }
    user.user_password = password;
    user.update_by = username;
    const rows = await this.sysUserService.update(user);
    if (rows <= 0) {
      return '重置密码失败，请联系系统管理员';
    }

    await this.redis.del('', codeKey);
    await this.redis.del(
      '',
      CACHE_PASSWORD_RESET_COOLDOWN + ':' + target.contact
    );
    await this.token.removeByUserIds([target.userId]);
    return '';
  }

  private async findTarget(
    username: string
  ): Promise<PasswordResetTarget | string> {
    if (!validUsername(username)) {
      return '用户账号格式不正确';
    }
    const user = await this.sysUserService.findByUserName(username);
    if (
      user.user_name !== username ||
      user.id <= 0 ||
      (user.deleted_at ?? 0) > 0 ||
      user.user_status === STATUS_NO
    ) {
      return '用户不存在或账号不可自助找回密码';
    }
    if (validEmail(user.user_email)) {
      return {
        userId: user.id,
        userName: user.user_name,
        channel: 'email',
        contact: user.user_email,
      };
    }
    if (validMobile(user.user_phone)) {
      return {
        userId: user.id,
        userName: user.user_name,
        channel: 'phone',
        contact: user.user_phone,
      };
    }
    return '账号未绑定邮箱或手机号，请联系系统管理员';
  }

  private async configNumber(
    key: string,
    defaultValue: number
  ): Promise<number> {
    const raw = await this.sysConfigService.findValueByKey(key);
    const value = parseNumber(raw);
    return value > 0 ? value : defaultValue;
  }

  private generateCode(): string {
    return String(generateNumber(6)).padStart(6, '0');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '已绑定邮箱';
    }
    return `${local[0]}***@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (phone.length !== 11) {
      return '已绑定手机号';
    }
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }
}
