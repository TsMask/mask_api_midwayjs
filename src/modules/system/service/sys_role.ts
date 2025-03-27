import { Provide, Inject, Singleton } from '@midwayjs/core';

import {
  ROLE_SCOPE_CUSTOM,
  ROLE_SCOPE_DATA,
} from '../../../framework/constants/role_data_scope';
import { FileUtil } from '../../../framework/utils/file/file';
import { SYS_ROLE_SYSTEM_ID } from '../../../framework/constants/system';
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
      if (v.roleId === SYS_ROLE_SYSTEM_ID) {
        continue;
      }
      arr.push(v);
    }
    return arr;
  }

  /**
   * 通过ID查询信息
   * @param roleId ID
   * @returns 结果
   */
  public async findById(roleId: number): Promise<SysRole> {
    if (roleId < 0) {
      return new SysRole();
    }
    const rows = await this.sysRoleRepository.selectByIds([roleId]);
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
    const insertId = await this.sysRoleRepository.insert(sysRole);
    if (
      insertId > 0 &&
      Array.isArray(sysRole.menuIds) &&
      sysRole.menuIds.length > 0
    ) {
      await this.insertRoleMenu(insertId, sysRole.menuIds);
    }
    return insertId;
  }

  /**
   * 修改信息
   * @param sysRole 信息
   * @returns 影响记录数
   */
  public async update(sysRole: SysRole): Promise<number> {
    const rows = await this.sysRoleRepository.update(sysRole);
    if (
      rows > 0 &&
      Array.isArray(sysRole.menuIds) &&
      sysRole.menuIds.length >= 0
    ) {
      // 删除角色与菜单关联
      await this.sysRoleMenuRepository.deleteByRoleIds([sysRole.roleId]);
      await this.insertRoleMenu(sysRole.roleId, sysRole.menuIds);
    }
    return rows;
  }

  /**
   * 新增角色菜单信息
   * @param roleId 角色ID
   * @param menuIds 菜单ID数组
   * @returns 影响记录数
   */
  private async insertRoleMenu(
    roleId: number,
    menuIds: number[]
  ): Promise<number> {
    if (roleId <= 0 || menuIds.length <= 0) {
      return 0;
    }
    const sysRoleMenus: SysRoleMenu[] = [];
    for (const menuId of menuIds) {
      if (menuId <= 0) {
        continue;
      }
      const sysRoleMenu = new SysRoleMenu();
      sysRoleMenu.roleId = roleId;
      sysRoleMenu.menuId = menuId;
      sysRoleMenus.push(sysRoleMenu);
    }
    return await this.sysRoleMenuRepository.batchInsert(sysRoleMenus);
  }

  /**
   * 批量删除信息
   * @param configIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(roleIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const roles = await this.sysRoleRepository.selectByIds(roleIds);
    if (roles.length <= 0) {
      return [0, '没有权限访问角色数据！'];
    }
    for (const role of roles) {
      // 检查是否为内置参数
      if (role.delFlag === '1') {
        return [0, `ID:${role.roleId} 角色信息已经删除！`];
      }
      // 检查分配用户
      const useCount = await this.sysUserRoleRepository.existUserByRoleId(
        role.roleId
      );
      if (useCount > 0) {
        return [0, `【${role.roleName}】已分配给用户,不能删除`];
      }
    }
    if (roles.length === roleIds.length) {
      this.sysRoleMenuRepository.deleteByRoleIds(roleIds); // 删除角色与菜单关联
      this.sysRoleDeptRepository.deleteByRoleIds(roleIds); // 删除角色与部门关联
      const rows = await this.sysRoleRepository.deleteByIds(roleIds);
      return [rows, ''];
    }
    return [0, '删除角色信息失败！'];
  }

  /**
   * 根据用户ID获取角色选择框列表
   * @param userId 用户ID
   * @returns 结果
   */
  public async findByUserId(userId: number): Promise<SysRole[]> {
    return this.sysRoleRepository.selectByUserId(userId);
  }

  /**
   * 检查角色名称是否唯一
   * @param dictName 字典名称
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByName(
    roleName: string,
    roleId: number
  ): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.roleName = roleName;
    const uniqueId = await this.sysRoleRepository.checkUnique(sysRole);
    if (uniqueId === roleId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查角色权限是否唯一
   * @param roleKey 角色键值
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByKey(
    roleKey: string,
    roleId: number
  ): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.roleKey = roleKey;
    const uniqueId = await this.sysRoleRepository.checkUnique(sysRole);
    if (uniqueId === roleId) {
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
    // 修改角色信息
    const rows = await this.sysRoleRepository.update(sysRole);
    if (rows > 0) {
      // 删除角色与部门关联
      await this.sysRoleDeptRepository.deleteByRoleIds([sysRole.roleId]);
      // 新增角色和部门信息
      if (
        sysRole.dataScope === ROLE_SCOPE_CUSTOM &&
        sysRole.deptIds.length > 0
      ) {
        const arr: SysRoleDept[] = [];
        for (const deptId of sysRole.deptIds) {
          if (deptId <= 0) {
            continue;
          }
          const sysRoleDept = new SysRoleDept();
          sysRoleDept.roleId = sysRole.roleId;
          sysRoleDept.deptId = deptId;
          arr.push(sysRoleDept);
        }
        await this.sysRoleDeptRepository.batchInsert(arr);
      }
    }
    return rows;
  }

  /**
   * 批量新增授权用户角色
   * @param roleId 角色ID
   * @param userIds 用户ID数组
   * @returns 结果
   */
  public async insertAuthUsers(
    roleId: number,
    userIds: number[]
  ): Promise<number> {
    if (roleId <= 0 || userIds.length <= 0) {
      return 0;
    }
    const sysUserRoles: SysUserRole[] = [];
    for (const userId of userIds) {
      if (userId <= 0) {
        continue;
      }
      const sysUserRole = new SysUserRole();
      sysUserRole.userId = userId;
      sysUserRole.roleId = roleId;
      sysUserRoles.push(sysUserRole);
    }
    return await this.sysUserRoleRepository.batchInsert(sysUserRoles);
  }

  /**
   * 批量取消授权用户角色
   * @param roleId 角色ID
   * @param userIds 用户ID数组
   * @returns 结果
   */
  public async deleteAuthUsers(
    roleId: number,
    userIds: number[]
  ): Promise<number> {
    return await this.sysUserRoleRepository.deleteByRoleId(roleId, userIds);
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysRole[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      // 数据范围
      let dataScope = ROLE_SCOPE_DATA[row.dataScope];
      if (!dataScope) {
        dataScope = '';
      }
      // 角色状态
      let statusValue = '停用';
      if (row.statusFlag === '1') {
        statusValue = '正常';
      }
      const data = {
        角色序号: row.roleId,
        角色名称: row.roleName,
        角色键值: row.roleKey,
        角色排序: row.dataScope,
        数据范围: dataScope,
        角色状态: statusValue,
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
