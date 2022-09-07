// import { Controller, Post, Inject } from '@midwayjs/decorator';
// import { Context } from '@midwayjs/koa';
// import { AccountUsersService } from '../service/account_users.service';
// import {
//   valid_email,
//   valid_mobile,
//   valid_username,
// } from '../utils/regular.utils';
// import {
//   PARAM_IS_BLANK,
//   PARAM_IS_INVALID,
//   PARAM_NOT_COMPLETE,
//   ResultDTO,
//   SUCCESS_DATA,
//   USER_EMAIL_FORMAT_ERROR,
//   USER_EMAIL_LOGIN_ERROR,
//   USER_MOBILE_FORMAT_ERROR,
//   USER_MOBILE_LOGIN_ERROR,
//   USER_NAME_FORMAT_ERROR,
//   USER_NAME_LOGIN_ERROR,
//   USER_NOT_EXIST,
//   USER_PASSWORD_FORMAT_ERROR,
// } from '../utils/result.utils';

// @Controller('/account_login')
// export class AccountLoginController {
//   @Inject()
//   private ctx: Context;

//   @Inject()
//   private AccountUsersService: AccountUsersService;

//   /**
//    * 用户名密码登录
//    * json { signature_secret }
//    * signature_secret = Base64(account^password)
//    */
//   @Post('/')
//   public async index(): Promise<ResultDTO> {
//     const { signature_secret } = this.ctx.request.body;
//     // 确保参数必传
//     if (!signature_secret) {
//       return PARAM_IS_INVALID;
//     }

//     // signature_secret解密base64
//     const signature = Buffer.from(signature_secret, 'base64').toString('utf8');
//     if (!signature.includes('^')) {
//       return PARAM_NOT_COMPLETE;
//     }
//     const args = signature.split('^');
//     if (args.length !== 2) {
//       return PARAM_IS_BLANK;
//     }
//     const [account, password] = args;

//     // 密码格式校验
//     if (password.length !== 32) {
//       return USER_PASSWORD_FORMAT_ERROR;
//     }

//     const arg = { account, password, ip: this.ctx.ip };

//     // 邮箱格式校验 含@
//     if (account.includes('@')) {
//       if (valid_email(account)) {
//         const token = await this.AccountUsersService.account_login_by(
//           'email',
//           arg
//         );
//         if (token.exp > 0) {
//           return SUCCESS_DATA(token);
//         }
//         return USER_EMAIL_LOGIN_ERROR;
//       }
//       return USER_EMAIL_FORMAT_ERROR;
//     }

//     // 手机号格式校验 1开头
//     if (account.startsWith('1') && account.length === 11) {
//       if (valid_mobile(account)) {
//         const token = await this.AccountUsersService.account_login_by(
//           'mobile',
//           arg
//         );
//         if (token.exp > 0) {
//           return SUCCESS_DATA(token);
//         }
//         return USER_MOBILE_LOGIN_ERROR;
//       }
//       return USER_MOBILE_FORMAT_ERROR;
//     }

//     // 用户名格式校验 无特殊字符
//     if (!valid_username(account)) {
//       return USER_NAME_FORMAT_ERROR;
//     } else if (valid_username(account)) {
//       const token = await this.AccountUsersService.account_login_by(
//         'username',
//         arg
//       );
//       if (token.exp > 0) {
//         return SUCCESS_DATA(token);
//       }
//       return USER_NAME_LOGIN_ERROR;
//     }

//     return USER_NOT_EXIST;
//   }
// }
