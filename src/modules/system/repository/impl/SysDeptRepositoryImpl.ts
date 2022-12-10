import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { SysDept } from '../../../../framework/core/model/SysDept';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { ISysDeptRepository } from '../ISysDeptRepository';

/**查询视图对象SQL */
const SELECT_DEPT_VO = `select 
d.dept_id, d.parent_id, d.ancestors, d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status, d.del_flag, d.create_by, d.create_time 
from sys_dept d`;

const SELECT_DEPT_TOTAL = "select count(1) as 'total' from sys_dept";

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
  private db: MysqlManager;

  async selectDeptPage(pageBody: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    const sysDept: SysDept = pageBody.search;
    if (sysDept.deptId) {
      sqlStr += ' and dept_id = ? ';
      paramArr.push(sysDept.deptId);
    }
    if (sysDept.parentId) {
      sqlStr += ' and parent_id = ? ';
      paramArr.push(sysDept.parentId);
    }
    if (sysDept.deptName) {
      sqlStr += " and dept_name like concat('%', ?, '%') ";
      paramArr.push(sysDept.deptName);
    }
    if (sysDept.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysDept.status);
    }
    // 查询条件数 长度必为0其值为0
    const countRow: rowTotal[] = await this.db.execute(
      `${SELECT_DEPT_TOTAL} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    if (countRow[0].total <= 0) {
      return { total: 0, rows: [] };
    }

    // 排序列
    if (pageBody.orderByColumn && pageBody.orderByIs) {
      sqlStr += ' order by ? ? ';
      paramArr.push(pageBody.orderByColumn);
      paramArr.push(pageBody.orderByIs);
    }
    // 分页
    if (pageBody.pageNum && pageBody.pageSize) {
      sqlStr += ' limit ?,? ';
      paramArr.push(pageBody.pageNum - 1);
      paramArr.push(pageBody.pageNum * pageBody.pageSize);
    }
    // 查询数据数
    const rows = await this.db.execute(
      `${SELECT_DEPT_VO} where d.del_flag = '0' ${sqlStr}`,
      paramArr
    );
    // 将数据包装
    return { total: countRow[0].total, rows };
  }

  async selectDeptList(sysDept: SysDept): Promise<SysDept[]> {
    let sqlStr = `${SELECT_DEPT_VO} where d.del_flag = '0' `;
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
    let sqlStr = `select d.dept_id as str from sys_dept d
    left join sys_role_dept rd on d.dept_id = rd.dept_id
    where 1 = 1`;
    const paramArr = [];
    if (roleId) {
      sqlStr += ' and rd.role_id = ? ';
      paramArr.push(roleId);
    }
    if (deptCheckStrictly) {
      sqlStr += `and d.dept_id not in (
      select d.parent_id from sysDept d 
      inner join sys_role_dept rd on d.dept_id = rd.dept_id and rd.role_id = ?
      )`;
      paramArr.push(roleId);
    }
    sqlStr += ' order by d.parent_id, d.order_num ';
    const rows: rowOneColumn[] = await this.db.execute(sqlStr, paramArr);
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
    const sqlStr = `${SELECT_DEPT_TOTAL} where status = 0 and del_flag = '0' and find_in_set(?, ancestors) `;
    const rows: rowTotal[] = await this.db.execute(sqlStr, [deptId]);
    return rows.length > 0 ? rows[0].total : 0;
  }

  async hasChildByDeptId(deptId: string): Promise<number> {
    const sqlStr = `select count(1) as 'total' from sys_dept
		where del_flag = '0' and parent_id = ? limit 1`;
    const rows: rowTotal[] = await this.db.execute(sqlStr, [deptId]);
    return rows.length > 0 ? rows[0].total : 0;
  }

  async checkDeptExistUser(deptId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_user where dept_id = ? and del_flag = '0'";
    const rows: rowTotal[] = await this.db.execute(sqlStr, [deptId]);
    return rows.length > 0 ? rows[0].total : 0;
  }

  async checkUniqueDeptName(
    deptName: string,
    parentId: string
  ): Promise<SysDept> {
    let sqlStr = `${SELECT_DEPT_VO} where 1 = 1`;
    const paramArr = [];
    if (deptName) {
      sqlStr += ' and dept_name = ? ';
      paramArr.push(deptName);
    }
    if (parentId) {
      sqlStr += ' and parent_id = ? ';
      paramArr.push(parentId);
    }
    sqlStr += " and del_flag = '0' limit 1 ";
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysDeptResult(rows)[0] || null;
  }

  async insertDept(sysDept: SysDept): Promise<number> {
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
    if (sysDept.orderNum) {
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
      paramMap.set('status', sysDept.status);
    }
    if (sysDept.createBy) {
      paramMap.set('create_by', sysDept.createBy);
      paramMap.set('create_time', new Date().getTime());
    }

    const sqlStr = `insert into sys_dept (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return result.insertId || 0;
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
    if (sysDept.orderNum) {
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
      paramMap.set('status', sysDept.status);
    }
    if (sysDept.updateBy) {
      paramMap.set('update_by', sysDept.updateBy);
      paramMap.set('update_time', new Date().getTime());
    }
    const sqlStr = `update sys_dept set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where dept_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysDept.deptId,
    ]);
    return result.changedRows;
  }

  async updateDeptStatusNormal(deptIds: string[]): Promise<number> {
    // 无参数
    if (Array.isArray(deptIds) && deptIds.length === 0) {
      return 0;
    }

    const sqlStr = `update sys_dept set status = '0' where dept_id in (${deptIds
      .map(() => '?')
      .join(',')}) `;
    const result: ResultSetHeader = await this.db.execute(sqlStr, deptIds);
    return result.changedRows;
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
    return result.changedRows;
  }

  async deleteDeptById(deptId: string): Promise<number> {
    const sqlStr = "update sys_dept set del_flag = '2' where dept_id = ?";
    const result: ResultSetHeader = await this.db.execute(sqlStr, [deptId]);
    return result.changedRows;
  }
}
