import { Provide, Inject, Singleton } from '@midwayjs/core';
import { EntityManager } from 'typeorm';

import {
  ROLE_SCOPE_CUSTOM,
  ROLE_SCOPE_DATA,
} from '../../../internal/shared/constants/role_data_scope';
import { FileUtil } from '../../../internal/shared/file/file';
import { SYS_ROLE_SYSTEM_ID } from '../../../internal/shared/constants/system';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { UserTokenService } from '../../../internal/web/token/user_token';
import { SysUserRoleRepository } from '../repository/sys_user_role';
import { SysRoleDeptRepository } from '../repository/sys_role_dept';
import { SysRoleMenuRepository } from '../repository/sys_role_menu';
import { SysRoleRepository } from '../repository/sys_role';
import { SysUserRole } from '../model/sys_user_role';
import { SysRoleMenu } from '../model/sys_role_menu';
import { SysRoleDept } from '../model/sys_role_dept';
import { SysRole } from '../model/sys_role';

/**角色 服务层处理 */
@Provide()
@Singleton()
export class SysRoleService {
  /**角色服务 */
  @Inject()
  private sysRoleRepository: SysRoleRepository;

  /**用户与角色关联服务 */
  @Inject()
  private sysUserRoleRepository: SysUserRoleRepository;

  /**角色与部门关联服务 */
  @Inject()
  private sysRoleDeptRepository: SysRoleDeptRepository;

  /**角色与菜单关联服务 */
  @Inject()
  private sysRoleMenuRepository: SysRoleMenuRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**数据库事务 */
  @Inject()
  private db: DynamicDataSource;

