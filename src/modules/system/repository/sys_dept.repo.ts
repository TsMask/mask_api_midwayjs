import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysDept } from '../../../framework/core/model/sys_dept';
import { PageBody } from '../../../framework/core/page_body';
import { PageData } from '../../../framework/core/page_data';
import { MysqlManager } from '../../../framework/data_source/mysql_manager';
import { SysDeptRepoInterface } from './interfaces/sys_dept_repo.interface';

const SELECT_DEPT_VO = `
select d.dept_id, d.parent_id, d.ancestors, d.dept_name, d.order_num, d.leader, d.phone, d.email, d.status, d.del_flag, d.create_by, d.create_time 
from sys_dept d
`;

const SELECT_DEPT_TOTAL = "select count(1) as 'total' from sys_dept";

/**
 * 部门管理 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDeptRepo implements SysDeptRepoInterface {
  @Inject()
  private db: MysqlManager;

  async select_dept_page(
    page_body: PageBody<SysDept>
  ): Promise<PageData<SysDept>> {
    // 查询条件拼接
    let sql_str = '';
    let param_arr = [];
    const sys_dept: SysDept = page_body.search;
    if (sys_dept.dept_id) {
      sql_str += ' and dept_id = ? ';
      param_arr.push(sys_dept.dept_id);
    }
    if (sys_dept.parent_id) {
      sql_str += ' and parent_id = ? ';
      param_arr.push(sys_dept.parent_id);
    }
    if (sys_dept.dept_name) {
      sql_str += " and dept_name like concat('%', ?, '%') ";
      param_arr.push(sys_dept.dept_name);
    }
    if (sys_dept.status) {
      sql_str += ' and status = ? ';
      param_arr.push(sys_dept.status);
    }
    // 查询条件数 长度必为0其值为0
    const count_row: { total: number }[] = await this.db.execute(
      `${SELECT_DEPT_TOTAL} where 1 = 1 ${sql_str}`,
      param_arr
    );
    // 排序列
    if (page_body.order_by_column && page_body.order_by_is) {
      sql_str += ' order by ? ? ';
      param_arr.push(page_body.order_by_column);
      param_arr.push(page_body.order_by_is);
    }
    // 分页
    if (page_body.page_num && page_body.page_size) {
      sql_str += ' limit ?,? ';
      param_arr.push(page_body.page_num - 1);
      param_arr.push(page_body.page_num * page_body.page_size);
    }
    // 查询数据数
    const rows = await this.db.execute(
      `${SELECT_DEPT_VO} where d.del_flag = '0' ${sql_str}`,
      param_arr
    );
    // 将数据包装
    return new PageData<SysDept>(count_row[0].total, rows);
  }

  async select_dept_list(sys_dept: SysDept): Promise<SysDept[]> {
    let sql_str = `${SELECT_DEPT_VO} where d.del_flag = '0' `;
    let param_arr = [];
    if (sys_dept.dept_id) {
      sql_str += ' and dept_id = ? ';
      param_arr.push(sys_dept.dept_id);
    }
    if (sys_dept.parent_id) {
      sql_str += ' and parent_id = ? ';
      param_arr.push(sys_dept.parent_id);
    }
    if (sys_dept.dept_name) {
      sql_str += " and dept_name like concat('%', ?, '%') ";
      param_arr.push(sys_dept.dept_name);
    }
    if (sys_dept.status) {
      sql_str += ' and status = ? ';
      param_arr.push(sys_dept.status);
    }
    sql_str += ' order by d.parent_id, d.order_num ';
    return await this.db.execute(sql_str, param_arr);
  }

  async select_dept_list_by_role_id(
    role_id: string,
    dept_check_strictly: boolean
  ): Promise<string[]> {
    let sql_str = `select d.dept_id from sys_dept d
    left join sys_role_dept rd on d.dept_id = rd.dept_id
    where 1 = 1`;
    let param_arr = [];
    if (role_id) {
      sql_str += ' and rd.role_id = ? ';
      param_arr.push(role_id);
    }
    if (dept_check_strictly) {
      sql_str += `and d.dept_id not in (
      select d.parent_id from sys_dept d 
      inner join sys_role_dept rd on d.dept_id = rd.dept_id and rd.role_id = ?
      )`;
      param_arr.push(role_id);
    }
    sql_str += ' order by d.parent_id, d.order_num ';
    return await this.db.execute(sql_str, param_arr);
  }

  async select_dept_by_id(dept_id: string): Promise<SysDept> {
    let sql_str = `${SELECT_DEPT_VO} where 1 = 1`;
    let param_arr = [];
    if (dept_id) {
      sql_str += ' and dept_id = ? ';
      param_arr.push(dept_id);
    }
    sql_str += ' order by dept_id desc limit 1 ';
    const rows: SysDept[] = await this.db.execute(sql_str, param_arr);
    return rows.length > 0 ? rows[0] : null;
  }

  async select_children_dept_by_id(dept_id: string): Promise<SysDept[]> {
    let sql_str = `${SELECT_DEPT_VO} where 1 = 1`;
    let param_arr = [];
    if (dept_id) {
      sql_str += ' find_in_set(?, ancestors) ';
      param_arr.push(dept_id);
    }
    return await this.db.execute(sql_str, param_arr);
  }

  async select_normal_children_dept_by_id(dept_id: string): Promise<number> {
    let sql_str = `${SELECT_DEPT_TOTAL} where status = 0 and del_flag = '0'`;
    let param_arr = [];
    if(dept_id){
      sql_str += " and find_in_set(?, ancestors) ";
      param_arr.push(dept_id);
    }
    const count_row: { total: number }[] = await this.db.execute(
      sql_str,
      param_arr
    );
    return count_row.length > 0 ? count_row[0].total : 0;
  }

  async has_child_by_dept_id(dept_id: string): Promise<number> {
    let sql_str = `${SELECT_DEPT_TOTAL} where 1 = 1`;
    let param_arr = [];
    if (dept_id) {
      sql_str += ' and dept_id = ? ';
      param_arr.push(dept_id);
    }
    sql_str += ` and del_flag = '0' limit 1 `;
    const count_row: { total: number }[] = await this.db.execute(
      sql_str,
      param_arr
    );
    return count_row.length > 0 ? count_row[0].total : 0;
  }

  async check_dept_exist_user(dept_id: string): Promise<number> {
    let sql_str = `select count(1) as 'total' from sys_user where 1 = 1`;
    let param_arr = [];
    if (dept_id) {
      sql_str += ' and dept_id = ? ';
      param_arr.push(dept_id);
    }
    sql_str += ` and del_flag = '0' `;
    const count_row: { total: number }[] = await this.db.execute(
      sql_str,
      param_arr
    );
    return count_row.length > 0 ? count_row[0].total : 0;
  }

  async check_unique_dept_name(
    dept_name: string,
    parent_id: string
  ): Promise<SysDept> {
    let sql_str = `${SELECT_DEPT_VO} where 1 = 1`;
    let param_arr = [];
    if (dept_name) {
      sql_str += ' and dept_name = ? ';
      param_arr.push(dept_name);
    }
    if (parent_id) {
      sql_str += ' and parent_id = ? ';
      param_arr.push(parent_id);
    }
    sql_str += ` and del_flag = '0' limit 1 `;
    const rows = await this.db.execute(sql_str, param_arr);
    return rows.length > 0 ? rows[0] : null;
  }

  async insert_dept(sys_dept: SysDept): Promise<number> {
    let param_map = new Map();
    if (sys_dept.dept_id) {
      param_map.set('dept_id', sys_dept.dept_id);
    }
    if (sys_dept.parent_id) {
      param_map.set('parent_id', sys_dept.parent_id);
    }
    if (sys_dept.dept_name) {
      param_map.set('dept_name', sys_dept.dept_name);
    }
    if (sys_dept.ancestors) {
      param_map.set('ancestors', sys_dept.ancestors);
    }
    if (sys_dept.order_num) {
      param_map.set('order_num', sys_dept.order_num);
    }
    if (sys_dept.leader) {
      param_map.set('leader', sys_dept.leader);
    }
    if (sys_dept.phone) {
      param_map.set('phone', sys_dept.phone);
    }
    if (sys_dept.email) {
      param_map.set('email', sys_dept.email);
    }
    if (sys_dept.status) {
      param_map.set('status', sys_dept.status);
    }
    if (sys_dept.create_by) {
      param_map.set('create_by', sys_dept.create_by);
    }
    let sql_str = `insert into sys_dept (${[...param_map.keys()].join(
      ','
    )},create_time)values(${Array.from(
      { length: param_map.size },
      () => '?'
    ).join(',')},sysdate())`;

    const rows: any[] = await this.db.execute(sql_str, [...param_map.values()]);
    return rows.length;
  }

  async update_dept(sys_dept: SysDept): Promise<number> {
    let param_map = new Map();
    if (sys_dept.parent_id) {
      param_map.set('parent_id', sys_dept.parent_id);
    }
    if (sys_dept.dept_name) {
      param_map.set('dept_name', sys_dept.dept_name);
    }
    if (sys_dept.ancestors) {
      param_map.set('ancestors', sys_dept.ancestors);
    }
    if (sys_dept.order_num) {
      param_map.set('order_num', sys_dept.order_num);
    }
    if (sys_dept.leader) {
      param_map.set('leader', sys_dept.leader);
    }
    if (sys_dept.phone) {
      param_map.set('phone', sys_dept.phone);
    }
    if (sys_dept.email) {
      param_map.set('email', sys_dept.email);
    }
    if (sys_dept.status) {
      param_map.set('status', sys_dept.status);
    }
    if (sys_dept.update_by) {
      param_map.set('update_by', sys_dept.update_by);
    }
    let sql_str = `update sys_dept set(${[...param_map.keys()]
      .map(k => `${k} = ?`)
      .join(',')},update_time = sysdate()) where dept_id = ${sys_dept.dept_id}`;

    const rows: any[] = await this.db.execute(sql_str, [...param_map.values()]);
    return rows.length;
  }

  async update_dept_status_normal(dept_ids: string[]): Promise<number> {
    // 无参数
    if ((dept_ids.length = 0)) {
      return 0;
    }

    let sql_str = `update sys_dept set status = '0' where dept_id in (${Array.from(
      { length: dept_ids.length },
      () => '?'
    ).join(',')}) `;

    const rows: any[] = await this.db.execute(sql_str, dept_ids);
    return rows.length;
  }

  async update_dept_children(sys_depts: SysDept[]): Promise<number> {
    // 无参数
    if ((sys_depts.length = 0)) {
      return 0;
    }

    // 数据组合
    let set_arr = [];
    let param_arr = [];
    for (const dept of sys_depts) {
      set_arr.push(`case when ${dept.dept_id} then ${dept.ancestors} end`);
      param_arr.push(dept.dept_id);
    }

    let sql_str = `update sys_dept set ancestors = ${set_arr.join(
      ' '
    )} where dept_id in (${Array.from(
      { length: param_arr.length },
      () => '?'
    ).join(',')}) `;

    const rows: any[] = await this.db.execute(sql_str, param_arr);
    return rows.length;
  }

  async delete_dept_by_id(dept_id: string): Promise<number> {
    let sql_str = `update sys_dept set del_flag = '2' where dept_id = ?`;
    const rows: any[] = await this.db.execute(sql_str, [dept_id]);
    return rows.length;
  }
}
