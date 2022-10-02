import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysUser } from '../../../framework/core/model/sys_user';
import { MysqlManager } from '../../../framework/data_source/mysql_manager';
import { SysUserRepoInterface } from './interfaces/sys_user_repo.interface';

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserRepo implements SysUserRepoInterface {
  @Inject()
  private db: MysqlManager;

  select_user_list(sys_user: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  select_allocated_list(sys_user: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  select_unallocated_list(sys_user: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  select_user_by_user_name(user_name: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  select_user_by_Id(user_id: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  insert_user(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async update_user(sys_user: SysUser): Promise<number> {
    let param_map = new Map();
    if (sys_user.dept_id) {
      param_map.set('dept_id', sys_user.dept_id);
    }
    if (sys_user.user_name) {
      param_map.set('user_name', sys_user.user_name);
    }
    if (sys_user.nick_name) {
      param_map.set('nick_name', sys_user.nick_name);
    }
    if (sys_user.email) {
      param_map.set('email', sys_user.email);
    }
    if (sys_user.phonenumber) {
      param_map.set('phonenumber', sys_user.phonenumber);
    }
    if (sys_user.sex) {
      param_map.set('sex', sys_user.sex);
    }
    if (sys_user.avatar) {
      param_map.set('avatar', sys_user.avatar);
    }
    if (sys_user.login_ip) {
      param_map.set('login_ip', sys_user.login_ip);
    }
    if (sys_user.login_date) {
      param_map.set('login_date', sys_user.login_date.getTime());
    }
    if (sys_user.update_by) {
      param_map.set('update_by', sys_user.update_by);
    }
    if (sys_user.remark) {
      param_map.set('remark', sys_user.remark);
    }
    let sql_str = `update sys_user set(${[...param_map.keys()]
      .map(k => `${k} = ?`)
      .join(',')},update_time = sysdate()) where user_id = ${sys_user.user_id}`;

    const rows: any[] = await this.db.execute(sql_str, [...param_map.values()]);
    return rows.length;
  }

  update_user_avatar(user_name: string, avatar: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  reset_user_pwd(user_name: string, password: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_user_by_id(user_id: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_user_by_ids(user_ids: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  check_unique_user_name(user_name: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  check_unique_phone(phonenumber: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  check_unique_email(email: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
}
