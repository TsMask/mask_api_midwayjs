// 系统角色数据范围常量

/**全部数据权限 */
export const ROLE_SCOPE_ALL = '1';
/**自定数据权限 */
export const ROLE_SCOPE_CUSTOM = '2';
/**部门数据权限 */
export const ROLE_SCOPE_DEPT = '3';
/**部门及以下数据权限 */
export const ROLE_SCOPE_DEPT_CHILD = '4';
/**仅本人数据权限 */
export const ROLE_SCOPE_SELF = '5';

/**系统角色数据范围映射 */
export const ROLE_SCOPE_DATA = {
  [ROLE_SCOPE_ALL]: '全部数据权限',
  [ROLE_SCOPE_CUSTOM]: '自定数据权限',
  [ROLE_SCOPE_DEPT]: '部门数据权限',
  [ROLE_SCOPE_DEPT_CHILD]: '部门及以下数据权限',
  [ROLE_SCOPE_SELF]: '仅本人数据权限',
};
