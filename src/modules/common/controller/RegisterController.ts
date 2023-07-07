import { Controller, Body, Post, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { SysRegisterService } from '../../../framework/service/SysRegisterService';
import {
  validPassword,
  validUsername,
} from '../../../framework/utils/RegularUtils';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { RegisterBodyVo } from '../../../framework/model/vo/RegisterBodyVo';

/**
 * 注册验证
 *
 * @author TsMask
 */
@Controller()
export class RegisterController {
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

    // 进行注册
    const msg = await this.sysRegisterService.register(registerBodyVo);
    if (msg !== 'ok') {
      return Result.errMsg(msg);
    }
    return Result.ok();
  }
}
