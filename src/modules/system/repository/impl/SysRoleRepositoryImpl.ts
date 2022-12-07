import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { parseNumber } from '../../../../common/utils/ParseUtils';
import { SysRole } from '../../../../framework/core/model/SysRole';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { ISysRoleRepository } from '../ISysRoleRepository';

/**查询视图对象SQL */
const SELECT_ROLE_VO = `select distinct 
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
function parseSysRoleResult(rows: any[]): SysRole[] {
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysRoleRepositoryImpl implements ISysRoleRepository {
  @Inject()
  public db: MysqlManager;

  async selectRolePage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.roleId && query.roleId != '0') {
      sqlStr += " and r.role_id = ? ";
      paramArr.push(query.roleId);
    }
    if (query.roleName) {
      sqlStr += " and r.role_name like concat('%', ?, '%') ";
      paramArr.push(query.roleName);
    }
    if (query.status) {
      sqlStr += " and r.status = ? ";
      paramArr.push(query.status);
    }
    if (query.roleKey) {
      sqlStr += " and r.role_key like concat('%', ?, '%') ";
      paramArr.push(query.roleKey);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      sqlStr +=
        " and unix_timestamp(from_unixtime(r.create_time/1000,'%Y-%m-%d')) >= unix_timestamp(date_format(?,'%Y-%m-%d')) ";
      paramArr.push(beginTime);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      sqlStr +=
        " and unix_timestamp(from_unixtime(r.create_time/1000,'%Y-%m-%d')) <= unix_timestamp(date_format(?,'%Y-%m-%d')) ";
      paramArr.push(endTime);
    }
    if (query.deptId) {
      sqlStr += " and (u.dept_id = ? OR u.dept_id IN ( SELECT t.dept_id FROM sys_dept t WHERE find_in_set(?, ancestors) )) ";
      paramArr.push(query.deptId);
      paramArr.push(query.deptId);
    }

    // 查询条件数 长度必为0其值为0
    const count_row: { total: number }[] = await this.db.execute(
      `select count(1) as 'total' from sys_role r
      left join sys_user_role ur on ur.role_id = r.role_id
      left join sys_user u on u.user_id = ur.user_id
      left join sys_dept d on u.dept_id = d.dept_id where r.del_flag = '0' ${sqlStr}`,
      paramArr
    );
    if (count_row[0].total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    let pageSize = parseNumber(query.pageSize);
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_ROLE_VO} where r.del_flag = '0' ${sqlStr} order by r.role_sort`,
      paramArr
    );
    const rows = parseSysRoleResult(results);
    return { total: count_row[0].total, rows };
  }

  async selectRoleList(sysRole: SysRole): Promise<SysRole[]> {
    let sqlStr = "";
    const paramArr = [];
    if (sysRole.roleId) {
      sqlStr += " and r.role_id = ? ";
      paramArr.push(sysRole.roleId);
    }
    if (sysRole.roleKey) {
      sqlStr += " and r.role_key like concat('%', ?, '%') ";
      paramArr.push(sysRole.roleKey);
    }
    if (sysRole.roleName) {
      sqlStr += " and r.role_name like concat('%', ?, '%') ";
      paramArr.push(sysRole.roleName);
    }
    if (sysRole.status) {
      sqlStr += " and r.status = ? ";
      paramArr.push(sysRole.status);
    }
    const rows = await this.db.execute(`${SELECT_ROLE_VO} where r.del_flag = '0' ${sqlStr} order by r.role_sort`, paramArr);
    return parseSysRoleResult(rows);
  }

  async selectRolePermissionByUserId(userId: string): Promise<SysRole[]> {
    let sqlStr = `${SELECT_ROLE_VO} where r.del_flag = '0' and ur.user_id = ?`;
    const paramArr = [userId];
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysRoleResult(rows);
  }

  selectRoleAll(): Promise<SysRole[]> {
    throw new Error('Method not implemented.');
  }
  selectRoleListByUserId(userId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  async selectRoleById(roleId: string): Promise<SysRole> {
    let sqlStr = `${SELECT_ROLE_VO} where r.role_id = ?`;
    const paramArr = [roleId];
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysRoleResult(rows)[0] || null;
  }
  async selectRolesByUserName(userName: string): Promise<SysRole[]> {
    let sqlStr = `${SELECT_ROLE_VO} where r.del_flag = '0' and u.user_name = ? `;
    const paramArr = [userName];
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysRoleResult(rows);
  }
  checkUniqueRoleName(roleName: string): Promise<SysRole> {
    throw new Error('Method not implemented.');
  }
  checkUniqueRoleKey(roleKey: string): Promise<SysRole> {
    throw new Error('Method not implemented.');
  }
  updateRole(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insert_role(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteRoleById(roleId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteRoleByIds(roleIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