  /**令牌服务 */
  @Inject()
  private token: UserTokenService;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns [rows, total]
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysRole[], number]> {
    return await this.sysRoleRepository.selectByPage(query);
  }

  /**
   * 查询列表数据
   * @param sysRole 信息
   * @returns []
   */
  public async find(sysRole: SysRole): Promise<SysRole[]> {
    const rows = await this.sysRoleRepository.select(sysRole);
    const arr: SysRole[] = [];
    for (const v of rows) {
      if (v.id === SYS_ROLE_SYSTEM_ID) {
        continue;
      }
      arr.push(v);
    }
    return arr;
  }

  /**
   * 通过ID查询信息
   * @param role_id ID
   * @returns 结果
   */
  public async findById(role_id: number): Promise<SysRole> {
    if (role_id < 0) {
      return new SysRole();
    }
    const rows = await this.sysRoleRepository.selectByIds([role_id]);
    if (rows.length > 0) {
      return rows[0];
    }
    return new SysRole();
  }

  /**
   * 新增信息
   * @param sysRole 信息
   * @returns ID
   */
  public async insert(sysRole: SysRole): Promise<number> {
    return await this.db.transaction('', async manager => {
      const insertId = await this.sysRoleRepository.insert(sysRole, manager);
      if (
        insertId > 0 &&
        Array.isArray(sysRole.menu_ids) &&
        sysRole.menu_ids.length > 0
      ) {
        await this.insertRoleMenu(insertId, sysRole.menu_ids, manager);
      }
      return insertId;
    });
  }

  /**
   * 修改信息
   * @param sysRole 信息
   * @returns 影响记录数
   */
  public async update(sysRole: SysRole): Promise<number> {
    const rows = await this.db.transaction('', async manager => {
      const affected = await this.sysRoleRepository.update(sysRole, manager);
      if (affected > 0) {
        // 删除角色与菜单关联
        await this.sysRoleMenuRepository.deleteByRoleIds([sysRole.id], manager);
        await this.insertRoleMenu(sysRole.id, sysRole.menu_ids, manager);
      }
      return affected;
    });
    if (rows > 0) {
      // 角色菜单权限变更后清理持有该角色的用户 Token 缓存
      const userIds = await this.sysUserRoleRepository.selectUserIdsByRoleIds([
        sysRole.id,
      ]);
      await this.token?.removeByUserIds(userIds);
    }
    return rows;
  }

  /**
   * 修改角色状态。状态切换不携带菜单组，不能走全量更新避免清空角色菜单。
   */
  public async updateStatus(
    role_id: number,
    role_status: string,
    update_by: string
  ): Promise<number> {
    const rows = await this.sysRoleRepository.updateStatus(
      role_id,
      role_status,
      update_by
    );
    if (rows > 0) {
      const userIds = await this.sysUserRoleRepository.selectUserIdsByRoleIds([
        role_id,
      ]);
      await this.token?.removeByUserIds(userIds);
    }
    return rows;
  }

  /**
   * 新增角色菜单信息
   * @param role_id 角色ID
   * @param menu_ids 菜单ID数组
   * @returns 影响记录数
   */
  private async insertRoleMenu(
    role_id: number,
    menu_ids: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (role_id <= 0 || !menu_ids?.length) {
      return 0;
    }
    const sysRoleMenus: SysRoleMenu[] = [];
    for (const menu_id of menu_ids) {
      if (menu_id <= 0) {
        continue;
      }
      const sysRoleMenu = new SysRoleMenu();
      sysRoleMenu.role_id = role_id;
      sysRoleMenu.menu_id = menu_id;
      sysRoleMenus.push(sysRoleMenu);
    }
    return await this.sysRoleMenuRepository.batchInsert(
      sysRoleMenus,
      entityManager
    );
  }

  /**
   * 批量删除信息
   * @param configIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(
    role_ids: number[],
    deletedBy: string = ''
  ): Promise<[number, string]> {
    // 检查是否存在
    const roles = await this.sysRoleRepository.selectByIds(role_ids);
    if (roles.length <= 0) {
      return [0, '没有权限访问角色数据！'];
    }
    for (const role of roles) {
      // 检查分配用户
      const useCount = await this.sysUserRoleRepository.existUserByRoleId(
        role.id
      );
      if (useCount > 0) {
        return [0, `【${role.role_name}】已分配给用户,不能删除`];
      }
    }
    if (roles.length === role_ids.length) {
      const rows = await this.db.transaction('', async manager => {
        await this.sysRoleMenuRepository.deleteByRoleIds(role_ids, manager); // 删除角色与菜单关联
        await this.sysRoleDeptRepository.deleteByRoleIds(role_ids, manager); // 删除角色与部门关联
        return await this.sysRoleRepository.deleteByIds(
          role_ids,
          deletedBy,
          manager
        );
      });
      return [rows, ''];
    }
    return [0, '删除角色信息失败！'];
  }

  /**
   * 根据用户ID获取角色选择框列表
   * @param user_id 用户ID
   * @returns 结果
   */
  public async findByUserId(user_id: number): Promise<SysRole[]> {
    return this.sysRoleRepository.selectByUserId(user_id);
  }

  /**
   * 检查角色名称是否唯一
   * @param dict_name 字典名称
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByName(
    role_name: string,
    role_id: number
  ): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.role_name = role_name;
    const uniqueId = await this.sysRoleRepository.checkUnique(sysRole);
    if (uniqueId === role_id) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查角色权限是否唯一
   * @param role_key 角色键值
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByKey(
    role_key: string,
    role_id: number
  ): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.role_key = role_key;
    const uniqueId = await this.sysRoleRepository.checkUnique(sysRole);
    if (uniqueId === role_id) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 修改信息同时更新数据权限信息
   * @param sysRole 角色信息
   * @returns 结果
   */
  public async updateAndDataScope(sysRole: SysRole): Promise<number> {
    const rows = await this.db.transaction('', async manager => {
      // 修改角色信息
      const rows = await this.sysRoleRepository.update(sysRole, manager);
      if (rows > 0) {
        // 删除角色与部门关联
        await this.sysRoleDeptRepository.deleteByRoleIds([sysRole.id], manager);
        // 新增角色和部门信息
        if (
          sysRole.role_data_scope === ROLE_SCOPE_CUSTOM &&
          sysRole.dept_ids?.length > 0
        ) {
          const arr: SysRoleDept[] = [];
          for (const dept_id of sysRole.dept_ids) {
            if (dept_id <= 0) {
              continue;
            }
            const sysRoleDept = new SysRoleDept();
            sysRoleDept.role_id = sysRole.id;
            sysRoleDept.dept_id = dept_id;
            arr.push(sysRoleDept);
          }
          await this.sysRoleDeptRepository.batchInsert(arr, manager);
        }
      }
      return rows;
    });
    if (rows > 0) {
      const userIds = await this.sysUserRoleRepository.selectUserIdsByRoleIds([
        sysRole.id,
      ]);
      await this.token?.removeByUserIds(userIds);
    }
    return rows;
  }

  /**
   * 批量新增授权用户角色
   * @param role_id 角色ID
   * @param userIds 用户ID数组
   * @returns 结果
   */
  public async insertAuthUsers(
    role_id: number,
    userIds: number[]
  ): Promise<number> {
    if (role_id <= 0 || userIds.length <= 0) {
      return 0;
    }
    const sysUserRoles: SysUserRole[] = [];
    for (const user_id of userIds) {
      if (user_id <= 0) {
        continue;
      }
      const sysUserRole = new SysUserRole();
      sysUserRole.user_id = user_id;
      sysUserRole.role_id = role_id;
      sysUserRoles.push(sysUserRole);
    }
    const rows = await this.sysUserRoleRepository.batchInsert(sysUserRoles);
    if (rows > 0) {
      // 授权关系变更后清理相关用户的 Token 缓存
      await this.token?.removeByUserIds(userIds);
    }
    return rows;
  }

  /**
   * 批量取消授权用户角色
   * @param role_id 角色ID
   * @param userIds 用户ID数组
   * @returns 结果
   */
  public async deleteAuthUsers(
    role_id: number,
    userIds: number[]
  ): Promise<number> {
    const rows = await this.sysUserRoleRepository.deleteByRoleId(
      role_id,
      userIds
    );
    if (rows > 0) {
      // 取消授权后清理相关用户的 Token 缓存
      await this.token?.removeByUserIds(userIds);
    }
    return rows;
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysRole[], fileName: string) {
    // 第一行表头标题
    const data: string[][] = [
      ['角色序号', '角色名称', '角色键值', '角色排序', '数据范围', '角色状态'],
    ];
    for (const row of rows) {
      // 数据范围
      let dataScope = (ROLE_SCOPE_DATA as Record<string, string>)[
        row.role_data_scope
      ];
      if (!dataScope) {
        dataScope = '空';
      }
      // 角色状态
      let statusValue = '停用';
      if (row.role_status === '1') {
        statusValue = '正常';
      }
      data.push([
        `${row.id ?? 0}`,
        row.role_name ?? '',
        row.role_key ?? '',
        `${row.role_sort ?? 0}`,
        dataScope,
        statusValue,
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
