import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysDept } from '../../../../framework/core/model/SysDept';
import { SysRole } from '../../../../framework/core/model/SysRole';
import { SysUser } from '../../../../framework/core/model/SysUser';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { ISysUserRepository } from '../ISysUserRepository';

/**查询视图对象SQL */
const SELECT_USER_VO = `select 
u.user_id, u.dept_id, u.user_name, u.nick_name, u.email, u.avatar, u.phonenumber, u.password, u.sex, u.status, u.del_flag, u.login_ip, u.login_time, u.create_by, u.create_time, u.remark, 
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
SYS_USER_RESULT.set('email', 'email');
SYS_USER_RESULT.set('phonenumber', 'phonenumber');
SYS_USER_RESULT.set('sex', 'sex');
SYS_USER_RESULT.set('avatar', 'avatar');
SYS_USER_RESULT.set('password', 'password');
SYS_USER_RESULT.set('status', 'status');
SYS_USER_RESULT.set('del_flag', 'delFlag');
SYS_USER_RESULT.set('login_ip', 'loginIp');
SYS_USER_RESULT.set('login_time', 'loginTime');
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
function parseSysUserResult(rows: any[]): SysUser[] {
  const sysUsers: SysUser[] = [];
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
    sysUser.roles.push(sysRole);
    sysUsers.push(sysUser);
  }
  return sysUsers;
}

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserRepositoryImpl implements ISysUserRepository {
  @Inject()
  private db: MysqlManager;

  selectUserList(sysUser: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  selectAllocatedList(sysUser: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  selectUnallocatedList(sysUser: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }

  public async selectUserByUserName(userName: string): Promise<SysUser> {
    let sqlStr = `${SELECT_USER_VO} where u.del_flag = '0' and u.user_name = ?`;
    const paramArr = [userName];
    const rows = await this.db.execute(sqlStr, paramArr);
    const sysUsers = parseSysUserResult(rows);
    let sysUser = new SysUser();
    sysUsers.forEach((v, i) => {
      if (i === 0) {
        if (v.roles && v.roles.length === 0) {
          v.roles = [];
        }
        sysUser = v;
      } else {
        if (v.roles && v.roles.length !== 0) {
          sysUser.roles.concat(v.roles);
        }
      }
    });
    return sysUser.userId ? sysUser : null;
  }

  selectUserById(userId: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  insertUser(sysUser: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }

  public async updateUser(sysUser: SysUser): Promise<number> {
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
    if (sysUser.email) {
      paramMap.set('email', sysUser.email);
    }
    if (sysUser.phonenumber) {
      paramMap.set('phonenumber', sysUser.phonenumber);
    }
    if (sysUser.sex) {
      paramMap.set('sex', sysUser.sex);
    }
    if (sysUser.avatar) {
      paramMap.set('avatar', sysUser.avatar);
    }
    if (sysUser.loginIp) {
      paramMap.set('login_ip', sysUser.loginIp);
    }
    if (sysUser.loginTime) {
      paramMap.set('login_time', sysUser.loginTime);
    }
    if (sysUser.updateBy) {
      paramMap.set('update_by', sysUser.updateBy);
    }
    if (sysUser.remark) {
      paramMap.set('remark', sysUser.remark);
    }
    const sqlStr = `update sys_user set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(', ')}, update_time = sysdate() 
      where user_id = '${sysUser.userId}'`;

    const rows: any[] = await this.db.execute(sqlStr, [...paramMap.values()]);
    return rows.length;
  }

  updateUserAvatar(userName: string, avatar: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  resetRserPwd(userName: string, password: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteUserById(userId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteUserByIds(userIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  checkUniqueUserName(userName: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  checkUniquePhone(phonenumber: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
  checkUniqueEmail(email: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }
}
