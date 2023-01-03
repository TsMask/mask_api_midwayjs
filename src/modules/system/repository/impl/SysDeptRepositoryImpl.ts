import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { SysDept } from '../../model/SysDept';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysDeptRepository } from '../ISysDeptRepository';

/**查询视图对象SQL */
const SELECT_DEPT_VO = `select 
d.dept_id, d.parent_id, d.ancestors, d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status, d.del_flag, d.create_by, d.create_time 
from sys_dept d`;

/**部门管理表信息实体映射 */
const SYS_DEPT_RESULT = new Map<string, string>();
SYS_DEPT_RESULT.set('dept_id', 'deptId');
SYS_DEPT_RESULT.set('parent_id', 'parentId');
SYS_DEPT_RESULT.set('ancestors', 'ancestors');
SYS_DEPT_RESULT.set('dept_name', 'deptName');
SYS_DEPT_RESULT.set('order_num', 'orderNum');
SYS_DEPT_RESULT.set('leader', 'leader');
SYS_DEPT_RESULT.set('phone', 'phone');
SYS_DEPT_RESULT.set('email', 'email');
SYS_DEPT_RESULT.set('status', 'status');
SYS_DEPT_RESULT.set('del_flag', 'delFlag');
SYS_DEPT_RESULT.set('parent_name', 'parentName');
SYS_DEPT_RESULT.set('create_by', 'createBy');
SYS_DEPT_RESULT.set('create_time', 'createTime');
SYS_DEPT_RESULT.set('update_by', 'updateBy');
SYS_DEPT_RESULT.set('update_time', 'updateTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysDeptResult(rows: any[]): SysDept[] {
  const sysDepts: SysDept[] = [];
  for (const row of rows) {
    const sysDept = new SysDept();
    for (const key in row) {
      if (SYS_DEPT_RESULT.has(key)) {
        const keyMapper = SYS_DEPT_RESULT.get(key);
        sysDept[keyMapper] = row[key];
      }
    }
    sysDepts.push(sysDept);
  }
  return sysDepts;
}

