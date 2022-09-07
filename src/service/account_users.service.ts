// import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
// import { Provide, Logger, Inject, App } from '@midwayjs/decorator';
// import { ILogger } from '@midwayjs/logger';
// import { Application } from '@midwayjs/koa';
// import { AccountUsers } from '../entity/account_users.entity';
// import { AccountUsersRepository } from '../repository/account_users.repository';
// import { AccountVerifyCodesRepository } from '../repository/account_verify_codes.repository';
// import {
//   parse_mask_email,
//   parse_mask_mobile,
//   parse_number,
// } from '../utils/context .utils';
// import { generate_id, random_id } from '../utils/uid.utils';
// import { TokenDTO, TokenService } from './token.service';

// @Provide()
// export class AccountUsersService {
//   @App()
//   private app: Application;

//   @Logger()
//   private logger: ILogger;

//   @Inject()
//   AccountUsersRepository: AccountUsersRepository;

//   @Inject()
//   AccountVerifyCodesRepository: AccountVerifyCodesRepository;

//   @Inject()
//   TokenService: TokenService;

//   /**
//    * 注册用户
//    * @param arg { username, password, nickname, gender, avatar, ip }
//    * @returns 注册是否成功
//    */
//   public async account_register(arg: any): Promise<boolean> {
//     const { username, password, nickname, gender, avatar, ip } = arg;
//     const now = new Date().getTime().toString();
//     // 获取 password 配置，进行密码签名
//     const { secret } = this.app.getConfig('password');
//     const passwordCipher = await this.AccountUsersRepository.password_cipher(
//       password,
//       secret
//     );
//     // 创建实体用户
//     const user = new AccountUsers();
//     user.id = generate_id(13, 'U'); // 唯一随机用户ID
//     user.registerIp = ip; // 注册IP
//     user.registerTime = now;
//     user.createdBy = user.id; // 自己注册
//     user.createdTime = now;
//     user.passwordCipher = passwordCipher; // 程序加密后用户密码
//     user.passwordSecret = random_id(7, 'S'); // 随机加密值
//     user.username = username; // 唯一用户名
//     user.nickname = nickname; // 唯一用户昵称
//     user.avatar = avatar; // 用户头像
//     user.gender = parse_number(gender); // 用户性别
//     return await this.AccountUsersRepository.create_by_username(user);
//   }

//   /**
//    * 检查是否存在用户
//    * @param by 用户唯一字段
//    * @returns 存在 true
//    */
//   public async check_user_by(
//     by: 'username' | 'mobile' | 'email' | 'nickname' | 'id',
//     value: string
//   ): Promise<boolean> {
//     return await this.AccountUsersRepository.has_user_by(by, value);
//   }

//   /**
//    * 用户账号登录
//    * @param by 登录方式
//    * @param arg { account,password,ip }
//    * @param password 密码
//    * @returns 授权签名 { token, exp, nbf }
//    */
//   public async account_login_by(
//     by: 'username' | 'mobile' | 'email',
//     arg: { account: string; password: string; ip: string }
//   ): Promise<TokenDTO> {
//     const { account, password, ip } = arg;
//     const user = await this.AccountUsersRepository.find_user_by(by, account);
//     // 是否为所查方式
//     if (user[by] !== account) {
//       return { exp: 0 };
//     }

//     // 手机号和邮箱需要激活使用
//     if (
//       (by === 'mobile' && user.mobileConfirmed === 0) ||
//       (by === 'email' && user.emailConfirmed === 0)
//     ) {
//       this.logger.error('account_login_by no confirmed => %s %s', user.id, by);
//       throw new UnauthorizedError('账户待激活该登录方式');
//     }

//     // 获取 password 配置，进行密码签名
//     const { secret, errorLimit, errorRetryTime } =
//       this.app.getConfig('password');
//     const confCipher = await this.AccountUsersRepository.password_cipher(
//       password,
//       secret
//     );
//     const now = new Date().getTime();

//     // 其他状态
//     if (user.state === 1) {
//       this.logger.error('account_login_by state => %s %s', user.id, user.state);
//       throw new UnauthorizedError('账户已被禁用');
//     } else if (user.state === 3) {
//       this.logger.error('account_login_by state => %s %s', user.id, user.state);
//       throw new UnauthorizedError('账户已被锁定');
//     }

//     // 登录次数和时间限制
//     const retryTime = now - parse_number(user.lastLoginTime);
//     let retryLimit = user.lastLoginCount;
//     if (retryLimit >= errorLimit && retryTime < errorRetryTime) {
//       this.logger.error(
//         'account_login_by lastLoginCount => %s %s',
//         user.id,
//         user.lastLoginCount
//       );
//       throw new UnauthorizedError(
//         `密码错误次数过多, 请于 ${retryTime / 60 / 1000} 分钟后重试`
//       );
//     }

