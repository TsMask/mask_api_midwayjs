import { SysDept } from '../sys_dept';
import { SysMenu } from '../sys_menu';

/**树结构实体类 */
export class TreeSelect {
  /**节点ID */
  id: number;

  /**节点名称 */
  label: string;

  /**子节点 */
  children: TreeSelect[];
}

/**
 * 使用给定的 SysMenu 对象解析为 TreeSelect 对象
 * @param sysMenu 对象
 * @returns 结果
 */
export function sysMenuTreeSelect(sysMenu: SysMenu): TreeSelect {
  const t = new TreeSelect();
  t.id = sysMenu.menuId;
  t.label = sysMenu.menuName;
  t.children = [];
  if (Array.isArray(sysMenu.children) && sysMenu.children.length > 0) {
    for (const menu of sysMenu.children) {
      const child = sysMenuTreeSelect(menu);
      t.children.push(child);
    }
  }
  return t;
}

/**
 * 使用给定的 SysDept 对象解析为 TreeSelect 对象
 * @param sysDept 对象
 * @returns 结果
 */
export function sysDeptTreeSelect(sysDept: SysDept): TreeSelect {
  const t = new TreeSelect();
  t.id = sysDept.deptId;
  t.label = sysDept.deptName;
  t.children = [];
  if (Array.isArray(sysDept.children) && sysDept.children.length > 0) {
    for (const dept of sysDept.children) {
      const child = sysDeptTreeSelect(dept);
      t.children.push(child);
    }
  }
  return t;
}
