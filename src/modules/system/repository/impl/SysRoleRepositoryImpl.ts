import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysRoleRepository } from '../ISysRoleRepository';
import { SysRole } from '../../model/SysRole';

/**查询视图对象SQL */
const SELECT_ROLE_SQL = `select distinct 
r.role_id, r.role_name, r.role_key, r.role_sort, r.data_scope, r.menu_check_strictly, 
r.dept_check_strictly, r.status, r.del_flag, r.create_time, r.remark 
from sys_role r
left join sys_user_role ur on ur.role_id = r.role_id
left join sys_user u on u.user_id = ur.user_id
left join sys_dept d on u.dept_id = d.dept_id`;

/**用户角色信息实体映射 */
const SYS_ROLE_RESULT = new Map<string, string>();
SYS_ROLE_RESULT.set('role_id', 'roleId');
SYS_ROLE_RESULT.set('role_name', 'roleName');
SYS_ROLE_RESULT.set('role_key', 'roleKey');
SYS_ROLE_RESULT.set('role_sort', 'roleSort');
SYS_ROLE_RESULT.set('data_scope', 'dataScope');
SYS_ROLE_RESULT.set('menu_check_strictly', 'menuCheckStrictly');
SYS_ROLE_RESULT.set('dept_check_strictly', 'deptCheckStrictly');
SYS_ROLE_RESULT.set('status', 'status');
SYS_ROLE_RESULT.set('del_flag', 'delFlag');
SYS_ROLE_RESULT.set('create_by', 'createBy');
SYS_ROLE_RESULT.set('create_time', 'createTime');
SYS_ROLE_RESULT.set('update_by', 'updateBy');
SYS_ROLE_RESULT.set('update_time', 'updateTime');
SYS_ROLE_RESULT.set('remark', 'remark');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysRole[] {
  const sysRoles: SysRole[] = [];
  for (const row of rows) {
    const sysRole = new SysRole();
    for (const key in row) {
      if (SYS_ROLE_RESULT.has(key)) {
        const keyMapper = SYS_ROLE_RESULT.get(key);
        sysRole[keyMapper] = row[key];
      }
    }
    sysRoles.push(sysRole);
  }
  return sysRoles;
}

