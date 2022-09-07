// import { Provide } from '@midwayjs/decorator';
// import { InjectEntityModel } from '@midwayjs/orm';
// import { Repository, getConnection } from 'typeorm';
// import { AccountUsers } from '../entity/account_users.entity';
// import { AccountDepartment } from '../entity/account_department.entity';

// @Provide()
// export class AccountUserService {
//   @InjectEntityModel(AccountUsers)
//   accountUsersModel: Repository<AccountUsers>;

//   @InjectEntityModel(AccountDepartment)
//   accountDepartmentModel: Repository<AccountDepartment>;

//   async saveAccountUser3(user: AccountUsers) {
//     const de = new AccountDepartment();
//     de.createdBy = user.createdBy ? user.createdBy : 'server';
//     de.createdTime = new Date().getTime().toString();
//     de.name = '1.1.1.1';
//     de.updatedTime = new Date().getTime().toString();

//     // return await this.accountDepartmentModel.query(
//     //   `INSERT INTO uni_id.account_department (id,created_by,created_time,name) VALUES (?,?,?,?);`,
//     //   [
//     //     de.id,
//     //     de.createdBy,
//     //     de.createdTime,
//     //     de.name
//     //   ]
//     // );
//     // {
//     //   "fieldCount": 0,
//     //   "affectedRows": 1,
//     //   "insertId": 2,
//     //   "info": "",
//     //   "serverStatus": 2,
//     //   "warningStatus": 0
//     // }
//     return await this.accountDepartmentModel.save(de);
//   }

//   async saveAccountUser(user: AccountUsers) {
//     user.createdBy = user.createdBy ? user.createdBy : 'server';
//     user.createdTime = new Date().getTime().toString();
//     user.registerIp = '1.1.1.1';
//     user.registerTime = new Date().getTime().toString();
//     return await this.accountUsersModel.save(user);
//   }

//   async saveAccountUser2(user: AccountUsers) {
//     user.createdBy = user.createdBy ? user.createdBy : 'server';
//     user.createdTime = new Date().getTime().toString();
//     user.registerIp = '1.1.1.1';
//     user.registerTime = new Date().getTime().toString();

//     // 获取连接并创建新的queryRunner
//     const connection = getConnection();
//     const queryRunner = connection.createQueryRunner();

//     // 使用我们的新queryRunner建立真正的数据库连
//     await queryRunner.connect();

//     // 现在我们可以在queryRunner上执行任何查询，例如：
//     const u = await queryRunner.query(
//       'SELECT * FROM account_users where id = ? limit 1;',
//       [user.id]
//     );
//     console.log(u);
//     // 开始事务：
//     await queryRunner.startTransaction();

//     try {
//       // 对此事务执行一些操作：
//       await queryRunner.query(
//         'INSERT INTO uni_id.account_users (id,created_by,created_time,username,password,register_ip,register_time) VALUES (?,?,?,?,?,?,?);',
//         [
//           user.id,
//           user.username,
//           user.passwordCipher,
//           user.createdBy,
//           user.createdTime,
//           user.registerIp,
//           user.registerTime,
//         ]
//       );

//       await queryRunner.query(
//         'INSERT INTO uni_id.account_users (id,created_by,created_time,username,password,register_ip,register_time) VALUES (?,?,?,?,?,?,?);',
//         [
//           user.id + user.id,
//           user.createdBy,
//           user.createdTime,
//           user.username,
//           user.username + user.passwordCipher,
//           user.registerIp,
//           user.registerTime,
//         ]
//       );

//       // 提交事务：
//       await queryRunner.commitTransaction();
//       await queryRunner.release();
//       console.log(queryRunner.isReleased, u);
//       return u;
//     } catch (err) {
//       // 有错误做出回滚更改
//       await queryRunner.rollbackTransaction();
//       await queryRunner.release();
//       console.log(queryRunner.isReleased, u.length);
//     }
//   }
// }
