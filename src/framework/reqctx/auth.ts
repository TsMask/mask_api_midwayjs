import { type Context } from '@midwayjs/koa';

import {
  ROLE_SCOPE_ALL,
  ROLE_SCOPE_CUSTOM,
  ROLE_SCOPE_DEPT,
  ROLE_SCOPE_DEPT_CHILD,
  ROLE_SCOPE_SELF,
} from '../constants/role_data_scope';
import { CTX_LOGIN_USER } from '../constants/common';
import { UserInfo } from '../token/user_info';
import { isSystemUser } from './context';

/**
 * 登录用户信息
 * @param c 上下文对象
 * @returns 登录用户信息
 */
export function loginUser(c: Context): [UserInfo, string] {
  const value = c.getAttr<UserInfo>(CTX_LOGIN_USER);
  if (value && value.deptId) {
    delete value.user.password;
    return [value, ''];
  }
  return [new UserInfo(), 'invalid login user information'];
}

/**
 * 登录用户信息-用户ID
 * @param c 上下文对象
 * @returns 用户ID
 */
export function loginUserToUserID(c: Context): number {
  const [info, err] = loginUser(c);
  if (err) {
    return 0;
  }
  return info.userId;
}

/**
 * 登录用户信息-用户名称
 * @param c 上下文对象
 * @returns 用户名称
 */
export function loginUserToUserName(c: Context): string {
  const [info, err] = loginUser(c);
  if (err) {
    return '';
  }
  return info.user.userName;
}

/**
 * 登录用户信息-包含角色KEY
 * @param c 上下文对象
 * @returns boolen
 */
export function loginUserByContainRoles(c: Context, target: string): boolean {
  const [info, err] = loginUser(c);
  if (err) {
    return false;
  }
  if (isSystemUser(c, info.userId)) {
    return true;
  }
  if (Array.isArray(info.user.roles)) {
    for (const item of info.user.roles) {
      if (item.roleKey === target) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 登录用户信息-包含权限标识
 * @param c 上下文对象
 * @returns boolen
 */
export function loginUserByContainPerms(c: Context, target: string): boolean {
  const [info, err] = loginUser(c);
  if (err) {
    return false;
  }
  if (isSystemUser(c, info.userId)) {
    return true;
  }
  if (Array.isArray(info.permissions)) {
    for (const str of info.permissions) {
      if (str === target) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 登录用户信息-角色数据范围过滤SQL字符串
 * @param c 上下文对象
 * @param deptAlias 部门表别名
 * @param userAlias 用户表别名
 * @return SQL字符串 (...)
 */
export function loginUserToDataScopeSQL(
  c: Context,
  deptAlias: string,
  userAlias: string
): string {
  let dataScopeSQL = '';
  // 登录用户信息
  const [info, err] = loginUser(c);
  if (err) {
    return dataScopeSQL;
  }
  const userInfo = info.user;

  // 如果是系统管理员，则不过滤数据
  if (isSystemUser(c, userInfo.userId)) {
    return dataScopeSQL;
  }
  // 无用户角色
  if (!Array.isArray(userInfo.roles) || userInfo.roles.length <= 0) {
    return dataScopeSQL;
  }

  // 记录角色权限范围定义添加过, 非自定数据权限不需要重复拼接SQL
  const scopeKeys: string[] = [];
  const conditions: string[] = [];
  for (const role of userInfo.roles) {
    const dataScope = role.dataScope;

    if (ROLE_SCOPE_ALL === dataScope) {
      break;
    }

    if (ROLE_SCOPE_CUSTOM !== dataScope) {
      if (scopeKeys.includes(dataScope)) {
        continue;
      }
    }

    if (ROLE_SCOPE_CUSTOM === dataScope) {
      const sql = `${deptAlias}.dept_id IN 
        ( SELECT dept_id FROM sys_role_dept WHERE role_id = ${role.roleId} ) 
        AND ${deptAlias}.dept_id NOT IN 
        ( 
        SELECT d.parent_id FROM sys_dept d 
        INNER JOIN sys_role_dept rd ON rd.dept_id = d.dept_id 
        AND rd.role_id = ${role.roleId}
        )`;
      conditions.push(sql);
    }

    if (ROLE_SCOPE_DEPT === dataScope) {
      conditions.push(`${deptAlias}.dept_id = ${userInfo.deptId}`);
    }

    if (ROLE_SCOPE_DEPT_CHILD === dataScope) {
      const sql = `${deptAlias}.dept_id IN ( 
        SELECT dept_id FROM sys_dept 
        WHERE dept_id = ${userInfo.deptId} 
        OR find_in_set(${userInfo.deptId}, ancestors ) 
        )`;
      conditions.push(sql);
    }

    if (ROLE_SCOPE_SELF === dataScope) {
      if (userAlias === '') {
        conditions.push(`${deptAlias}.dept_id = ${userInfo.deptId}`);
      } else {
        conditions.push(`${userAlias}.user_id = ${userInfo.userId}`);
      }
    }

    // 记录角色范围
    scopeKeys.push(dataScope);
  }

  // 构建查询条件语句
  if (conditions.length > 0) {
    dataScopeSQL = ` ( ${conditions.join(' OR ')} ) `;
  }
  return dataScopeSQL;
}
