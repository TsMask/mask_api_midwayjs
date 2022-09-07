// import { Controller, Post, Inject, Body } from '@midwayjs/decorator';
// import { Context } from '@midwayjs/koa';
// import { AccountUsersService } from '../service/account_users.service';
// import { AccountVerifyCodeService } from '../service/account_verify_code.service';
// import {
//   valid_email,
//   valid_mobile,
//   valid_nick,
//   valid_username,
// } from '../utils/regular.utils';
// import {
//   PARAM_NOT_COMPLETE,
//   USER_NAME_FORMAT_ERROR,
//   USER_PASSWORD_FORMAT_ERROR,
//   USER_NICK_FORMAT_ERROR,
//   USER_HAS_EXIST,
//   SUCCESS,
//   ResultDTO,
//   USER_NICK_EXIST_ERROR,
//   FAILURE,
//   PARAM_IS_INVALID,
//   PARAM_IS_BLANK,
//   USER_MOBILE_FORMAT_ERROR,
//   USER_EMAIL_FORMAT_ERROR,
//   SVERVIC_EMAIL_FREQUENTLY_ERROR,
//   SVERVIC_SMS_FREQUENTLY_ERROR,
// } from '../utils/result.utils';

// @Controller('/account')
// export class AccountController {
//   @Inject()
//   private ctx: Context;

//   @Inject()
//   private AccountUsersService: AccountUsersService;

//   @Inject()
//   private AccountVerifyCodeService: AccountVerifyCodeService;

//   /**
//    * 注册用户
//    * json { signature_secret, nickname, gender, avatar }
//    * signature_secret = username^md5(password)
//    */
//   @Post('/register')
//   public async register(@Body() args: any): Promise<ResultDTO> {
//     const { signature_secret, nickname, gender, avatar } = args;

//     // 确保参数必传
//     if (!signature_secret) {
//       return PARAM_IS_INVALID;
//     }

//     // signature_secret解密base64
//     const signature = Buffer.from(signature_secret, 'base64').toString('utf8');
//     if (!signature.includes('^')) {
//       return PARAM_NOT_COMPLETE;
//     }
//     const signatureArr = signature.split('^');
//     if (signatureArr.length !== 2) {
//       return PARAM_IS_BLANK;
//     }
//     const [username, password] = signatureArr;

//     // 用户昵称格式校验
//     if (!nickname || !valid_nick(nickname)) {
//       return USER_NICK_FORMAT_ERROR;
//     }

//     // 用户昵称是否已存在
//     if (await this.AccountUsersService.check_user_by('nickname', nickname)) {
//       return USER_NICK_EXIST_ERROR;
//     }

//     // 密码格式校验
//     if (password.length !== 32) {
//       return USER_PASSWORD_FORMAT_ERROR;
//     }

//     // 用户名格式校验
//     if (!valid_username(username)) {
//       return USER_NAME_FORMAT_ERROR;
//     }

//     // 用户名是否已存在
//     if (await this.AccountUsersService.check_user_by('username', username)) {
//       return USER_HAS_EXIST;
//     }

//     // 是否生成记录
//     const ok = await this.AccountUsersService.account_register({
//       username,
//       password,
//       nickname,
//       gender,
//       avatar,
//       ip: this.ctx.ip,
//     });
//     // 结果返回
//     return ok ? SUCCESS : FAILURE;
//   }

//   /**
//    * 登出
//    */
//   @Post('/logout')
//   public async logout(): Promise<ResultDTO> {
//     // 将对应uid的用户的token清除的过程
//     return SUCCESS;
//   }

//   /**
//    * 发送验证码
//    * json { account, scene }
//    */
//   @Post('/send_code')
//   public async send_code(@Body() args: any): Promise<ResultDTO> {
//     const { account, scene } = args;
//     if (!account || !scene) {
//       return PARAM_IS_BLANK;
//     }
//     // 参数体
//     const data = {
//       ua: this.ctx.get('user-agent'),
//       ip: this.ctx.ip,
//       uid: this.ctx.getAttr<string>('jti'),
//       scene,
//     };

//     // 邮箱格式校验 含@
//     if (account.includes('@')) {
//       if (valid_email(account)) {
//         const ok = await this.AccountVerifyCodeService.send_code_email({
//           ...data,
//           email: account,
//         });
//         return ok ? SUCCESS : SVERVIC_EMAIL_FREQUENTLY_ERROR;
//       }
//       return USER_EMAIL_FORMAT_ERROR;
//     }

//     // 手机号格式校验 1开头
//     if (account.startsWith('1') && account.length === 11) {
//       if (valid_mobile(account)) {
//         const ok = await this.AccountVerifyCodeService.send_code_sms({
//           ...data,
//           mobile: account,
//         });
//         return ok ? SUCCESS : SVERVIC_SMS_FREQUENTLY_ERROR;
//       }
//       return USER_MOBILE_FORMAT_ERROR;
//     }

//     return FAILURE;
//   }
// }
