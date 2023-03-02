import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysDept } from '../../model/SysDept';
import { TreeSelect } from '../../../../framework/model/TreeSelect';
import { SysDeptRepositoryImpl } from '../../repository/impl/SysDeptRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { ISysDeptService } from '../ISysDeptService';
import { STATUS_YES } from '../../../../framework/constants/CommonConstants';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDeptServiceImpl implements ISysDeptService {
  @Inject()
  private sysDeptRepository: SysDeptRepositoryImpl;

  @Inject()
  private sysRoleRepository: SysRoleRepositoryImpl;

  async selectDeptList(
    sysDept: SysDept,
    dataScopeSQL = ''
  ): Promise<SysDept[]> {
    return await this.sysDeptRepository.selectDeptList(sysDept, dataScopeSQL);
  }

  async selectDeptTreeList(
    sysDept: SysDept,
    dataScopeSQL = ''
  ): Promise<TreeSelect[]> {
    const depts: SysDept[] = await this.sysDeptRepository.selectDeptList(
      sysDept,
      dataScopeSQL
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
      sysDept.status === STATUS_YES &&
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
   * @param parentId 父级节点 默认 '0'
   * @return 树结构列表
   */
  private buildDeptTree(
    sysDepts: SysDept[],
    parentId: string = '0'
  ): SysDept[] {
    // 排除父节点
    const notParentMenus = sysDepts.filter(d => d.parentId !== parentId);
    // 只取父节点
    const parentMenus = sysDepts.filter(d => d.parentId === parentId);
    // 对父节点下的子节点的进行递归
    const returnList: SysDept[] = parentMenus.map(dept => {
      const depts = this.fnDeptTree(notParentMenus, dept.deptId);
      if (depts && depts.length > 0) {
        dept.children = depts;
      }
      return dept;
    });
    return returnList;
  }

  /**
   * 递归得到部门列表
   * @param sysDepts 部门列表
   * @param deptId 当前部门ID
   * @return 递归得到部门列表
   */
  private fnDeptTree(sysDepts: SysDept[], deptId: string): SysDept[] {
    // 排除当期菜单
    const notChilds = sysDepts.filter(d => d.parentId && d.parentId !== deptId);
    // 得到对应当期菜单
    const childs = sysDepts.filter(d => d.parentId && d.parentId === deptId);
    // 当期菜单向下检查
    childs.map(child => {
      // 如有则进入递归
      const menus = notChilds.filter(m => m.parentId === child.deptId);
      if (menus && menus.length > 0) {
        child.children = this.fnDeptTree(notChilds, child.deptId);
      }
      return child;
    });
    return childs;
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
