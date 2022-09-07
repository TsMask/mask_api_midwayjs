// import { Provide, Logger } from '@midwayjs/decorator';
// import { getConnection } from 'typeorm';
// import { ILogger } from '@midwayjs/logger';
// import { crypto_hmac } from '../utils/crypto.utils';
// import { parse_line_to_hump } from '../utils/context .utils';
// import { AccountVerifyCodes } from '../entity/account_verify_codes.entity';

// @Provide()
// export class AccountVerifyCodesRepository {
//   @Logger()
//   private logger: ILogger;

//   /**
//    * 查询最新有效验证码
//    * @param by 查询字段
//    * @param value 字段值
//    * @returns 验证码实体信息
//    */
//   public async find_verify_code_by(
//     by: 'mobile' | 'email',
//     value: string
//   ): Promise<AccountVerifyCodes> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 全字段
//     const fields = `id, locked, created_by, created_time, updated_by, updated_time,
//         deleted_by, deleted_time, mobile, email, device_uuid, verify_code, scene, state,
//         ip, expired_time, ua`;

//     // 根据方式选择语句, 是唯一字段
//     const sql = `select ${fields} from account_verify_codes where ${by} = ? and state = 0 and expired_time > ? limit 1;`;

//     // 查询数据库用户
//     const data = await queryRunner.query(sql, [value, new Date().getTime()]);

//     const verifyCode = new AccountVerifyCodes();
//     if (data.length === 1) {
//       const verifyCodeDate = data[0];
//       for (const field in verifyCodeDate) {
//         // 字段转驼峰存值
//         const name = parse_line_to_hump(field);
//         verifyCode[name] = verifyCodeDate[field];
//       }
//     }

//     // 释放连接
//     await queryRunner.release();
//     return verifyCode;
//   }

//   /**
//    * 查询验证码是否有效
//    * @param by 验证码方式
//    * @param value 方式号码
//    * @param code 验证码
//    * @returns 是否有 boolean
//    */
//   public async has_verify_code_by(
//     by: 'mobile' | 'email',
//     value: string,
//     code: string
//   ): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();
//     // 查询是否有效验证码
//     const hasVerifyCode = await queryRunner.query(
//       `select count(1) as has FROM account_verify_codes where ${by} = ? and state = 0 and expired_time > ? and verify_code = ? limit 1;`,
//       [value, new Date().getTime(), code]
//     );
//     // 释放连接
//     await queryRunner.release();
//     return parseInt(hasVerifyCode[0].has) > 0;
//   }

//   /**
//    * 创建验证码
//    * @param by 创建方式
//    * @param vc 验证码对象
//    * @returns 是否创建 boolean
//    */
//   public async create_verify_code_by(
//     by: 'mobile' | 'email',
//     vc: AccountVerifyCodes
//   ): Promise<boolean> {
//     // 获取连接并创建新的queryRunner
//     const queryRunner = getConnection().createQueryRunner();

//     // 开始事务
//     await queryRunner.startTransaction();

//     // 对此事务执行一些操作
//     try {
//       const affected = await queryRunner.query(
//         `insert into account_verify_codes(
//           created_by, created_time, ${by}, verify_code,
//           scene, ip, expired_time, ua
//         )values(
//           ?, ?, ?, ?,
//           ?, ?, ?, ?
//         );`,
//         [
//           vc.createdBy,
//           vc.createdTime,
//           vc[by], // 手机和邮箱二选一
//           vc.verifyCode, // 验证码
//           vc.scene, // 场景
//           vc.ip,
//           vc.expiredTime,
//           vc.ua,
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
//       throw new Error('create_verify_code_by =>' + err);
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
