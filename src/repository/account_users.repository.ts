// import { Provide, Logger } from '@midwayjs/decorator';
// import { getConnection } from 'typeorm';
// import { AccountUsers } from '../entity/account_users.entity';
// import { ILogger } from '@midwayjs/logger';
// import { crypto_hmac } from '../utils/crypto.utils';
// import { parse_line_to_hump } from '../utils/context .utils';

// @Provide()
// export class AccountUsersRepository {
//   @Logger()
//   private logger: ILogger;

//   /**
//    * 创建用户-通过用户名密码方式
//    * @param user 用户实体对象，填写不为空字段
//    * @returns 是否创建 boolean
//    */
//   public async create_by_username(user: AccountUsers): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 开始事务
//     await queryRunner.startTransaction();

//     // 对此事务执行一些操作
//     try {
//       // 密码签名
//       const password = await this.password_cipher(
//         user.passwordCipher,
//         user.passwordSecret
//       );
//       const affected = await queryRunner.query(
//         `insert into account_users(
//           id, created_by, created_time, username, password_cipher, password_secret,
//           nickname, gender, avatar, register_ip, register_time
//         )values(
//           ?, ?, ?, ?, ?, ?,
//           ?, ?, ?, ?, ?
//         );`,
//         [
//           user.id, // 唯一ID
//           user.createdBy,
//           user.createdTime,
//           user.username, // 唯一用户名
//           password, // 密码签名
//           user.passwordSecret, // 加密密匙
//           user.nickname, // 唯一昵称
//           user.gender,
//           user.avatar,
//           user.registerIp,
//           user.registerTime,
//         ]
//       );
//       // 提交事务写入库 后释放连接
//       await queryRunner.commitTransaction();
//       await queryRunner.release();
//       // 使用自定义id，返回影响行数
//       return parseInt(affected.affectedRows) > 0;
//     } catch (err) {
//       // 有错误做出回滚更改 后释放连接
//       await queryRunner.rollbackTransaction();
//       await queryRunner.release();
//       this.logger.error('create_by_username => %s', err);
//       throw new Error('服务数据异常');
//     }
//   }

//   /**
//    * 密码加密
//    * @param password 密码串
//    * @param password_secret 密匙
//    * @returns 加密串
//    */
//   public async password_cipher(
//     password: string,
//     password_secret: string
//   ): Promise<string> {
//     // 不可逆加密密码串 SHA1
//     return crypto_hmac(password, password_secret, 'sha1');
//   }

//   /**
//    * 查询用户是否存在
//    * @param by 用户字段
//    * @returns 是否存在 boolean
//    */
//   public async has_user_by(
//     by: 'username' | 'mobile' | 'email' | 'nickname' | 'id',
//     value: string
//   ): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();
//     // 查询用户是否存在
//     const hasFieldInfo = await queryRunner.query(
//       `select count(1) as has FROM account_users where ${by} = ? limit 1;`,
//       [value]
//     );
//     // 释放连接
//     await queryRunner.release();
//     return parseInt(hasFieldInfo[0].has) > 0;
//   }

//   /**
//    * 通过唯一字段查询用户
//    * @param by 根据方式是唯一字段
//    * @param value 查询值
//    * @returns 用户实体对象
//    */
//   public async find_user_by(
//     by: 'username' | 'mobile' | 'email' | 'nickname' | 'id',
//     value: string
//   ): Promise<AccountUsers> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 全字段
//     const fields = `id, locked, created_by, created_time, updated_by, updated_time,
//     deleted_by, deleted_time, username, password_cipher, password_secret,
//     nickname, gender, state, mobile, mobile_confirmed, email, email_confirmed,
//     avatar, register_ip, register_time, last_login_ip, last_login_time,
//     score, inviter_uid, invite_time, invite_code, remark, department_id, roles,
//     tags, wx_unionid, wx_openid_app, wx_openid_mp, ali_openid, apple_openid,
//     realname_auth_id`;

//     // 根据方式选择语句, 是唯一字段
//     const sql = `select ${fields} from account_users where ${by} = ? limit 1;`;

//     // 查询数据库用户
//     const data = await queryRunner.query(sql, [value]);

//     const user = new AccountUsers();
//     if (data.length === 1) {
//       const userData = data[0];
//       for (const field in userData) {
//         // 字段转驼峰存值
//         const name = parse_line_to_hump(field);
//         user[name] = userData[field];
//       }
//     }

