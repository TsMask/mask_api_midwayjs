import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
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

  async selectDeptList(sysDept: SysDept, dataScopeSQL:string = ""): Promise<SysDept[]> {
    return await this.sysDeptRepository.selectDeptList(sysDept, dataScopeSQL);
  }

  async selectDeptTreeList(sysDept: SysDept): Promise<TreeSelect[]> {
    const depts: SysDept[] = await this.sysDeptRepository.selectDeptList(
      sysDept
    );
    return this.buildDeptTreeSelect(depts);
  }

  async selectDeptListByRoleId(roleId: string): Promise<string[]> {
    const sysRole = await this.sysRoleRepository.selectRoleById(roleId);
    if (sysRole) {
      const deptCheckStrictly = sysRole.deptCheckStrictly === '1';
      return this.sysDeptRepository.selectDeptListByRoleId(
        roleId,
        deptCheckStrictly
      );
    }
    return null;
  }

  async selectDeptById(deptId: string): Promise<SysDept> {
    return await this.sysDeptRepository.selectDeptById(deptId);
  }

  async selectNormalChildrenDeptById(deptId: string): Promise<number> {
    return await this.sysDeptRepository.selectNormalChildrenDeptById(deptId);
  }

  async hasChildByDeptId(deptId: string): Promise<boolean> {
    return (await this.sysDeptRepository.hasChildByDeptId(deptId)) > 0;
  }
  async checkDeptExistUser(deptId: string): Promise<boolean> {
    return (await this.sysDeptRepository.checkDeptExistUser(deptId)) > 0;
  }

  async checkUniqueDeptName(sysDept: SysDept): Promise<boolean> {
    const deptId = await this.sysDeptRepository.checkUniqueDeptName(
      sysDept.deptName,
      sysDept.parentId
    );
    // 部门信息与查询得到部门ID一致
    if (deptId && sysDept.deptId === deptId) {
      return true;
    }
    return !deptId;
  }

  checkScopeDeptData(deptId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async insertDept(sysDept: SysDept): Promise<string> {
    return await this.sysDeptRepository.insertDept(sysDept);
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
    // 如果该部门是启用状态，则启用该部门的所有上级部门
    if (
      sysDept.status === '0' &&
      sysDept.ancestors &&
      sysDept.ancestors !== '0'
    ) {
      await this.updateParentDeptStatusNormal(sysDept);
    }
    return await this.sysDeptRepository.updateDept(sysDept);
  }

  async deleteDeptById(deptId: string): Promise<number> {
    return await this.sysDeptRepository.deleteDeptById(deptId);
  }

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sysDepts 部门列表
   * @return 下拉树结构列表
   */
  private buildDeptTreeSelect(sysDepts: SysDept[]): TreeSelect[] {
    const deptTrees: SysDept[] = this.buildDeptTree(sysDepts);
    return deptTrees.map(dept => new TreeSelect().parseSysDept(dept));
  }

  /**
   * 构建前端所需要树结构
   *
   * @param sysDepts 部门列表
   * @return 树结构列表
   */
  private buildDeptTree(sysDepts: SysDept[]): SysDept[] {
    let resultArr: SysDept[] = [];
    const deptIds: string[] = sysDepts.map(dept => dept.deptId);
    for (const dept of sysDepts) {
      // 如果是顶级节点, 遍历该父节点的所有子节点
      if (!deptIds.includes(dept.parentId)) {
        dept.children = this.fnChildren(sysDepts, dept.deptId);
        resultArr.push(dept);
      }
    }
    if (resultArr.length === 0) {
      resultArr = sysDepts;
    }
    return resultArr;
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
      const hasChildren = this.getChildrens(sysDepts, child.deptId);
      if (hasChildren.length > 0) {
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
   * 修改子元素关系
   * @param deptId 被修改的部门ID
   * @param newAncestors 新的父ID集合
   * @param oldAncestors 旧的父ID集合
   */
  private async updateDeptChildren(
    deptId: string,
    newAncestors: string,
    oldAncestors: string
  ): Promise<void> {
    let childrens: SysDept[] =
      await this.sysDeptRepository.selectChildrenDeptById(deptId);
    // 替换父ID
    childrens = childrens.map(child => {
      child.ancestors = child.ancestors.replace(oldAncestors, newAncestors);
      return child;
    });
    if (childrens && childrens.length > 0) {
      this.sysDeptRepository.updateDeptChildren(childrens);
    }
  }

  /**
   * 修改该部门的父级部门状态
   * @param sysDept 当前部门
   * @return 修改数
   */
  private async updateParentDeptStatusNormal(
    sysDept: SysDept
  ): Promise<number> {
    if (!sysDept.ancestors) return 0;
    const deptIds: string[] = sysDept.ancestors.split(',');
    if (deptIds.length) return 0;
    return await this.sysDeptRepository.updateDeptStatusNormal(deptIds);
  }
}
