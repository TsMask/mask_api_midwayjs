import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import {
  MENU_TYPE_AUTH,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../framework/constants/menu';
import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysMenu } from '../model/sys_menu';

/**菜单表 数据层处理 */
@Provide()
@Singleton()
export class SysMenuRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 查询集合
   *
   * @param sysMenu 信息
   * @param userId 用户ID 为0是系统管理员
   * @return 列表
   */
  public async select(sysMenu: SysMenu, userId: number): Promise<SysMenu[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysMenu.menuName) {
      tx.andWhere('s.menu_name like :menuName', {
        menuName: sysMenu.menuName + '%',
      });
    }
    if (sysMenu.visibleFlag) {
      tx.andWhere('s.visible_flag = :visibleFlag', {
        visibleFlag: sysMenu.visibleFlag,
      });
    }
    if (sysMenu.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysMenu.statusFlag,
      });
    }
    // 个人菜单
    if (userId > 0) {
      tx.andWhere(
        `s.menu_id in (
        select menu_id from sys_role_menu where role_id in (
        select role_id from sys_user_role where user_id = :userId 
        ))`,
        { userId }
      );
    }
    // 查询数据
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }

  /**
   * 通过ID查询
   *
   * @param menuIds ID数组
   * @return 信息
   */
  public async selectByIds(menuIds: number[]): Promise<SysMenu[]> {
    if (menuIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.menu_id in (:menuIds) and s.del_flag = '0'", { menuIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysMenu 信息
   * @return ID
   */
  public async insert(sysMenu: SysMenu): Promise<number> {
    sysMenu.delFlag = '0';
    if (sysMenu.menuId > 0) {
      return 0;
    }
    if (!sysMenu.icon) {
      sysMenu.icon = '#';
    }
    if (sysMenu.createBy) {
      const ms = Date.now().valueOf();
      sysMenu.updateBy = sysMenu.createBy;
      sysMenu.updateTime = ms;
      sysMenu.createTime = ms;
    }

    // 根据菜单类型重置参数
    if (sysMenu.menuType === MENU_TYPE_AUTH) {
      sysMenu.component = '';
      sysMenu.frameFlag = '1';
      sysMenu.cacheFlag = '1';
      sysMenu.visibleFlag = '1';
      sysMenu.menuPath = '';
      sysMenu.icon = '#';
    } else if (sysMenu.menuType === MENU_TYPE_DIR) {
      sysMenu.component = '';
      sysMenu.frameFlag = '1';
      sysMenu.cacheFlag = '1';
      sysMenu.perms = '';
    }

    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysMenu)
      .values(sysMenu)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 更新
   *
   * @param sysDictType 信息
   * @return 影响记录数
   */
  public async update(sysMenu: SysMenu): Promise<number> {
    if (sysMenu.menuId <= 0) {
      return 0;
    }
    if (!sysMenu.icon) {
      sysMenu.icon = '#';
    }
    if (sysMenu.updateBy) {
      sysMenu.updateTime = Date.now().valueOf();
    }

    // 根据菜单类型重置参数
    if (sysMenu.menuType === MENU_TYPE_AUTH) {
      sysMenu.component = '';
      sysMenu.frameFlag = '1';
      sysMenu.cacheFlag = '1';
      sysMenu.visibleFlag = '1';
      sysMenu.menuPath = '';
      sysMenu.icon = '#';
    } else if (sysMenu.menuType === MENU_TYPE_DIR) {
      sysMenu.component = '';
      sysMenu.frameFlag = '1';
      sysMenu.cacheFlag = '1';
      sysMenu.perms = '';
    }
    const data = Object.assign({}, sysMenu);
    delete data.menuId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysMenu)
      .set(data)
      .andWhere('menu_id = :menuId', { menuId: sysMenu.menuId })
      .execute();
    return tx.affected;
  }

  /**
   * 删除信息
   *
   * @param menuId ID
   * @return 影响记录数
   */
  public async deleteById(menuId: number): Promise<number> {
    if (menuId <= 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysMenu)
      .set({ delFlag: '1' })
      .andWhere('menu_id = :menuId', { menuId })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysMenu 信息
   * @returns
   */
  public async checkUnique(sysMenu: SysMenu): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysMenu.parentId) {
      tx.andWhere('s.parent_id = :parentId', {
        parentId: sysMenu.parentId,
      });
    }
    if (sysMenu.menuName) {
      tx.andWhere('s.menu_name = :menuName', {
        menuName: sysMenu.menuName,
      });
    }
    if (sysMenu.menuPath) {
      tx.andWhere('s.menu_path = :menuPath', {
        menuPath: sysMenu.menuPath,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.menuId;
  }

  /**
   * 菜单下同状态存在子节点数量
   *
   * @param menuId ID
   * @param statusFlag 状态标记
   * @return 数量
   */
  public async existChildrenByMenuIdAndStatus(
    menuId: number,
    statusFlag: string
  ): Promise<number> {
    if (menuId <= 0) {
      return 0;
    }
    // 查询数据
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.del_flag = '0'");

    // 构建查询条件
    tx.andWhere('s.parent_id = :menuId', { menuId });
    if (statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', { statusFlag: statusFlag });
      tx.andWhere('s.menu_type in (:menuType)', {
        menuType: [MENU_TYPE_DIR, MENU_TYPE_MENU],
      });
    }
    return await tx.getCount();
  }

  /**
   * 根据用户ID查询权限标识
   *
   * @param userId 用户ID
   * @return 标识数组
   */
  public async selectPermsByUserId(userId: number): Promise<string[]> {
    if (userId <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .distinct(true)
      .select('m')
      .from(SysMenu, 'm')
      .leftJoin('sys_role_menu', 'rm', 'rm.menu_id = m.menu_id')
      .leftJoin('sys_user_role', 'ur', 'rm.role_id = ur.role_id')
      .leftJoin(
        'sys_role',
        'r',
        "r.role_id = ur.role_id and r.status_flag = '1'"
      )
      .andWhere(
        "m.status_flag = '1' AND m.perms != '' AND ur.user_id = :userId",
        {
          userId,
        }
      );

    const rows = await tx.getMany();
    return rows.map(v => v.perms);
  }

  /**
   * 根据角色ID查询菜单树信息
   *
   * @param roleId 角色ID
   * @param menuCheckStrictly 是否关联显示
   * @return 数量
   */
  public async selectByRoleId(
    roleId: number,
    menuCheckStrictly: boolean
  ): Promise<number[]> {
    if (roleId <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .distinct(true)
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.del_flag = '0'")
      .andWhere(
        's.menu_id in (select menu_id from sys_role_menu where role_id = :roleId)',
        { roleId }
      );
    // 父子互相关联显示，取所有子节点
    if (menuCheckStrictly) {
      tx.andWhere(
        `s.menu_id not in (
            select m.parent_id from sys_menu m 
            inner join sys_role_menu rm on m.menu_id = rm.menu_id 
            and rm.role_id = :roleId
          )`,
        { roleId }
      );
    }
    // 查询数据
    const rows = await tx.getMany();
    return rows.map(v => v.menuId);
  }

  /**
   * 根据用户ID查询菜单
   *
   * @param userId 0为管理员查询全部菜单，其他为用户ID查询权限
   * @return 数量
   */
  public async selectTreeByUserId(userId: number): Promise<SysMenu[]> {
    if (userId < 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.del_flag = '0'");

    // 管理员全部菜单
    if (userId === 0) {
      tx.andWhere("s.menu_type in (:menuType) and s.status_flag = '1'", {
        menuType: [MENU_TYPE_DIR, MENU_TYPE_MENU],
      });
    } else {
      // 用户ID权限
      tx.andWhere(
        `s.menu_type in (:menuType) and s.status_flag = '1' 
        and menu_id in (
        select menu_id from sys_role_menu where role_id in (
        select role_id from sys_user_role where user_id = :userId
        ))`,
        { menuType: [MENU_TYPE_DIR, MENU_TYPE_MENU], userId }
      );
    }
    // 查询数据
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }
}