//     // 释放连接
//     await queryRunner.release();
//     return user;
//   }

//   /**
//    * 修改用户密码
//    * @param args { uid, ulocked, cipher, secret, vcid, vclocked )
//    * @returns 是否修改 boolean
//    */
//   public async update_user_passowd(args: {
//     uid: string; // 用户ID
//     ulocked: number; // 用户锁
//     cipher: string; // 用户密码
//     secret: string; // 随机加密值
//     vcid: number; // 验证码ID
//     vclocked: number; // 验证码锁
//   }): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 开始事务
//     await queryRunner.startTransaction();

//     // 对此事务执行一些操作
//     try {
//       const { uid, ulocked, cipher, secret, vcid, vclocked } = args;

//       const now = new Date().getTime();
//       // 更新验证状态
//       let affected = await queryRunner.query(
//         'UPDATE account_verify_codes SET locked=locked+1, updated_by=?, updated_time=?, state=1 WHERE id=? and locked=?;',
//         [uid, now, vcid, vclocked]
//       );
//       if (parseInt(affected.affectedRows) <= 0) {
//         // 有错误做出回滚更改 后释放连接
//         await queryRunner.rollbackTransaction();
//         await queryRunner.release();
//         return false;
//       }
//       // 更新用户密码
//       const password = await this.password_cipher(cipher, secret);
//       affected = await queryRunner.query(
//         'UPDATE account_users SET locked=locked+1, updated_by=?, updated_time=?, password_cipher=?, password_secret=? WHERE id=? and locked=?;',
//         [uid, now, password, secret, uid, ulocked]
//       );
//       if (parseInt(affected.affectedRows) <= 0) {
//         // 有错误做出回滚更改 后释放连接
//         await queryRunner.rollbackTransaction();
//         await queryRunner.release();
//         return false;
//       }
//       // 提交事务写入库 后释放连接
//       await queryRunner.commitTransaction();
//       await queryRunner.release();
//       return true;
//     } catch (err) {
//       // 有错误做出回滚更改 后释放连接
//       await queryRunner.rollbackTransaction();
//       await queryRunner.release();
//       this.logger.error('update_user_passowd => %s', err);
//       throw new Error('服务数据异常');
//     }
//   }

//   /**
//    * 修改用户字段信息
//    * @param args { uid, ulocked, fields )
//    * @returns 是否修改 boolean
//    */
//   public async update_user_field(
//     uid: string,
//     ulocked: number,
//     fields: object
//   ): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 开始事务
//     await queryRunner.startTransaction();

//     // 对此事务执行一些操作
//     try {
//       // 参数拆解
//       let field_str = '';
//       for (const field in fields) {
//         // 字段转驼峰存值
//         const name = parse_line_to_hump(field);
//         field_str = `${name}='${fields[name]}',`;
//       }

//       // 更新用户字段
//       const now = new Date().getTime();
//       const affected = await queryRunner.query(
//         `UPDATE account_users SET locked=locked+1, ${field_str} updated_time=? WHERE id=? and locked=?;`,
//         [now, uid, ulocked]
//       );
//       if (parseInt(affected.affectedRows) <= 0) {
//         // 有错误做出回滚更改 后释放连接
//         await queryRunner.rollbackTransaction();
//         await queryRunner.release();
//         return false;
//       }
//       // 提交事务写入库 后释放连接
//       await queryRunner.commitTransaction();
//       await queryRunner.release();
//       return true;
//     } catch (err) {
//       // 有错误做出回滚更改 后释放连接
//       await queryRunner.rollbackTransaction();
//       await queryRunner.release();
//       this.logger.error('update_user_field => %s', err);
//       throw new Error('服务数据异常');
//     }
//   }

//   /**
//    * 挂载测试
//    * @param by 用户字段
//    * @returns 是否存在 boolean
//    */
//   public async test(
//     by: 'username' | 'mobile' | 'email' | 'nickname' | 'id',
//     value: string
//   ): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();
//     // 查询用户是否存在
//     const hasFieldInfo = await queryRunner.query(
//       `select count(1) as has FROM account_users where ${by} = ? limit 1;`,
//       [value]
//     );
//     this.logger.info(hasFieldInfo);
//     // 释放连接
//     await queryRunner.release();
//     return parseInt(hasFieldInfo[0].has) > 0;
//   }
// }
