import { Inject, Provide, Singleton } from '@midwayjs/core';
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
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysUserRepository } from '../ISysUserRepository';
import { SysDept } from '../../model/SysDept';
import { SysUser } from '../../model/SysUser';
import { SysRole } from '../../model/SysRole';

/**查询视图对象SQL */
const SELECT_USER_SQL = `select 
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
function convertResultRows(rows: any[]): SysUser[] {
  const arr: SysUser[] = [];
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

    let one = true;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].userId === sysUser.userId) {
        arr[i].roles.push(...sysUser.roles);
        one = false;
        break;
      }
    }
    if (one) {
      arr.push(sysUser);
    }
  }
  return arr;
}

/**
 * 用户表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysUserRepositoryImpl implements ISysUserRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectUserPage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    const selectUserSql = `select 
    u.user_id, u.dept_id, u.nick_name, u.user_name, u.email, u.avatar, u.phonenumber, u.sex, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by, u.create_time, u.remark, d.dept_name, d.leader 
    from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id`;
    const selectUserTotalSql = `select count(distinct u.user_id) as 'total'
    from sys_user u left join sys_dept d on u.dept_id = d.dept_id`;

    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.userId && query.userId !== '0') {
      conditions.push('u.user_id = ?');
      params.push(query.userId);
    }
    if (query.userName) {
      conditions.push("u.user_name like concat(?, '%')");
      params.push(query.userName);
    }
    if (query.status) {
      conditions.push('u.status = ?');
      params.push(query.status);
    }
    if (query.phonenumber) {
      conditions.push("u.phonenumber like concat(?, '%')");
      params.push(query.phonenumber);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('u.login_date >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('u.login_date <= ?');
      params.push(endDate);
    }
    if (query.deptId) {
      conditions.push(
        '(u.dept_id = ? or u.dept_id in ( select t.dept_id from sys_dept t where find_in_set(?, ancestors) ))'
      );
      params.push(query.deptId);
      params.push(query.deptId);
    }

    // 构建查询条件语句
    let whereSql = " where u.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = selectUserTotalSql + whereSql + dataScopeSQL;
    const countRow: RowTotalType[] = await this.db.execute(totalSql, params);
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' limit ?,? ';
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = selectUserSql + whereSql + dataScopeSQL + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectUserList(
    sysUser: SysUser,
    dataScopeSQL = ''
  ): Promise<SysUser[]> {
    const selectUserSql = `select 
    u.user_id, u.dept_id, u.nick_name, u.user_name, u.email, u.avatar, u.phonenumber, u.sex, u.status, u.del_flag, u.login_ip, u.login_date, u.create_by, u.create_time, u.remark, d.dept_name, d.leader 
    from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id`;

    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysUser.userId && sysUser.userId !== '0') {
      conditions.push('u.user_id = ?');
      params.push(sysUser.userId);
    }
    if (sysUser.userName) {
      conditions.push("u.user_name like concat(?, '%')");
      params.push(sysUser.userName);
    }
    if (sysUser.status) {
      conditions.push('u.status = ?');
      params.push(sysUser.status);
    }
    if (sysUser.phonenumber) {
      conditions.push("u.phonenumber like concat(?, '%')");
      params.push(sysUser.phonenumber);
    }

    // 构建查询条件语句
    let whereSql = " where u.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = selectUserSql + whereSql + dataScopeSQL;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectAllocatedPage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    const selectUserSql = `select distinct 
    u.user_id, u.dept_id, u.user_name, u.nick_name, u.email, 
    u.phonenumber, u.status, u.create_time, d.dept_name
    from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id
    left join sys_user_role ur on u.user_id = ur.user_id
    left join sys_role r on r.role_id = ur.role_id`;
    const selectUserTotalSql = `select count(distinct u.user_id) as 'total' from sys_user u
    left join sys_dept d on u.dept_id = d.dept_id
    left join sys_user_role ur on u.user_id = ur.user_id
    left join sys_role r on r.role_id = ur.role_id`;

    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.userName) {
      conditions.push("u.user_name like concat(?, '%')");
      params.push(query.userName);
    }
    if (query.phonenumber) {
      conditions.push("u.phonenumber like concat(?, '%')");
      params.push(query.phonenumber);
    }
    if (query.status) {
      conditions.push('u.status = ?');
      params.push(query.status);
    }
    // 分配角色用户
    if (parseBoolean(query.allocated)) {
      conditions.push('r.role_id = ?');
      params.push(query.roleId);
    } else {
      conditions.push(
        '(r.role_id != ? or r.role_id IS NULL) and u.user_id not in (select u.user_id from sys_user u inner join sys_user_role ur on u.user_id = ur.user_id and ur.role_id = ?)'
      );
      params.push(query.roleId);
      params.push(query.roleId);
    }

    // 构建查询条件语句
    let whereSql = " where u.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = selectUserTotalSql + whereSql + dataScopeSQL;
    const countRow: RowTotalType[] = await this.db.execute(totalSql, params);
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' limit ?,? ';
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = selectUserSql + whereSql + dataScopeSQL + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectUserByUserName(userName: string): Promise<SysUser> {
    const sqlStr = `${SELECT_USER_SQL} where u.del_flag = '0' and u.user_name = ?`;
    const rows = await this.db.execute(sqlStr, [userName]);
    if (rows.length === 0) {
      return new SysUser;
    }
    const sysUsers = convertResultRows(rows);
    return sysUsers[0];
  }

  async selectUserById(userIds: string[]): Promise<SysUser[]> {
    const placeholder = this.db.keyPlaceholderByQuery(userIds.length);
    const sqlStr = `${SELECT_USER_SQL} where u.del_flag = '0' and u.user_id in (${placeholder})`;
    const rows = await this.db.execute(sqlStr, userIds);
    return convertResultRows(rows);
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

    const [keys, values, placeholder] =
      this.db.keyValuePlaceholderByInsert(paramMap);
    const sqlStr = `insert into sys_user (${keys})values(${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, values);
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
    if (sysUser.email) {
      if (sysUser.email === 'null') {
        paramMap.set('email', '');
      } else {
        paramMap.set('email', sysUser.email);
      }
    }
    if (sysUser.phonenumber) {
      if (sysUser.phonenumber === 'null') {
        paramMap.set('phonenumber', '');
      } else {
        paramMap.set('phonenumber', sysUser.phonenumber);
      }
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
    paramMap.set('remark', sysUser.remark || '');

    const [keys, values] = this.db.keyValueByUpdate(paramMap);
    const sqlStr = `update sys_user set ${keys} where user_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...values,
      sysUser.userId,
    ]);
    return result.affectedRows;
  }

  async deleteUserByIds(userIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(userIds.length);
    const sqlStr = `update sys_user set user_name = concat(user_name, '_del'), del_flag = '1' where user_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }

  async checkUniqueUser(sysUser: SysUser): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysUser.userName) {
      conditions.push('user_name = ?');
      params.push(sysUser.userName);
    }
    if (sysUser.phonenumber) {
      conditions.push('phonenumber = ?');
      params.push(sysUser.phonenumber);
    }
    if (sysUser.email) {
      conditions.push('email = ?');
      params.push(sysUser.email);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return '';
    }

    const sqlStr =
      "select user_id as 'str' from sys_user " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : '';
  }
}
