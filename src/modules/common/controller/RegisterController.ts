import { Controller, Body, Post, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/vo/Result';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { SysRegisterService } from '../service/SysRegisterService';
import {
  validPassword,
  validUsername,
} from '../../../framework/utils/RegularUtils';
import { RegisterBodyVo } from '../model/RegisterBodyVo';

/**
 * 账号注册操作处理
 *
 * @author TsMask
 */
@Controller()
export class RegisterController {
  @Inject()
  private sysRegisterService: SysRegisterService;

  /**
   * 系统注册
   */
  @Post('/register')
  @RateLimit({ time: 300, count: 20, limitType: LimitTypeEnum.IP })
  async register(@Body() registerBodyVo: RegisterBodyVo): Promise<Result> {
    const { username, password, confirmPassword } = registerBodyVo;
    // 判断必传参数
    if (!validUsername(username)) {
      return Result.errMsg(
        '账号不能以数字开头，可包含大写小写字母，数字，且不少于5位'
      );
    }
    if (!validPassword(password)) {
      return Result.errMsg(
        '密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }
    if (password !== confirmPassword) {
      return Result.errMsg('用户确认输入密码不一致');
    }
    // 检查验证码
    await this.sysRegisterService.validateCaptcha(
      username,
      registerBodyVo.code,
      registerBodyVo.uuid
    );

    // 进行注册
    const msg = await this.sysRegisterService.register(
      username,
      password,
      registerBodyVo.userType
    );
    if (msg !== 'ok') {
      return Result.errMsg(msg);
    }
    return Result.ok();
  }
}
