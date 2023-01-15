import { Controller, Body, Post, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { RegisterBodyVo } from '../model/vo/RegisterBodyVo';
import { SysConfigServiceImpl } from '../service/impl/SysConfigServiceImpl';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { SysRegisterService } from '../../../framework/service/SysRegisterService';

/**
 * 注册验证
 *
 * @author TsMask
 */
@Controller()
export class SysRegisterController {
  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysRegisterService: SysRegisterService;

  /**
   * 系统注册
   */
  @Post('/register')
  @RateLimit({ time: 300, count: 20, limitType: LimitTypeEnum.IP })
  async login(@Body() registerBodyVo: RegisterBodyVo): Promise<Result> {
    // 从数据库配置获取是否开启用户注册功能 true开启，false关闭
    const registerUserStr = await this.sysConfigService.selectConfigValueByKey(
      'sys.account.registerUser'
    );
    const registerUser = parseBoolean(registerUserStr);
    if (!registerUser) {
      return Result.errMsg('当前系统没有开启注册功能！');
    }

    // 判断必传参数
    const username = registerBodyVo.username;
    if (!username) {
      return Result.errMsg('用户名不能为空');
    }
    const usernameLen = username.length;
    if (usernameLen < 2 || usernameLen > 20) {
      return Result.errMsg('账户长度必须在2到20个字符之间');
    }
    const password = registerBodyVo.password;
    if (!password) {
      return Result.errMsg('用户密码不能为空');
    }
    const passwordLen = password.length;
    if (passwordLen < 6 || passwordLen > 20) {
      return Result.errMsg('密码长度必须在6到20个字符之间');
    }
    const confirmPassword = registerBodyVo.confirmPassword;
    if (!confirmPassword) {
      return Result.errMsg('用户确认密码不能为空');
    }
    if (password !== confirmPassword) {
      return Result.errMsg('用户确认输入密码不一致');
    }

    // 进行注册
    const msg = await this.sysRegisterService.register(registerBodyVo);
    if (msg !== 'ok') {
      return Result.errMsg(msg);
    }
    return Result.ok();
  }
}
