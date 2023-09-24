import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { SysDept } from '../../model/SysDept';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysDeptRepository } from '../ISysDeptRepository';

/**查询视图对象SQL */
const SELECT_DEPT_SQL = `select 
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
SYS_DEPT_RESULT.set('create_by', 'createBy');
SYS_DEPT_RESULT.set('create_time', 'createTime');
SYS_DEPT_RESULT.set('update_by', 'updateBy');
SYS_DEPT_RESULT.set('update_time', 'updateTime');
SYS_DEPT_RESULT.set('parent_name', 'parentName');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysDept[] {
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
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysDeptRepositoryImpl implements ISysDeptRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectDeptList(
    sysDept: SysDept,
    dataScopeSQL = ''
  ): Promise<SysDept[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDept?.deptId) {
      conditions.push('dept_id = ?');
      params.push(sysDept.deptId);
    }
    if (sysDept?.parentId) {
      conditions.push('parent_id = ?');
      params.push(sysDept.parentId);
    }
    if (sysDept?.deptName) {
      conditions.push("dept_name like concat(?, '%')");
      params.push(sysDept.deptName);
    }
    if (sysDept?.status) {
      conditions.push('status = ?');
      params.push(sysDept.status);
    }

    // 构建查询条件语句
    let whereSql = " where d.del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数据
    const orderSql = ' order by d.parent_id, d.order_num asc ';
    const querySql = SELECT_DEPT_SQL + whereSql + dataScopeSQL + orderSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectDeptListByRoleId(
    roleId: string,
    deptCheckStrictly: boolean
  ): Promise<string[]> {
    let sqlStr = `select d.dept_id as 'str' from sys_dept d
    left join sys_role_dept rd on d.dept_id = rd.dept_id
    where rd.role_id = ? `;
    const paramArr = [roleId];
    // 关联显示
    if (deptCheckStrictly) {
      sqlStr += ` and d.dept_id not in 
      (select d.parent_id from sys_dept d
      inner join sys_role_dept rd on d.dept_id = rd.dept_id 
      and rd.role_id = ?) `;
      paramArr.push(roleId);
    }
    sqlStr += ' order by d.parent_id, d.order_num ';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.map(v => v.str);
  }

  async selectDeptById(deptId: string): Promise<SysDept> {
    const sqlStr = `select d.dept_id, d.parent_id, d.ancestors, 
    d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status,
    (select dept_name from sys_dept where dept_id = d.parent_id) parent_name 
    from sys_dept d where d.dept_id = ?`;
    const rows = await this.db.execute(sqlStr, [deptId]);
    return convertResultRows(rows)[0] || null;
  }

  async selectChildrenDeptById(deptId: string): Promise<SysDept[]> {
    const sqlStr = `${SELECT_DEPT_SQL} where find_in_set(?, d.ancestors)`;
    const rows = await this.db.execute(sqlStr, [deptId]);
    return convertResultRows(rows);
  }

  async hasChildByDeptId(deptId: string): Promise<number> {
    const sqlStr = `select count(1) as 'total' from sys_dept
		where status = '1' and parent_id = ? limit 1`;
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [deptId]);
    return parseNumber(countRow[0].total);
  }

  async checkDeptExistUser(deptId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_user where dept_id = ? and del_flag = '0'";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [deptId]);
    return parseNumber(countRow[0].total);
  }

  async checkUniqueDept(sysDept: SysDept): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysDept.deptName) {
      conditions.push('dept_name = ?');
      params.push(sysDept.deptName);
    }
    if (sysDept.parentId) {
      conditions.push('parent_id = ?');
      params.push(sysDept.parentId);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select dept_id as 'str' from sys_dept " +
      whereSql +
      " and del_flag = '0' limit 1";
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
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
    if (sysDept.orderNum > 0) {
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
    const result = await this.db.execute(sqlStr, [...paramMap.values()]);
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
    sysDept.orderNum = parseNumber(sysDept.orderNum);
    if (sysDept.orderNum > 0) {
      paramMap.set('order_num', sysDept.orderNum);
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
    const result = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysDept.deptId,
    ]);
    return result.affectedRows;
  }

  async updateDeptStatusNormal(deptIds: string[]): Promise<number> {
    if (deptIds.length === 0) return 0;

    const sqlStr = `update sys_dept set status = '1' where dept_id in (${deptIds
      .map(() => '?')
      .join(',')}) `;
    const result = await this.db.execute(sqlStr, deptIds);
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
      setArr.push(`WHEN dept_id = '${dept.deptId}' THEN '${dept.ancestors}'`);
      paramArr.push(dept.deptId);
    }

    const cases = setArr.join(' ');
    const placeholders = paramArr.map(() => '?').join(',');
    const sqlStr = `update sys_dept set ancestors = CASE ${cases} END where dept_id in (${placeholders}) `;
    const result = await this.db.execute(sqlStr, paramArr);
    return result.affectedRows;
  }

  async deleteDeptById(deptId: string): Promise<number> {
    const sqlStr =
      "update sys_dept set status = '0', del_flag = '1' where dept_id = ?";
    const result = await this.db.execute(sqlStr, [deptId]);
    return result.affectedRows;
  }
}
