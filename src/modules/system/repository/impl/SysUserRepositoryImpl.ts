import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { bcryptHash } from '../../../../framework/utils/CryptoUtils';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import {
  parseBoolean,
  parseNumber,
} from '../../../../framework/utils/ValueParseUtils';
import { SysDept } from '../../model/SysDept';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysUserRepository } from '../ISysUserRepository';
import { SysUser } from '../../model/SysUser';
import { SysRole } from '../../model/SysRole';

/**查询视图对象SQL */
const SELECT_USER_VO = `select 
u.user_id, u.dept_id, u.user_name, u.nick_name, u.user_type, u.email, u.avatar, u.phonenumber, u.password, u.sex, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by, u.create_time, u.remark, 
d.dept_id, d.parent_id, d.ancestors, d.dept_name, d.order_num, d.leader, d.status as dept_status,
r.role_id, r.role_name, r.role_key, r.role_sort, r.data_scope, r.status as role_status
from sys_user u
left join sys_dept d on u.dept_id = d.dept_id
left join sys_user_role ur on u.user_id = ur.user_id
left join sys_role r on r.role_id = ur.role_id`;

/**用户信息实体映射 */
const SYS_USER_RESULT = new Map<string, string>();
SYS_USER_RESULT.set('user_id', 'userId');
SYS_USER_RESULT.set('dept_id', 'deptId');
SYS_USER_RESULT.set('user_name', 'userName');
SYS_USER_RESULT.set('nick_name', 'nickName');
SYS_USER_RESULT.set('user_type', 'userType');
SYS_USER_RESULT.set('email', 'email');
SYS_USER_RESULT.set('phonenumber', 'phonenumber');
SYS_USER_RESULT.set('sex', 'sex');
SYS_USER_RESULT.set('avatar', 'avatar');
SYS_USER_RESULT.set('password', 'password');
SYS_USER_RESULT.set('status', 'status');
SYS_USER_RESULT.set('del_flag', 'delFlag');
SYS_USER_RESULT.set('login_ip', 'loginIp');
SYS_USER_RESULT.set('login_date', 'loginDate');
SYS_USER_RESULT.set('create_by', 'createBy');
SYS_USER_RESULT.set('create_time', 'createTime');
SYS_USER_RESULT.set('update_by', 'updateBy');
SYS_USER_RESULT.set('update_time', 'updateTime');
SYS_USER_RESULT.set('remark', 'remark');

/**用户部门实体映射 一对一 */
const SYS_DEPT_RESULT = new Map<string, string>();
SYS_DEPT_RESULT.set('dept_id', 'deptId');
SYS_DEPT_RESULT.set('parent_id', 'parentId');
SYS_DEPT_RESULT.set('dept_name', 'deptName');
SYS_DEPT_RESULT.set('ancestors', 'ancestors');
SYS_DEPT_RESULT.set('order_num', 'orderNum');
SYS_DEPT_RESULT.set('leader', 'leader');
SYS_DEPT_RESULT.set('dept_status', 'status');

/**用户角色实体映射 一对多 */
const SYS_ROLE_RESULT = new Map<string, string>();
SYS_ROLE_RESULT.set('role_id', 'roleId');
SYS_ROLE_RESULT.set('role_name', 'roleName');
SYS_ROLE_RESULT.set('role_key', 'roleKey');
SYS_ROLE_RESULT.set('role_sort', 'roleSort');
SYS_ROLE_RESULT.set('data_scope', 'dataScope');
SYS_ROLE_RESULT.set('role_status', 'status');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysUserResult(rows: any[]): SysUser[] {
  const sysUsers: SysUser[] = [];
  for (const row of rows) {
    const sysUser = new SysUser();
    const sysDept = new SysDept();
    const sysRole = new SysRole();
    sysUser.roles = [];
    for (const key in row) {
      if (SYS_USER_RESULT.has(key)) {
        const keyMapper = SYS_USER_RESULT.get(key);
        sysUser[keyMapper] = row[key];
      }
      if (SYS_DEPT_RESULT.has(key)) {
        const keyMapper = SYS_DEPT_RESULT.get(key);
        sysDept[keyMapper] = row[key];
      }
      if (SYS_ROLE_RESULT.has(key)) {
        const keyMapper = SYS_ROLE_RESULT.get(key);
        sysRole[keyMapper] = row[key];
      }
    }
    sysUser.dept = sysDept;
    if (sysRole.roleKey) {
      sysUser.roles.push(sysRole);
    }
    sysUsers.push(sysUser);
  }
  return sysUsers;
}

