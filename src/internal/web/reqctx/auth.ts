import { type Context } from '@midwayjs/koa';

import {
  ROLE_SCOPE_ALL,
  ROLE_SCOPE_CUSTOM,
  ROLE_SCOPE_DEPT,
  ROLE_SCOPE_DEPT_CHILD,
  ROLE_SCOPE_SELF,
} from '../../shared/constants/role_data_scope';
import { CTX_LOGIN_USER } from '../../shared/constants/common';
import { UserInfo } from '../token/user_info';
import { isSystemUser } from './context';

/**
 * 登录用户信息
 * @param c 上下文对象
 * @returns 登录用户信息
 */
export function loginUser(c: Context): [UserInfo, string] {
  const value = c.getAttr<UserInfo>(CTX_LOGIN_USER);
  if (value && value.user_id > 0) {
    delete value.user.user_password;
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
  return info.user_id;
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
  return info.user_name;
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
  if (isSystemUser(c, info.user_id)) {
    return true;
  }
  if (info.role_keys.includes(target)) {
    return true;
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
  if (isSystemUser(c, info.user_id)) {
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

/**数据范围过滤参数化结构 */
export interface DataScopeFilter {
  sql: string;
  params: Record<string, any>;
}

/**
 * 登录用户信息-角色数据范围过滤SQL
 * @param c 上下文对象
 * @param deptAlias 部门表别名
 * @param userAlias 用户表别名
 * @return 参数化过滤对象 {sql, params}
 */
export function loginUserToDataScopeSQL(
  c: Context,
  deptAlias: string,
  userAlias: string
): DataScopeFilter {
  const empty: DataScopeFilter = { sql: '', params: {} };
  // 登录用户信息
  const [info, err] = loginUser(c);
  if (err) {
    return empty;
  }
  const userInfo = info.user;
  const deptRefCol = deptAlias === 'sys_dept' ? 'id' : 'dept_id';

  // 如果是系统管理员，则不过滤数据
  if (isSystemUser(c, userInfo.id)) {
    return empty;
  }
  // 无用户角色
  if (!Array.isArray(userInfo.roles) || userInfo.roles.length <= 0) {
    return empty;
  }

  // 记录角色权限范围定义添加过, 非自定数据权限不需要重复拼接SQL
  const scopeKeys: string[] = [];
  const conditions: string[] = [];
  const allParams: Record<string, any> = {};
  let paramIndex = 0;

  for (const role of userInfo.roles) {
    const dataScope = role.role_data_scope;

    if (ROLE_SCOPE_ALL === dataScope) {
      break;
    }

    if (ROLE_SCOPE_CUSTOM !== dataScope) {
      if (scopeKeys.includes(dataScope)) {
        continue;
      }
    }

    if (ROLE_SCOPE_CUSTOM === dataScope) {
      const roleParam = `ds_roleId_${paramIndex++}`;
      allParams[roleParam] = role.id;
      const sql = `${deptAlias}.${deptRefCol} IN
        ( SELECT dept_id FROM sys_role_dept WHERE role_id = :${roleParam} )
        AND ${deptAlias}.${deptRefCol} NOT IN
        (
        SELECT c.ancestor_id FROM sys_dept_closure c
        INNER JOIN sys_role_dept rd ON rd.dept_id = c.descendant_id
        AND rd.role_id = :${roleParam}
        WHERE c.depth = 1
        )`;
      conditions.push(sql);
    }

    if (ROLE_SCOPE_DEPT === dataScope) {
      const deptParam = `ds_deptId_${paramIndex++}`;
      allParams[deptParam] = userInfo.dept_id;
      conditions.push(`${deptAlias}.${deptRefCol} = :${deptParam}`);
    }

    if (ROLE_SCOPE_DEPT_CHILD === dataScope) {
      const deptParam = `ds_deptId_${paramIndex++}`;
      allParams[deptParam] = userInfo.dept_id;
      const sql = `${deptAlias}.${deptRefCol} IN (
        SELECT descendant_id FROM sys_dept_closure
        WHERE ancestor_id = :${deptParam}
        )`;
      conditions.push(sql);
    }

    if (ROLE_SCOPE_SELF === dataScope) {
      if (userAlias === '') {
        const deptParam = `ds_deptId_${paramIndex++}`;
        allParams[deptParam] = userInfo.dept_id;
        conditions.push(`${deptAlias}.${deptRefCol} = :${deptParam}`);
      } else {
        const userParam = `ds_userId_${paramIndex++}`;
        allParams[userParam] = userInfo.id;
        conditions.push(`${userAlias}.id = :${userParam}`);
      }
    }

    // 记录角色范围
    scopeKeys.push(dataScope);
  }

  // 构建查询条件语句
  if (conditions.length > 0) {
    return {
      sql: ` ( ${conditions.join(' OR ')} ) `,
      params: allParams,
    };
  }
  return empty;
}
