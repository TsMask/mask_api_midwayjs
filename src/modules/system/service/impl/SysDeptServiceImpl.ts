import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { DEPT_NORMAL } from '../../../../common/constants/UserConstants';
import { SysDept } from '../../../../framework/core/model/SysDept';
import { TreeSelect } from '../../../../framework/core/TreeSelect';
import { SysDeptRepositoryImpl } from '../../repository/impl/SysDeptRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { ISysDeptService } from '../ISysDeptService';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDeptServiceImpl implements ISysDeptService {
  @Inject()
  private sysDeptRepository: SysDeptRepositoryImpl;

  @Inject()
  private sysRoleRepository: SysRoleRepositoryImpl;

  selectDeptList(sysDept: SysDept): Promise<SysDept[]> {
    throw new Error('Method not implemented.');
  }
  async selectDeptTreeList(sysDept: SysDept): Promise<TreeSelect[]> {
    const depts: SysDept[] = await this.sysDeptRepository.selectDeptList(
      sysDept
    );
    return this.buildDeptTreeSelect(depts);
  }

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sysDepts 部门列表
   * @return 下拉树结构列表
   */
  private buildDeptTreeSelect(sysDepts: SysDept[]): TreeSelect[] {
    const dept_trees: SysDept[] = this.buildDeptTree(sysDepts);
    return dept_trees.map(dept => new TreeSelect().parseSysDept(dept));
  }

  async selectDeptListByRoleId(roleId: string): Promise<string[]> {
    const sysRole = await this.sysRoleRepository.selectRoleById(roleId);
    if (sysRole) {
      return this.sysDeptRepository.selectDeptListByRoleId(
        roleId,
        sysRole.deptCheckStrictly == 1
      );
    }
    return null;
  }

  selectDeptById(deptId: string): Promise<SysDept> {
    throw new Error('Method not implemented.');
  }
  selectNormalChildrenDeptById(deptId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  hasChildByDeptId(deptId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkDeptExistUser(deptId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkUniqueDeptName(sysDept: SysDept): Promise<SysDept> {
    throw new Error('Method not implemented.');
  }
  checkScopeDeptData(deptId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  insertDept(sysDept: SysDept): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async updateDept(sysDept: SysDept): Promise<number> {
    const newParentDept = await this.sysDeptRepository.selectDeptById(
      sysDept.parentId
    );
    const oldDept = await this.sysDeptRepository.selectDeptById(sysDept.deptId);
    if (newParentDept && oldDept) {
      const newAncestors = `${newParentDept.ancestors},${newParentDept.deptId}`;
      const oldAncestors = oldDept.ancestors;
      sysDept.ancestors = newAncestors;
      await this.updateDeptChildren(sysDept.deptId, newAncestors, oldAncestors);
    }
    const result = this.sysDeptRepository.updateDept(sysDept);
    if (
      DEPT_NORMAL === sysDept.status &&
      sysDept.ancestors &&
      sysDept.ancestors != '0'
    ) {
      // 如果该部门是启用状态，则启用该部门的所有上级部门
      await this.updateParentDeptStatusNormal(sysDept);
    }
    return result;
  }
  deleteDeptById(deptId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  /**
   * 递归得到部门列表
   * @param sysDepts 部门列表
   * @param deptId 当前部门ID
   * @return 递归得到部门列表
   */
  private fnChildren(sysDepts: SysDept[], deptId: string): SysDept[] {
    // 得到子节点列表
    const childrens: SysDept[] = this.getChildrens(sysDepts, deptId);
    for (const child of childrens) {
      // 判断是否有子节点
      const has_children = this.getChildrens(sysDepts, child.deptId);
      if (has_children.length > 0) {
        child.children = this.fnChildren(sysDepts, child.deptId);
      }
    }
    return childrens;
  }

  /**
   * 得到部门子节点列表
   * @param sysDepts 部门列表
   * @param deptId 当前部门ID
   * @return 递归得到部门子节点列表
   */
  private getChildrens(sysDepts: SysDept[], deptId: string): SysDept[] {
    const childrens: SysDept[] = [];
    for (const dept of sysDepts) {
      if (dept.parentId && dept.parentId === deptId) {
        childrens.push(dept);
      }
    }
    return childrens;
  }

  /**
   * 构建前端所需要树结构
   *
   * @param sys_depts 部门列表
   * @return 树结构列表
   */
  private buildDeptTree(sysDepts: SysDept[]): SysDept[] {
    let result_arr: SysDept[] = [];
    const dept_ids: string[] = sysDepts.map(dept => dept.deptId);
    for (const dept of sysDepts) {
      // 如果是顶级节点, 遍历该父节点的所有子节点
      if (!dept_ids.includes(dept.parentId)) {
        dept.children = this.fnChildren(sysDepts, dept.deptId);
        result_arr.push(dept);
      }
    }
    if (result_arr.length) {
      result_arr = sysDepts;
    }
    return result_arr;
  }

  /**
   * 修改子元素关系
   * @param deptId 被修改的部门ID
   * @param newAncestors 新的父ID集合
   * @param oldAncestors 旧的父ID集合
   */
  private async updateDeptChildren(
    deptId: string,
    newAncestors: string,
    oldAncestors: string
  ) {
    let childrens: SysDept[] =
      await this.sysDeptRepository.selectChildrenDeptById(deptId);
    childrens = childrens.map(child => {
      child.ancestors = child.ancestors.replace(oldAncestors, newAncestors);
      return child;
    });
    if (childrens.length) {
      this.sysDeptRepository.updateDeptChildren(childrens);
    }
  }

  /**
   * 修改该部门的父级部门状态
   * @param sysDept 当前部门
   * @return 修改数
   */
  private async updateParentDeptStatusNormal(sysDept: SysDept) {
    const deptIds: string[] = sysDept.ancestors.split(',');
    return await this.sysDeptRepository.updateDeptStatusNormal(deptIds);
  }
}