/**
 * 用户表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserRepositoryImpl implements ISysUserRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectUserPage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    const SELECT_USER_SQL = `select 
    u.user_id, u.dept_id, u.nick_name, u.user_name, u.email, u.avatar, u.phonenumber, u.sex, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by, u.create_time, u.remark, d.dept_name, d.leader 
    from sys_user u
		left join sys_dept d on u.dept_id = d.dept_id
		where u.del_flag = '0' `;
    // 查询条件拼接
    let sqlStr = dataScopeSQL;
    const paramArr = [];
    if (query.userId && query.userId !== '0') {
      sqlStr += ' and u.user_id = ? ';
      paramArr.push(query.userId);
    }
    if (query.userName) {
      sqlStr += " and u.user_name like concat(?, '%') ";
      paramArr.push(query.userName);
    }
    if (query.status) {
      sqlStr += ' and u.status = ? ';
      paramArr.push(query.status);
    }
    if (query.phonenumber) {
      sqlStr += " and u.phonenumber like concat(?, '%') ";
      paramArr.push(query.phonenumber);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      sqlStr += ' and u.login_date >= ? ';
      paramArr.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      sqlStr += ' and u.login_date <= ? ';
      paramArr.push(endDate);
    }
    if (query.deptId) {
      sqlStr +=
        ' and (u.dept_id = ? or u.dept_id in ( select t.dept_id from sys_dept t where find_in_set(?, ancestors) )) ';
      paramArr.push(query.deptId);
      paramArr.push(query.deptId);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: RowTotalType[] = await this.db.execute(
      `select count(1) as 'total' from sys_user u
      left join sys_dept d on u.dept_id = d.dept_id
      where u.del_flag = '0' ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_USER_SQL} ${sqlStr}`,
      paramArr
    );
    const rows = parseSysUserResult(results);
    return { total, rows };
  }

  async selectUserList(
    sysUser: SysUser,
    dataScopeSQL = ''
  ): Promise<SysUser[]> {
    // 查询条件拼接
    let sqlStr = dataScopeSQL;
    const paramArr = [];
    if (sysUser.userId && sysUser.userId !== '0') {
      sqlStr += ' and u.user_id = ? ';
      paramArr.push(sysUser.userId);
    }
    if (sysUser.userName) {
      sqlStr += " and u.user_name like concat(?, '%') ";
      paramArr.push(sysUser.userName);
    }
    if (sysUser.status) {
      sqlStr += ' and u.status = ? ';
      paramArr.push(sysUser.status);
    }
    if (sysUser.phonenumber) {
      sqlStr += " and u.phonenumber like concat(?, '%') ";
      paramArr.push(sysUser.phonenumber);
    }
    // 查询数据数
    const SELECT_USER_SQL = `select 
    u.user_id, u.dept_id, u.nick_name, u.user_name, u.email, u.avatar, u.phonenumber, u.sex, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by, u.create_time, u.remark, d.dept_name, d.leader 
    from sys_user u
		left join sys_dept d on u.dept_id = d.dept_id
		where u.del_flag = '0' `;
    const results = await this.db.execute(
      `${SELECT_USER_SQL} ${sqlStr}`,
      paramArr
    );
    return parseSysUserResult(results);
  }

  async selectAllocatedPage(
    roleId: string,
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    // 查询条件拼接
    let sqlStr = dataScopeSQL;
    const paramArr = [];
    if (query.userName) {
      sqlStr += " and u.user_name like concat(?, '%') ";
      paramArr.push(query.userName);
    }
    if (query.phonenumber) {
      sqlStr += " and u.phonenumber like concat(?, '%') ";
      paramArr.push(query.phonenumber);
    }
    if (query.status) {
      sqlStr += ' and u.status = ? ';
      paramArr.push(query.status);
    }

    // 分配角色用户
    if (parseBoolean(query.allocated)) {
      sqlStr += ' and r.role_id = ? ';
      paramArr.push(roleId);
    } else {
      sqlStr +=
        ' and (r.role_id != ? or r.role_id IS NULL) and u.user_id not in (select u.user_id from sys_user u inner join sys_user_role ur on u.user_id = ur.user_id and ur.role_id = ?)';
      paramArr.push(roleId);
      paramArr.push(roleId);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: RowTotalType[] = await this.db.execute(
      `select count(distinct u.user_id) as 'total' from sys_user u
      left join sys_dept d on u.dept_id = d.dept_id
      left join sys_user_role ur on u.user_id = ur.user_id
      left join sys_role r on r.role_id = ur.role_id
      where u.del_flag = '0' ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);

    const buildSql = `select distinct 
    u.user_id, u.dept_id, u.user_name, u.nick_name, u.email, u.phonenumber, u.status, u.create_time
    from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id
    left join sys_user_role ur on u.user_id = ur.user_id
    left join sys_role r on r.role_id = ur.role_id
    where u.del_flag = '0' ${sqlStr}`;
    // 查询数据数
    const results = await this.db.execute(buildSql, paramArr);
    const rows = parseSysUserResult(results);
    return { total, rows };
  }

  async selectUserByUserName(userName: string): Promise<SysUser> {
    const sqlStr = `${SELECT_USER_VO} where u.del_flag = '0' and u.user_name = ?`;
    const paramArr = [userName];
    const rows = await this.db.execute(sqlStr, paramArr);
    const sysUsers = parseSysUserResult(rows);
    if (sysUsers.length === 0) {
      return null;
    }
    let sysUser = new SysUser();
    sysUsers.forEach((v, i) => {
      if (i === 0) {
        if (v.roles && v.roles.length === 0) {
          v.roles = [];
        }
        sysUser = v;
      } else {
        if (v.roles && v.roles.length !== 0) {
          sysUser.roles = sysUser.roles.concat(v.roles);
        }
      }
    });
    return sysUser.userId ? sysUser : null;
  }

  async selectUserById(userId: string): Promise<SysUser> {
    const sqlStr = `${SELECT_USER_VO} where u.del_flag = '0' and u.user_id = ?`;
    const paramArr = [userId];
    const rows = await this.db.execute(sqlStr, paramArr);
    const sysUsers = parseSysUserResult(rows);
    if (sysUsers.length === 0) {
      return null;
    }
    let sysUser = new SysUser();
    sysUsers.forEach((v, i) => {
      if (i === 0) {
        if (v.roles && v.roles.length === 0) {
          v.roles = [];
        }
        sysUser = v;
      } else {
        if (v.roles && v.roles.length !== 0) {
          sysUser.roles = sysUser.roles.concat(v.roles);
        }
      }
    });
    return sysUser.userId ? sysUser : null;
  }

  async insertUser(sysUser: SysUser): Promise<string> {
    const paramMap = new Map();
    if (sysUser.userId) {
      paramMap.set('user_id', sysUser.userId);
    }
    if (sysUser.deptId) {
      paramMap.set('dept_id', sysUser.deptId);
    }
    if (sysUser.userName) {
      paramMap.set('user_name', sysUser.userName);
    }
    if (sysUser.nickName) {
      paramMap.set('nick_name', sysUser.nickName);
    }
    if (sysUser.userType) {
      paramMap.set('user_type', sysUser.userType);
    }
    if (sysUser.email) {
      paramMap.set('email', sysUser.email);
    }
    if (sysUser.avatar) {
      paramMap.set('avatar', sysUser.avatar);
    }
    if (sysUser.phonenumber) {
      paramMap.set('phonenumber', sysUser.phonenumber);
    }
    if (sysUser.sex) {
      paramMap.set('sex', parseNumber(sysUser.sex));
    }
    if (sysUser.password) {
      const password = await bcryptHash(sysUser.password);
      paramMap.set('password', password);
    }
    if (sysUser.status) {
      paramMap.set('status', parseNumber(sysUser.status));
    }
    if (sysUser.remark) {
      paramMap.set('remark', sysUser.remark);
    }
    if (sysUser.createBy) {
      paramMap.set('create_by', sysUser.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_user (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateUser(sysUser: SysUser): Promise<number> {
    const paramMap = new Map();
    if (sysUser.deptId) {
      paramMap.set('dept_id', sysUser.deptId);
    }
    if (sysUser.userName) {
      paramMap.set('user_name', sysUser.userName);
    }
    if (sysUser.nickName) {
      paramMap.set('nick_name', sysUser.nickName);
    }
    if (sysUser.userType) {
      paramMap.set('user_type', sysUser.userType);
    }
    if (sysUser.email || sysUser.email === '') {
      paramMap.set('email', sysUser.email);
    }
    if (sysUser.phonenumber || sysUser.phonenumber === '') {
      paramMap.set('phonenumber', sysUser.phonenumber);
    }
    if (sysUser.sex) {
      paramMap.set('sex', parseNumber(sysUser.sex));
    }
    if (sysUser.avatar) {
      paramMap.set('avatar', sysUser.avatar);
    }
    if (sysUser.password) {
      const password = await bcryptHash(sysUser.password);
      paramMap.set('password', password);
    }
    if (sysUser.status) {
      paramMap.set('status', parseNumber(sysUser.status));
    }
    if (sysUser.loginIp) {
      paramMap.set('login_ip', sysUser.loginIp);
    }
    if (sysUser.loginDate) {
      paramMap.set('login_date', sysUser.loginDate);
    }
    if (sysUser.updateBy) {
      paramMap.set('update_by', sysUser.updateBy);
      paramMap.set('update_time', Date.now());
    }
    if (sysUser.remark) {
      paramMap.set('remark', sysUser.remark);
    }

    const sqlStr = `update sys_user set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(', ')} where user_id = ?`;
    const rows: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysUser.userId,
    ]);
    return rows.affectedRows;
  }

  async deleteUserByIds(userIds: string[]): Promise<number> {
    const sqlStr = `update sys_user set del_flag = '1' where user_id in (${userIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }

  async checkUniqueUserName(userName: string): Promise<string> {
    const sqlStr =
      "select user_id as 'str' from sys_user where user_name = ? and del_flag = '0' limit 1";
    const paramArr = [userName];
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.length > 0 ? rows[0].str : null;
  }

  async checkUniquePhone(phonenumber: string): Promise<string> {
    const sqlStr =
      "select user_id as 'str' from sys_user where phonenumber = ? and del_flag = '0' limit 1";
    const paramArr = [phonenumber];
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.length > 0 ? rows[0].str : null;
  }

  async checkUniqueEmail(email: string): Promise<string> {
    const sqlStr =
      "select user_id as 'str' from sys_user where email = ? and del_flag = '0' limit 1";
    const paramArr = [email];
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.length > 0 ? rows[0].str : null;
  }
}
