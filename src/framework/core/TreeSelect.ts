import { SysDept } from './model/SysDept';
import { SysMenu } from './model/SysMenu';

/**
 * Treeselect树结构实体类
 *
 * @author TsMask <340112800@qq.com>
 */
export class TreeSelect {
  /**节点ID */
  id: string;

  /**节点名称 */
  label: string;

  /**子节点 */
  children: TreeSelect[];

  /**
   * 下拉树结构
   * @param sysDept 部门
   * @returns 下拉树结构列表
   */
  parseSysDept(sysDept: SysDept): TreeSelect {
    this.id = sysDept.deptId;
    this.label = sysDept.deptName;
    this.children = sysDept.children.map(dept => this.parseSysDept(dept));
    return this;
  }

  /**
   * 下拉树结构
   * @param sysMenu 菜单
   * @returns 下拉树结构列表
   */
  parseSysMenu(sysMenu: SysMenu): TreeSelect {
    this.id = sysMenu.menuId;
    this.label = sysMenu.menuName;
    this.children = sysMenu.children.map(menu => this.parseSysMenu(menu));
    return this;
  }
}
