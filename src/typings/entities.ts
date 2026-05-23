// TypeORM 实体显式注册（用于单文件构建等无法使用 glob 扫描的场景）
import { DemoORM } from '../modules/demo/model/demo_orm';
// monitor
import { SysJob } from '../modules/monitor/model/sys_job';
import { SysJobLog } from '../modules/monitor/model/sys_job_log';
// system
import { SysConfig } from '../modules/system/model/sys_config';
import { SysDept } from '../modules/system/model/sys_dept';
import { SysDictData } from '../modules/system/model/sys_dict_data';
import { SysDictType } from '../modules/system/model/sys_dict_type';
import { SysLogLogin } from '../modules/system/model/sys_log_login';
import { SysLogOperate } from '../modules/system/model/sys_log_operate';
import { SysMenu } from '../modules/system/model/sys_menu';
import { SysNotice } from '../modules/system/model/sys_notice';
import { SysPost } from '../modules/system/model/sys_post';
import { SysRole } from '../modules/system/model/sys_role';
import { SysRoleDept } from '../modules/system/model/sys_role_dept';
import { SysRoleMenu } from '../modules/system/model/sys_role_menu';
import { SysUser } from '../modules/system/model/sys_user';
import { SysUserPost } from '../modules/system/model/sys_user_post';
import { SysUserRole } from '../modules/system/model/sys_user_role';

export const entities = [
  DemoORM,
  // monitor
  SysJob,
  SysJobLog,
  // system
  SysConfig,
  SysDept,
  SysDictData,
  SysDictType,
  SysLogLogin,
  SysLogOperate,
  SysMenu,
  SysNotice,
  SysPost,
  SysRole,
  SysRoleDept,
  SysRoleMenu,
  SysUser,
  SysUserPost,
  SysUserRole,
];
