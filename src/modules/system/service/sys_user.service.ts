import { Provide, Inject } from '@midwayjs/decorator';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { SysUser } from '../../../common/core/model/sys_user';
import { SysUserServiceInterface } from './interfaces/sys_user_service.interface';

/**
 * 用户 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysUserService implements SysUserServiceInterface {
  @Inject()
  private dataSourceManager: TypeORMDataSourceManager;

  select_user_List(sys_user: SysUser): Promise<[SysUser[], number]> {
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
  select_user_by_id(user_id: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  select_user_role_group(user_name: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  select_user_post_group(user_name: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  check_unique_user_name(user_name: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  check_unique_phone(sys_user: SysUser): Promise<string> {
    throw new Error('Method not implemented.');
  }
  check_email_unique(sys_user: SysUser): Promise<string> {
    throw new Error('Method not implemented.');
  }
  check_user_allowed(sys_user: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  check_user_data_scope(user_id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  insert_user(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  register_user(sys_user: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  update_user(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insert_user_auth(user_id: string, role_ids: string[]): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  update_user_status(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  update_user_profile(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  update_user_avatar(user_name: string, avatar: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  reset_pwd(sys_user: SysUser): Promise<number> {
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

  import_user(
    user_list: SysUser[],
    is_update_support: boolean,
    oper_name: string
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  public async upsdate_user(user: SysUser): Promise<boolean> {
    // 获取连接并创建新的queryRunner
    const dataSource = this.dataSourceManager.getDataSource('default');

    const sql = '';
    const parameters = [];
    dataSource.query(sql, parameters);
    return false;
  }
}