//     // 对比密码一致性
//     const passwordCipher = await this.AccountUsersRepository.password_cipher(
//       confCipher,
//       user.passwordSecret
//     );
//     if (user.passwordCipher !== passwordCipher) {
//       if (retryLimit >= errorLimit && retryTime > errorRetryTime) {
//         retryLimit = 0;
//       }
//       await this.AccountUsersRepository.update_user_field(
//         user.id,
//         user.locked,
//         {
//           updatedBy: user.id,
//           lastLoginTime: now,
//           lastLoginCount: retryLimit + 1,
//           lastLoginIp: ip,
//         }
//       );
//       return { exp: 0 };
//     }
//     // 记录登录日志
//     await this.AccountUsersRepository.update_user_field(user.id, user.locked, {
//       updatedBy: user.id,
//       lastLoginTime: now,
//       lastLoginCount: 0,
//       lastLoginIp: ip,
//     });
//     // 返回 { token, exp, nbf }
//     return await this.TokenService.sign(user.id, user.nickname);
//   }

//   /**
//    * 用户账户信息
//    * @param id 用户ID
//    * @param self 是否自己
//    * @returns 信息对象
//    */
//   public async account_info_by_id(id: string, self?: boolean): Promise<any> {
//     const user = await this.AccountUsersRepository.find_user_by('id', id);
//     // 是否为所查ID
//     if (user.id !== id) {
//       return { id: '' };
//     }

//     // 标签处理
//     let tags: string[] = [];
//     if (user.tags) {
//       tags = user.tags.split(',');
//     }

//     // 默认返回数据
//     const info = {
//       id: user.id,
//       nickname: user.nickname,
//       gender: user.gender,
//       mobile: parse_mask_mobile(user.mobile),
//       email: parse_mask_email(user.email),
//       avatar: '/file/avatar/default_avatar.png',
//       tags,
//     };

//     // 是当前登录账户
//     if (self) {
//       // 角色处理
//       let roles: string[] = [];
//       if (user.roles) {
//         roles = user.roles.split(',');
//       }
//       return {
//         ...info,
//         score: user.score,
//         roles,
//       };
//     }
//     return info;
//   }

//   /**
//    * 用户账号密码重置
//    * @param by 登录方式
//    * @param account 方式账户
//    * @param password 密码
//    * @param code 验证码
//    * @returns 是否重置成功
//    */
//   public async account_reset_pwd_by(
//     by: 'mobile' | 'email',
//     account: string,
//     password: string,
//     code: string
//   ): Promise<boolean> {
//     // 查用户账户是否正常
//     const user = await this.AccountUsersRepository.find_user_by(by, account);
//     // 是否为所查方式
//     if (user[by] !== account) {
//       return false;
//     }

//     // 其他状态禁止重置
//     if (user.state === 1) {
//       this.logger.error(
//         'account_reset_pwd_by state => %s %s',
//         user.id,
//         user.state
//       );
//       throw new UnauthorizedError('账户已被禁用');
//     } else if (user.state === 3) {
//       this.logger.error(
//         'account_reset_pwd_by state => %s %s',
//         user.id,
//         user.state
//       );
//       throw new UnauthorizedError('账户已被锁定');
//     }

//     // 手机号和邮箱需要激活使用
//     if (
//       (by === 'mobile' && user.mobileConfirmed === 0) ||
//       (by === 'email' && user.emailConfirmed === 0)
//     ) {
//       this.logger.error(
//         'account_reset_pwd_by no confirmed => %s %s',
//         user.id,
//         by
//       );
//       throw new UnauthorizedError('账户未关联激活该方式');
//     }

//     // 查询是否有效验证码
//     const vc = await this.AccountVerifyCodesRepository.find_verify_code_by(
//       by,
//       account
//     );
//     if (vc.verifyCode !== code) {
//       return false;
//     }

//     // 获取 password 配置，进行密码签名
//     const { secret } = this.app.getConfig('password');
//     const cipher = await this.AccountUsersRepository.password_cipher(
//       password,
//       secret
//     );
//     // 更新
//     return await this.AccountUsersRepository.update_user_passowd({
//       uid: user.id, // 用户ID
//       ulocked: user.locked, // 用户锁
//       cipher: cipher, // 程序签名用户密码
//       secret: random_id(7, 'S'), // 随机加密值
//       vcid: vc.id, // 验证码ID
//       vclocked: vc.locked, // 验证码锁
//     });
//   }

//   /**
//    * 模拟
//    * @param value 用户唯一字段
//    * @returns 存在 true
//    */
//   public async test(value): Promise<boolean> {
//     this.logger.info(value);
//     return false;
//   }
// }
