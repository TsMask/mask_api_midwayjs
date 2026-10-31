import { SysDept } from '../sys_dept';
import { SysDictData } from '../sys_dict_data';
import { SysDictType } from '../sys_dict_type';
import { SysMenu } from '../sys_menu';
import { SysNotice } from '../sys_notice';
import { SysPost } from '../sys_post';
import { SysRole } from '../sys_role';
import { SysUser } from '../sys_user';

function stringValue(value: string | undefined): string {
  return value ?? '';
}

function numberValue(value: number | undefined): number {
  return value ?? 0;
}

export type SerializedSysDept = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  parent_id: number;
  dept_name: string;
  dept_leader: string;
  dept_phone: string;
  dept_email: string;
  dept_sort: number;
  dept_status: string;
  children?: SerializedSysDept[];
};

export type SerializedSysRole = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  role_name: string;
  role_key: string;
  role_sort: number;
  role_status: string;
  role_data_scope: string;
  role_menu_check_strictly: string;
  role_dept_check_strictly: string;
  menu_ids?: number[];
  dept_ids?: number[];
};

export type SerializedSysUser = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  user_name: string;
  user_nick: string;
  user_email: string;
  user_phone: string;
  user_gender: string;
  user_avatar: string;
  user_login_ip: string;
  user_login_time: number;
  user_status: string;
  dept_id: number;
  dept: SerializedSysDept | null;
  roles: SerializedSysRole[] | null;
  role_ids?: number[];
  post_ids?: number[];
};

export type SerializedSysMenu = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  parent_id: number;
  menu_name: string;
  menu_sort: number;
  menu_path: string;
  menu_component: string;
  menu_perms: string;
  menu_icon: string;
  menu_external: string;
  menu_cache: string;
  menu_type: string;
  menu_visible: string;
  menu_status: string;
  children?: SerializedSysMenu[];
};

export type SerializedSysPost = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  post_code: string;
  post_name: string;
  post_sort: number;
  post_status: string;
};

export type SerializedSysNotice = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  notice_title: string;
  notice_type: string;
  notice_content: string;
  notice_status: string;
};

export type SerializedSysDictType = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  dict_name: string;
  dict_type: string;
  dict_status: string;
};

export type SerializedSysDictData = {
  id: number;
  create_by: string;
  create_time: number;
  update_by: string;
  update_time: number;
  remark: string;
  dict_type: string;
  data_label: string;
  data_value: string;
  data_sort: number;
  data_status: string;
  tag_class: string;
  tag_type: string;
};

export function serializeSysDept(sysDept: SysDept): SerializedSysDept {
  const result: SerializedSysDept = {
    id: numberValue(sysDept.id),
    create_by: stringValue(sysDept.createBy),
    create_time: numberValue(sysDept.createTime),
    update_by: stringValue(sysDept.updateBy),
    update_time: numberValue(sysDept.updateTime),
    remark: stringValue(sysDept.remark),
    parent_id: numberValue(sysDept.parentId),
    dept_name: stringValue(sysDept.deptName),
    dept_leader: stringValue(sysDept.deptLeader),
    dept_phone: stringValue(sysDept.deptPhone),
    dept_email: stringValue(sysDept.deptEmail),
    dept_sort: numberValue(sysDept.deptSort),
    dept_status: stringValue(sysDept.deptStatus),
  };
  if (sysDept.children?.length) {
    result.children = sysDept.children.map(serializeSysDept);
  }
  return result;
}

export function serializeSysRole(sysRole: SysRole): SerializedSysRole {
  const result: SerializedSysRole = {
    id: numberValue(sysRole.id),
    create_by: stringValue(sysRole.createBy),
    create_time: numberValue(sysRole.createTime),
    update_by: stringValue(sysRole.updateBy),
    update_time: numberValue(sysRole.updateTime),
    remark: stringValue(sysRole.remark),
    role_name: stringValue(sysRole.roleName),
    role_key: stringValue(sysRole.roleKey),
    role_sort: numberValue(sysRole.roleSort),
    role_status: stringValue(sysRole.roleStatus),
    role_data_scope: stringValue(sysRole.roleDataScope),
    role_menu_check_strictly: stringValue(sysRole.roleMenuCheckStrictly),
    role_dept_check_strictly: stringValue(sysRole.roleDeptCheckStrictly),
  };
  if (sysRole.menuIds?.length) {
    result.menu_ids = sysRole.menuIds;
  }
  if (sysRole.deptIds?.length) {
    result.dept_ids = sysRole.deptIds;
  }
  return result;
}

