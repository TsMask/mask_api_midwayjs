// import { Controller, Get, Post, Inject } from '@midwayjs/decorator';
// import { Context } from '@midwayjs/koa';
// import { AccountUsersService } from '../service/account_users.service';
// import { valid_email, valid_mobile } from '../utils/regular.utils';
// import {
//   PARAM_IS_BLANK,
//   PARAM_IS_INVALID,
//   PARAM_NOT_COMPLETE,
//   SUCCESS,
//   SUCCESS_DATA,
//   USER_EMAIL_FORMAT_ERROR,
//   USER_EMAIL_NOT_CONFIRMED,
//   USER_MOBILE_FORMAT_ERROR,
//   USER_MOBILE_NOT_CONFIRMED,
//   USER_NOT_EXIST,
//   USER_PASSWORD_FORMAT_ERROR,
// } from '../utils/result.utils';

// @Controller('/account_info')
// export class AccountInfoController {
//   @Inject()
//   private ctx: Context;

//   @Inject()
//   private AccountUsersService: AccountUsersService;

//   /**
//    * 获取用户信息
//    * query ?uid=U1234
//    */
//   @Get('/')
//   public async get_index() {
//     const uid: string = <string>this.ctx.query['uid'];
//     // 必传用户ID
//     if (!uid) {
//       return PARAM_IS_BLANK;
//     }

//     // 查询用户信息，jti是否当前登录用户
//     const jti = this.ctx.getAttr<string>('jti');
//     const info = await this.AccountUsersService.account_info_by_id(
//       uid,
//       jti === uid
//     );

//     // 是否返回信息
//     if (info.id === uid) {
//       return SUCCESS_DATA(info);
//     }
//     return USER_NOT_EXIST;
//   }

//   /**
//    * 重置密码
//    * json { signature_secret }
//    * signature_secret = Base64(account^password^code)
//    */
//   @Post('/reset_pwd')
//   async reset_pwd() {
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
//     if (args.length !== 3) {
//       return PARAM_IS_BLANK;
//     }
//     const [account, password, code] = args;

//     // 密码格式校验
//     if (password.length !== 32) {
//       return USER_PASSWORD_FORMAT_ERROR;
//     }

//     // 邮箱格式校验 含@
//     if (account.includes('@')) {
//       if (valid_email(account)) {
//         const ok = await this.AccountUsersService.account_reset_pwd_by(
//           'email',
//           account,
//           password,
//           code
//         );
//         return ok ? SUCCESS : USER_EMAIL_NOT_CONFIRMED;
//       }
//       return USER_EMAIL_FORMAT_ERROR;
//     }

//     // 手机号格式校验 1开头
//     if (account.startsWith('1') && account.length === 11) {
//       if (valid_mobile(account)) {
//         const ok = await this.AccountUsersService.account_reset_pwd_by(
//           'mobile',
//           account,
//           password,
//           code
//         );
//         return ok ? SUCCESS : USER_MOBILE_NOT_CONFIRMED;
//       }
//       return USER_MOBILE_FORMAT_ERROR;
//     }

//     return USER_NOT_EXIST;
//   }
// }