/**
 * 角色表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysRoleRepositoryImpl implements ISysRoleRepository {
  @Inject()
  public db: DynamicDataSource;

  async selectRolePage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    const selectRoleTotalSql = `select count(distinct r.role_id) as 'total' from sys_role r
    left join sys_user_role ur on ur.role_id = r.role_id
    left join sys_user u on u.user_id = ur.user_id
    left join sys_dept d on u.dept_id = d.dept_id`;

    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.roleId && query.roleId !== '0') {
      conditions.push('r.role_id = ?');
      params.push(query.roleId);
    }
    if (query.roleName) {
      conditions.push("r.role_name like concat(?, '%')");
      params.push(query.roleName);
    }
    if (query.roleKey) {
      conditions.push("r.role_key like concat(?, '%')");
      params.push(query.roleKey);
    }
    if (query.status) {
      conditions.push('r.status = ?');
      params.push(query.status);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('r.create_time >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('r.create_time <= ?');
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
    let whereSql = " where r.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = selectRoleTotalSql + whereSql + dataScopeSQL;
    const countRow: RowTotalType[] = await this.db.execute(totalSql, params);
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by r.role_sort asc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_ROLE_SQL + whereSql + dataScopeSQL + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectRoleList(
    sysRole: SysRole,
    dataScopeSQL = ''
  ): Promise<SysRole[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysRole.roleId) {
      conditions.push('r.role_id = ?');
      params.push(sysRole.roleId);
    }
    if (sysRole.roleKey) {
      conditions.push("r.role_key like concat(?, '%')");
      params.push(sysRole.roleKey);
    }
    if (sysRole.roleName) {
      conditions.push("r.role_name like concat(?, '%')");
      params.push(sysRole.roleName);
    }
    if (sysRole.status) {
      conditions.push('r.status = ?');
      params.push(sysRole.status);
    }

    // 构建查询条件语句
    let whereSql = " where r.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数据
    const orderSql = ' order by r.role_sort ';
    const querySql = SELECT_ROLE_SQL + whereSql + dataScopeSQL + orderSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectRoleListByUserId(userId: string): Promise<SysRole[]> {
    const sqlStr = `${SELECT_ROLE_SQL} where r.del_flag = '0' and ur.user_id = ?`;
    const paramArr = [userId];
    const rows = await this.db.execute(sqlStr, paramArr);
    return convertResultRows(rows);
  }

  async selectRoleByIds(roleIds: string[]): Promise<SysRole[]> {
    const sqlStr = `${SELECT_ROLE_SQL} where r.role_id in (${roleIds
      .map(() => '?')
      .join(',')})`;
    const rows = await this.db.execute(sqlStr, roleIds);
    return convertResultRows(rows);
  }

  async checkUniqueRole(sysRole: SysRole): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysRole.roleName) {
      conditions.push('r.role_name = ?');
      params.push(sysRole.roleName);
    }
    if (sysRole.roleKey) {
      conditions.push('r.role_key = ?');
      params.push(sysRole.roleKey);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select role_id as 'str' from sys_role r " +
      whereSql +
      " and r.del_flag = '0' limit 1";
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }

  async updateRole(sysRole: SysRole): Promise<number> {
    const paramMap = new Map();
    if (sysRole.roleName) {
      paramMap.set('role_name', sysRole.roleName);
    }
    if (sysRole.roleKey) {
      paramMap.set('role_key', sysRole.roleKey);
    }
    sysRole.roleSort = parseNumber(sysRole.roleSort)
    if (sysRole.roleSort > 0) {
      paramMap.set('role_sort', sysRole.roleSort);
    }
    if (sysRole.dataScope) {
      paramMap.set('data_scope', parseNumber(sysRole.dataScope));
    }
    if (sysRole.menuCheckStrictly) {
      paramMap.set(
        'menu_check_strictly',
        parseNumber(sysRole.menuCheckStrictly)
      );
    }
    if (sysRole.deptCheckStrictly) {
      paramMap.set(
        'dept_check_strictly',
        parseNumber(sysRole.deptCheckStrictly)
      );
    }
    if (sysRole.status) {
      paramMap.set('status', parseNumber(sysRole.status));
    }
    if (sysRole.remark) {
      paramMap.set('remark', sysRole.remark);
    }
    if (sysRole.updateBy) {
      paramMap.set('update_by', sysRole.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_role set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(', ')} where role_id = ?`;
    const rows: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysRole.roleId,
    ]);
    return rows.affectedRows;
  }

  async insertRole(sysRole: SysRole): Promise<string> {
    const paramMap = new Map();
    if (sysRole.roleId) {
      paramMap.set('role_id', sysRole.roleId);
    }
    if (sysRole.roleName) {
      paramMap.set('role_name', sysRole.roleName);
    }
    if (sysRole.roleKey) {
      paramMap.set('role_key', sysRole.roleKey);
    }
    sysRole.roleSort = parseNumber(sysRole.roleSort);
    if (sysRole.roleSort > 0) {
      paramMap.set('role_sort', sysRole.roleSort);
    }
    if (sysRole.dataScope) {
      paramMap.set('data_scope', parseNumber(sysRole.dataScope));
    }
    if (sysRole.menuCheckStrictly) {
      paramMap.set(
        'menu_check_strictly',
        parseNumber(sysRole.menuCheckStrictly)
      );
    }
    if (sysRole.deptCheckStrictly) {
      paramMap.set(
        'dept_check_strictly',
        parseNumber(sysRole.deptCheckStrictly)
      );
    }
    if (sysRole.status) {
      paramMap.set('status', parseNumber(sysRole.status));
    }
    if (sysRole.remark) {
      paramMap.set('remark', sysRole.remark);
    }
    if (sysRole.createBy) {
      paramMap.set('create_by', sysRole.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_role (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async deleteRoleByIds(roleIds: string[]): Promise<number> {
    const sqlStr = `update sys_role set del_flag = '1' where role_id in (${roleIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, roleIds);
    return result.affectedRows;
  }
}
