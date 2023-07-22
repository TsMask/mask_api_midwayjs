import { SysRoleMenu } from '../model/SysRoleMenu';

/**
 * 角色与菜单关联表 数据层接口
 *
 * @author TsMask
 */
export interface ISysRoleMenuRepository {
  /**
   * 查询菜单分配给角色使用数量
   *
   * @param menuId 菜单ID
   * @return 结果
   */
  checkMenuExistRole(menuId: string): Promise<number>;

  /**
   * 通过角色ID删除角色和菜单关联
   *
   * @param roleId 角色ID
   * @return 结果
   */
  deleteRoleMenuByRoleId(roleId: string): Promise<number>;

  /**
   * 批量删除角色菜单关联信息
   *
   * @param roleIds 需要删除的数据ID
   * @return 结果
   */
  deleteRoleMenu(roleIds: string[]): Promise<number>;

  /**
   * 批量新增角色菜单信息
   *
   * @param sysRoleMenus 角色菜单列表
   * @return 结果
   */
  batchRoleMenu(sysRoleMenus: SysRoleMenu[]): Promise<number>;
}
