import { Provide, Inject, Singleton } from '@midwayjs/core';

import { TreeSelect, sysDeptTreeSelect } from '../model/vo/tree_select';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysRoleDeptRepository } from '../repository/sys_role_dept';
import { SysDeptRepository } from '../repository/sys_dept';
import { SysRoleRepository } from '../repository/sys_role';
import { SysDept } from '../model/sys_dept';

/**部门管理 服务层处理 */
@Provide()
@Singleton()
export class SysDeptService {
  /**部门服务 */
  @Inject()
  private sysDeptRepository: SysDeptRepository;

  /**角色服务 */
  @Inject()
  private sysRoleDeptRepository: SysRoleDeptRepository;

  /**角色与部门关联服务 */
  @Inject()
  private sysRoleRepository: SysRoleRepository;

  /**
   * 查询数据
   * @param sysDept 信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns []
   */
  public async find(
    sysDept: SysDept,
    dataScopeSQL: string
  ): Promise<SysDept[]> {
    return await this.sysDeptRepository.select(sysDept, dataScopeSQL);
  }

  /**
   * 根据ID查询信息
   * @param deptId ID
   * @returns 结果
   */
  public async findById(deptId: number): Promise<SysDept> {
    return await this.sysDeptRepository.selectById(deptId);
  }

  /**
   * 新增信息
   * @param sysDept 信息
   * @returns ID
   */
  public async insert(sysDept: SysDept): Promise<number> {
    return await this.sysDeptRepository.insert(sysDept);
  }

  /**
   * 修改信息
   * @param sysDept 信息
   * @returns 影响记录数
   */
  public async update(sysDept: SysDept): Promise<number> {
    const dept = await this.sysDeptRepository.selectById(sysDept.deptId);
    const parentDept = await this.sysDeptRepository.selectById(
      sysDept.parentId
    );
    // 上级与当前部门祖级列表更新
    if (
      parentDept.deptId === sysDept.parentId &&
      dept.deptId === sysDept.deptId
    ) {
      const newAncestors = `${parentDept.ancestors},${parentDept.deptId}`;
      const oldAncestors = dept.ancestors;
      // 祖级列表不一致时更新
      if (newAncestors !== oldAncestors) {
        dept.ancestors = newAncestors;
        await this.updateDeptChildren(dept.deptId, newAncestors, oldAncestors);
      }
    }
    // 如果该部门是启用状态，则启用该部门的所有上级部门
    if (
      sysDept.statusFlag === STATUS_YES &&
      parentDept.statusFlag === STATUS_NO
    ) {
      await this.updateDeptStatusNormal(sysDept.ancestors);
    }
    return await this.sysDeptRepository.update(sysDept);
  }

  /**
   * 修改所在部门正常状态
   * @param ancestors 祖级字符
   * @returns 影响记录数
   */
  private async updateDeptStatusNormal(ancestors: string): Promise<number> {
    if (!ancestors || ancestors === '0') {
      return 0;
    }
    const deptIds: number[] = [];
    for (const v of ancestors.split(',')) {
      deptIds.push(parseNumber(v));
    }
    return await this.sysDeptRepository.updateDeptStatusNormal(deptIds);
  }

  /**
   * 修改子元素关系
   * @param deptId 部门ID
   * @param newAncestors 新祖级字符
   * @param oldAncestors 旧祖级字符
   * @returns 影响记录数
   */
  private async updateDeptChildren(
    deptId: number,
    newAncestors: string,
    oldAncestors: string
  ): Promise<number> {
    let arr = await this.sysDeptRepository.selectChildrenDeptById(deptId);
    if (arr.length === 0) {
      return 0;
    }
    // 替换父ID
    arr = arr.map(item => {
      item.ancestors = item.ancestors.replace(oldAncestors, newAncestors);
      return item;
    });
    return await this.sysDeptRepository.updateDeptChildren(arr);
  }

  /**
   * 删除信息
   * @param deptId 部门ID
   * @returns 影响记录数
   */
  public async deleteById(deptId: number): Promise<number> {
    await this.sysRoleDeptRepository.deleteByDeptIds([deptId]); // 删除角色与部门关联
    return await this.sysDeptRepository.deleteById(deptId);
  }

  /**
   * 根据角色ID查询包含的部门ID
   * @param roleId 角色ID
   * @returns 部门ID数组
   */
  public async findDeptIdsByRoleId(roleId: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([roleId]);
    if (roles.length > 0) {
      const role = roles[0];
      if (role.roleId === roleId) {
        return await this.sysDeptRepository.selectDeptIdsByRoleId(
          role.roleId,
          role.deptCheckStrictly === '1'
        );
      }
    }
    return [];
  }

  /**
   * 部门下存在子节点数量
   * @param deptId 部门ID
   * @returns 数量
   */
  public async existChildrenByDeptId(deptId: number): Promise<number> {
    return await this.sysDeptRepository.existChildrenByDeptId(deptId);
  }

  /**
   * 部门下存在用户数量
   * @param deptId 部门ID
   * @returns 数量
   */
  public async existUserByDeptId(deptId: number): Promise<number> {
    return await this.sysDeptRepository.existUserByDeptId(deptId);
  }

  /**
   * 检查同级下部门名称唯一
   * @param parentId 父级部门ID
   * @param deptName 部门名称
   * @param deptId 部门ID
   * @returns 结果
   */
  public async checkUniqueParentIdByDeptName(
    parentId: number,
    deptName: string,
    deptId: number
  ): Promise<boolean> {
    const sysDept = new SysDept();
    sysDept.deptName = deptName;
    sysDept.parentId = parentId;
    const uniqueId = await this.sysDeptRepository.checkUnique(sysDept);
    if (uniqueId === deptId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 查询部门树状结构
   * @param sysDept 信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns 结果
   */
  public async buildTreeSelect(
    sysDept: SysDept,
    dataScopeSQL: string
  ): Promise<TreeSelect[]> {
    const arr = await this.sysDeptRepository.select(sysDept, dataScopeSQL);
    const treeArr = await this.parseDataToTree(arr);
    const tree: TreeSelect[] = [];
    for (const item of treeArr) {
      tree.push(sysDeptTreeSelect(item));
    }
    return tree;
  }

  /**
   * 将数据解析为树结构，构建前端所需要下拉树结构
   * @param arr 部门对象数组
   * @returns 数组
   */
  private async parseDataToTree(arr: SysDept[]): Promise<SysDept[]> {
    // 节点分组
    const map: Map<number, SysDept[]> = new Map();
    // 节点id
    const treeIds: number[] = [];
    // 树节点
    const tree: SysDept[] = [];

    for (const item of arr) {
      const parentId = item.parentId;
      // 分组
      const mapItem = map.get(parentId) ?? [];
      mapItem.push(item);
      map.set(parentId, mapItem);
      // 记录节点id
      treeIds.push(item.deptId);
    }

    for (const [key, value] of map) {
      // 选择不是节点id的作为树节点
      if (!treeIds.includes(key)) {
        tree.push(...value);
      }
    }

    for (const iterator of tree) {
      componet(iterator);
    }

    /**闭包递归函数 */
    function componet(iterator: SysDept) {
      const id = iterator.deptId;
      const item = map.get(id);
      if (item) {
        iterator.children = item;
      }
      if (iterator.children) {
        for (const v of iterator.children) {
          componet(v);
        }
      }
    }
    return tree;
  }
}
