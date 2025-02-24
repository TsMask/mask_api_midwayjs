import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysRoleMenu } from '../model/sys_role_menu';

/**角色与菜单关联表 数据层处理 */
@Provide()
@Singleton()
export class SysRoleMenuRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 存在角色使用数量By菜单
   * @param menuId 菜单ID
   * @returns 数量
   */
  public async existRoleByMenuId(menuId: number): Promise<number> {
    if (menuId <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRoleMenu, 's')
      .andWhere('s.menu_id = :menuId', { menuId })
      .getCount();
    return count;
  }

  /**
   * 批量删除关联By角色
   *
   * @param roleIds ID数组
   * @return 影响记录数
   */
  public async deleteByRoleIds(roleIds: number[]): Promise<number> {
    if (roleIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('role_id in (:roleIds)', { roleIds })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除关联By菜单
   *
   * @param menuIds ID数组
   * @return 影响记录数
   */
  public async deleteByMenuIds(menuIds: number[]): Promise<number> {
    if (menuIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('menu_id in (:menuIds)', { menuIds })
      .execute();
    return tx.affected;
  }

  /**
   * 批量新增信息
   *
   * @param userRoles 信息
   * @return 影响记录数
   */
  public async batchInsert(sysRoleMenus: SysRoleMenu[]): Promise<number> {
    if (sysRoleMenus.length <= 0) return 0;
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysRoleMenu)
      .values(sysRoleMenus)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.affectedRows > 0) {
      return raw.affectedRows;
    }
    return 0;
  }
}
