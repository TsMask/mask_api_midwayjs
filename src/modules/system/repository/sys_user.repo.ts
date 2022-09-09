import { Provide } from '@midwayjs/decorator';
import { SysUser } from '../../../common/core/model/sys_user';
import { SysUserRepoInterface } from './interfaces/sys_user_repo.interface';

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysUserRepo implements SysUserRepoInterface {
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
  update_user(sys_user: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
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
