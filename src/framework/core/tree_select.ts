import { SysDept } from './model/sys_dept';
import { SysMenu } from './model/sys_menu';

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
   * @param sys_dept 部门
   * @returns 下拉树结构列表
   */
  to_sys_dept(sys_dept: SysDept): TreeSelect {
    this.id = sys_dept.dept_id;
    this.label = sys_dept.dept_name;
    this.children = sys_dept.children.map(dept => this.to_sys_dept(dept));
    return this;
  }

  /**
   * 下拉树结构
   * @param sys_menu 菜单
   * @returns 下拉树结构列表
   */
  to_sys_menu(sys_menu: SysMenu): TreeSelect {
    this.id = sys_menu.menu_id;
    this.label = sys_menu.menu_name;
    this.children = sys_menu.children.map(menu => this.to_sys_menu(menu));
    return this;
  }
}
