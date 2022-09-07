// import { Provide, App, Inject } from '@midwayjs/decorator';
// import { Application } from '@midwayjs/koa';
// import { AccountVerifyCodes } from '../entity/account_verify_codes.entity';
// import { AccountVerifyCodesRepository } from '../repository/account_verify_codes.repository';
// import { parse_number } from '../utils/context .utils';
// import { random_number } from '../utils/uid.utils';

// @Provide()
// export class AccountVerifyCodeService {
//   @App()
//   private app: Application;

//   @Inject()
//   AccountVerifyCodesRepository: AccountVerifyCodesRepository;

//   /**
//    * 发送验证码-短信
//    * @param arg { ua, ip, scene, uid, mobile }
//    * @returns 是否发送成功
//    */
//   public async send_code_sms(arg: any): Promise<boolean> {
//     const { ua, ip, scene, uid, mobile } = arg;

//     // 查询验证码是否在有效期
//     const has = await this.AccountVerifyCodesRepository.find_verify_code_by(
//       'mobile',
//       mobile
//     );
//     if (has.mobile === mobile) {
//       return false;
//     }

//     // 获取 sms 配置
//     const { exp } = this.app.getConfig('sms');
//     // TODO 调用第三方发送
//     // 创建验证码保存记录
//     const now = new Date().getTime();
//     const vc = new AccountVerifyCodes();
//     vc.createdBy = uid;
//     vc.createdTime = now.toString();
//     vc.mobile = mobile;
//     vc.verifyCode = random_number(6).toString(); // 验证码
//     vc.scene = parse_number(scene); // 场景
//     vc.ip = ip; // IP
//     vc.expiredTime = `${now + parseInt(exp)}`; // 过期时间 5分钟
//     vc.ua = ua;
//     return await this.AccountVerifyCodesRepository.create_verify_code_by(
//       'mobile',
//       vc
//     );
//   }

//   /**
//    * 发送验证码-邮件
//    * @param arg { ua, ip, scene, uid, email, uuid }
//    * @returns 是否发送成功
//    */
//   public async send_code_email(arg: any): Promise<boolean> {
//     const { ua, ip, scene, uid, email, uuid } = arg;
//     // 获取 email 配置
//     const { exp } = this.app.getConfig('email');
//     // TODO 调用第三方发送
//     // 创建验证码保存记录
//     const now = new Date().getTime();
//     const vc = new AccountVerifyCodes();
//     vc.createdBy = uid;
//     vc.createdTime = now.toString();
//     vc.email = email;
//     vc.deviceUuid = uuid; //  设备UID
//     vc.verifyCode = random_number(6).toString(); // 验证码
//     vc.scene = parse_number(scene); // 场景
//     vc.ip = ip; // IP
//     vc.expiredTime = `${now + parseInt(exp)}`; // 过期时间 5分钟
//     vc.ua = ua;
//     return await this.AccountVerifyCodesRepository.create_verify_code_by(
//       'email',
//       vc
//     );
//   }
// }