/**
 * 部门管理 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDeptRepositoryImpl implements ISysDeptRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectDeptList(
    sysDept: SysDept,
    dataScopeSQL = ''
  ): Promise<SysDept[]> {
    let sqlStr = `${SELECT_DEPT_VO} where d.del_flag = '0' ${dataScopeSQL}`;
    const paramArr = [];
    if (sysDept?.deptId) {
      sqlStr += ' and dept_id = ? ';
      paramArr.push(sysDept.deptId);
    }
    if (sysDept?.parentId) {
      sqlStr += ' and parent_id = ? ';
      paramArr.push(sysDept.parentId);
    }
    if (sysDept?.deptName) {
      sqlStr += " and dept_name like concat('%', ?, '%') ";
      paramArr.push(sysDept.deptName);
    }
    if (sysDept?.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysDept.status);
    }
    sqlStr += ' order by d.parent_id, d.order_num asc ';
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysDeptResult(rows);
  }

  async selectDeptListByRoleId(
    roleId: string,
    deptCheckStrictly: boolean
  ): Promise<string[]> {
    let sqlStr = `select d.dept_id as 'str' from sys_dept d
    left join sys_role_dept rd on d.dept_id = rd.dept_id
    where 1 = 1`;
    const paramArr = [];
    if (roleId) {
      sqlStr += ' and rd.role_id = ? ';
      paramArr.push(roleId);
    }
    if (deptCheckStrictly) {
      sqlStr += `and d.dept_id not in (
      select d.parent_id from sys_dept d 
      inner join sys_role_dept rd on d.dept_id = rd.dept_id and rd.role_id = ?
      )`;
      paramArr.push(roleId);
    }
    sqlStr += ' order by d.parent_id, d.order_num ';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.map(v => v.str);
  }

  async selectDeptById(deptId: string): Promise<SysDept> {
    const sqlStr = `select d.dept_id, d.parent_id, d.ancestors, d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status,
    (select dept_name from sys_dept where dept_id = d.parent_id) parent_name 
    from sys_dept d where d.dept_id = ?`;
    const rows = await this.db.execute(sqlStr, [deptId]);
    return parseSysDeptResult(rows)[0] || null;
  }

  async selectChildrenDeptById(deptId: string): Promise<SysDept[]> {
    const sqlStr = `${SELECT_DEPT_VO} where find_in_set(?, ancestors)`;
    const rows = await this.db.execute(sqlStr, [deptId]);
    return parseSysDeptResult(rows);
  }

  async selectNormalChildrenDeptById(deptId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_dept where status = 0 and del_flag = '0' and find_in_set(?, ancestors) ";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [deptId]);
    return parseNumber(countRow[0].total);
  }

  async hasChildByDeptId(deptId: string): Promise<number> {
    const sqlStr = `select count(1) as 'total' from sys_dept
		where del_flag = '0' and parent_id = ? limit 1`;
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [deptId]);
    return parseNumber(countRow[0].total);
  }

  async checkDeptExistUser(deptId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_user where dept_id = ? and del_flag = '0'";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [deptId]);
    return parseNumber(countRow[0].total);
  }

  async checkUniqueDeptName(
    deptName: string,
    parentId: string
  ): Promise<string> {
    const sqlStr =
      "select dept_id as 'str' from sys_dept where dept_name = ? and parent_id = ? and del_flag = '0' limit 1";
    const paramArr = [deptName, parentId];
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.length > 0 ? rows[0].str : null;
  }

  async insertDept(sysDept: SysDept): Promise<string> {
    const paramMap = new Map();
    if (sysDept.deptId) {
      paramMap.set('dept_id', sysDept.deptId);
    }
    if (sysDept.parentId) {
      paramMap.set('parent_id', sysDept.parentId);
    }
    if (sysDept.deptName) {
      paramMap.set('dept_name', sysDept.deptName);
    }
    if (sysDept.ancestors) {
      paramMap.set('ancestors', sysDept.ancestors);
    }
    if (sysDept.orderNum >= 0) {
      paramMap.set('order_num', parseNumber(sysDept.orderNum));
    }
    if (sysDept.leader) {
      paramMap.set('leader', sysDept.leader);
    }
    if (sysDept.phone) {
      paramMap.set('phone', sysDept.phone);
    }
    if (sysDept.email) {
      paramMap.set('email', sysDept.email);
    }
    if (sysDept.status) {
      paramMap.set('status', parseNumber(sysDept.status));
    }
    if (sysDept.createBy) {
      paramMap.set('create_by', sysDept.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_dept (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateDept(sysDept: SysDept): Promise<number> {
    const paramMap = new Map();
    if (sysDept.parentId) {
      paramMap.set('parent_id', sysDept.parentId);
    }
    if (sysDept.deptName) {
      paramMap.set('dept_name', sysDept.deptName);
    }
    if (sysDept.ancestors) {
      paramMap.set('ancestors', sysDept.ancestors);
    }
    if (sysDept.orderNum >= 0) {
      paramMap.set('order_num', parseNumber(sysDept.orderNum));
    }
    if (sysDept.leader) {
      paramMap.set('leader', sysDept.leader);
    }
    if (sysDept.phone) {
      paramMap.set('phone', sysDept.phone);
    }
    if (sysDept.email) {
      paramMap.set('email', sysDept.email);
    }
    if (sysDept.status) {
      paramMap.set('status', parseNumber(sysDept.status));
    }
    if (sysDept.updateBy) {
      paramMap.set('update_by', sysDept.updateBy);
      paramMap.set('update_time', Date.now());
    }
    const sqlStr = `update sys_dept set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where dept_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysDept.deptId,
    ]);
    return result.affectedRows;
  }

  async updateDeptStatusNormal(deptIds: string[]): Promise<number> {
    const sqlStr = `update sys_dept set status = '0' where dept_id in (${deptIds
      .map(() => '?')
      .join(',')}) `;
    const result: ResultSetHeader = await this.db.execute(sqlStr, deptIds);
    return result.affectedRows;
  }

  async updateDeptChildren(sysDepts: SysDept[]): Promise<number> {
    // 无参数
    if (Array.isArray(sysDepts) && sysDepts.length === 0) {
      return 0;
    }

    // 数据组合
    const setArr: string[] = [];
    const paramArr: string[] = [];
    for (const dept of sysDepts) {
      setArr.push(`case when ${dept.deptId} then ${dept.ancestors} end`);
      paramArr.push(dept.deptId);
    }

    const sqlStr = `update sys_dept set ancestors = ${setArr.join(
      ' '
    )} where dept_id in (${paramArr.map(() => '?').join(',')}) `;
    const result: ResultSetHeader = await this.db.execute(sqlStr, paramArr);
    return result.affectedRows;
  }

  async deleteDeptById(deptId: string): Promise<number> {
    const sqlStr = "update sys_dept set del_flag = '2' where dept_id = ?";
    const result: ResultSetHeader = await this.db.execute(sqlStr, [deptId]);
    return result.affectedRows;
  }
}