export function serializeSysUser(sysUser: SysUser): SerializedSysUser {
  const result: SerializedSysUser = {
    id: numberValue(sysUser.id),
    create_by: stringValue(sysUser.createBy),
    create_time: numberValue(sysUser.createTime),
    update_by: stringValue(sysUser.updateBy),
    update_time: numberValue(sysUser.updateTime),
    remark: stringValue(sysUser.remark),
    user_name: stringValue(sysUser.userName),
    user_nick: stringValue(sysUser.userNick),
    user_email: stringValue(sysUser.userEmail),
    user_phone: stringValue(sysUser.userPhone),
    user_gender: stringValue(sysUser.userGender),
    user_avatar: stringValue(sysUser.userAvatar),
    user_login_ip: stringValue(sysUser.userLoginIp),
    user_login_time: numberValue(sysUser.userLoginTime),
    user_status: stringValue(sysUser.userStatus),
    dept_id: numberValue(sysUser.deptId),
    dept: sysUser.dept ? serializeSysDept(sysUser.dept) : null,
    roles: sysUser.roles ? sysUser.roles.map(serializeSysRole) : null,
  };
  if (sysUser.roleIds?.length) {
    result.role_ids = sysUser.roleIds;
  }
  if (sysUser.postIds?.length) {
    result.post_ids = sysUser.postIds;
  }
  return result;
}

export function serializeSysMenu(sysMenu: SysMenu): SerializedSysMenu {
  const result: SerializedSysMenu = {
    id: numberValue(sysMenu.id),
    create_by: stringValue(sysMenu.createBy),
    create_time: numberValue(sysMenu.createTime),
    update_by: stringValue(sysMenu.updateBy),
    update_time: numberValue(sysMenu.updateTime),
    remark: stringValue(sysMenu.remark),
    parent_id: numberValue(sysMenu.parentId),
    menu_name: stringValue(sysMenu.menuName),
    menu_sort: numberValue(sysMenu.menuSort),
    menu_path: stringValue(sysMenu.menuPath),
    menu_component: stringValue(sysMenu.menuComponent),
    menu_perms: stringValue(sysMenu.menuPerms),
    menu_icon: stringValue(sysMenu.menuIcon),
    menu_external: stringValue(sysMenu.menuExternal),
    menu_cache: stringValue(sysMenu.menuCache),
    menu_type: stringValue(sysMenu.menuType),
    menu_visible: stringValue(sysMenu.menuVisible),
    menu_status: stringValue(sysMenu.menuStatus),
  };
  if (sysMenu.children?.length) {
    result.children = sysMenu.children.map(serializeSysMenu);
  }
  return result;
}

export function serializeSysPost(sysPost: SysPost): SerializedSysPost {
  return {
    id: numberValue(sysPost.id),
    create_by: stringValue(sysPost.createBy),
    create_time: numberValue(sysPost.createTime),
    update_by: stringValue(sysPost.updateBy),
    update_time: numberValue(sysPost.updateTime),
    remark: stringValue(sysPost.remark),
    post_code: stringValue(sysPost.postCode),
    post_name: stringValue(sysPost.postName),
    post_sort: numberValue(sysPost.postSort),
    post_status: stringValue(sysPost.postStatus),
  };
}

export function serializeSysNotice(sysNotice: SysNotice): SerializedSysNotice {
  return {
    id: numberValue(sysNotice.id),
    create_by: stringValue(sysNotice.createBy),
    create_time: numberValue(sysNotice.createTime),
    update_by: stringValue(sysNotice.updateBy),
    update_time: numberValue(sysNotice.updateTime),
    remark: stringValue(sysNotice.remark),
    notice_title: stringValue(sysNotice.noticeTitle),
    notice_type: stringValue(sysNotice.noticeType),
    notice_content: stringValue(sysNotice.noticeContent),
    notice_status: stringValue(sysNotice.noticeStatus),
  };
}

export function serializeSysDictType(
  sysDictType: SysDictType
): SerializedSysDictType {
  return {
    id: numberValue(sysDictType.id),
    create_by: stringValue(sysDictType.createBy),
    create_time: numberValue(sysDictType.createTime),
    update_by: stringValue(sysDictType.updateBy),
    update_time: numberValue(sysDictType.updateTime),
    remark: stringValue(sysDictType.remark),
    dict_name: stringValue(sysDictType.dictName),
    dict_type: stringValue(sysDictType.dictType),
    dict_status: stringValue(sysDictType.dictStatus),
  };
}

export function serializeSysDictData(
  sysDictData: SysDictData
): SerializedSysDictData {
  return {
    id: numberValue(sysDictData.id),
    create_by: stringValue(sysDictData.createBy),
    create_time: numberValue(sysDictData.createTime),
    update_by: stringValue(sysDictData.updateBy),
    update_time: numberValue(sysDictData.updateTime),
    remark: stringValue(sysDictData.remark),
    dict_type: stringValue(sysDictData.dictType),
    data_label: stringValue(sysDictData.dataLabel),
    data_value: stringValue(sysDictData.dataValue),
    data_sort: numberValue(sysDictData.dataSort),
    data_status: stringValue(sysDictData.dataStatus),
    tag_class: stringValue(sysDictData.tagClass),
    tag_type: stringValue(sysDictData.tagType),
  };
}
