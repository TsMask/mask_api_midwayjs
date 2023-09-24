import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysDept } from '../../model/SysDept';
import { TreeSelect } from '../../../../framework/vo/TreeSelect';
import { SysDeptRepositoryImpl } from '../../repository/impl/SysDeptRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { ISysDeptService } from '../ISysDeptService';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../../framework/constants/CommonConstants';
import { parseDataToTree } from '../../../../framework/utils/ValueParseUtils';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Singleton()
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

  async selectDeptTreeSelect(
    sysDept: SysDept,
    dataScopeSQL = ''
  ): Promise<TreeSelect[]> {
    const depts: SysDept[] = await this.sysDeptRepository.selectDeptList(
      sysDept,
      dataScopeSQL
    );
    // 构建前端所需要下拉树结构
    const deptTrees: SysDept[] = parseDataToTree<SysDept>(depts, 'deptId');
    return deptTrees.map(dept => new TreeSelect().parseSysDept(dept));
  }

  async selectDeptListByRoleId(roleId: string): Promise<string[]> {
    const roles = await this.sysRoleRepository.selectRoleByIds([roleId]);
    if (Array.isArray(roles) && roles.length === 0) return [];
    const role = roles[0];
    return this.sysDeptRepository.selectDeptListByRoleId(
      role.roleId,
      role.deptCheckStrictly === '1'
    );
  }

  async selectDeptById(deptId: string): Promise<SysDept> {
    return await this.sysDeptRepository.selectDeptById(deptId);
  }

  async hasChildByDeptId(deptId: string): Promise<number> {
    return await this.sysDeptRepository.hasChildByDeptId(deptId);
  }
  async checkDeptExistUser(deptId: string): Promise<number> {
    return await this.sysDeptRepository.checkDeptExistUser(deptId);
  }

  async checkUniqueDeptName(
    deptName: string,
    parentId: string,
    deptId = ''
  ): Promise<boolean> {
    const sysDept = new SysDept();
    sysDept.deptName = deptName;
    sysDept.parentId = parentId;
    const uniqueId = await this.sysDeptRepository.checkUniqueDept(sysDept);
    if (uniqueId === deptId) {
      return true;
    }
    return !uniqueId;
  }

  async insertDept(sysDept: SysDept): Promise<string> {
    return await this.sysDeptRepository.insertDept(sysDept);
  }

  async updateDept(sysDept: SysDept): Promise<number> {
    const parentDept = await this.sysDeptRepository.selectDeptById(
      sysDept.parentId
    );
    const dept = await this.sysDeptRepository.selectDeptById(sysDept.deptId);
    // 上级与当前部门祖级列表更新
    if (parentDept && dept) {
      const newAncestors = `${parentDept.ancestors},${parentDept.deptId}`;
      const oldAncestors = dept.ancestors;
      // 祖级列表不一致时更新
      if (newAncestors !== oldAncestors) {
        sysDept.ancestors = newAncestors;
        await this.updateDeptChildren(
          sysDept.deptId,
          newAncestors,
          oldAncestors
        );
      }
    }
    // 如果该部门是启用状态，则启用该部门的所有上级部门
    if (sysDept.status === STATUS_YES && parentDept.status === STATUS_NO) {
      await this.updateParentDeptStatusNormal(sysDept);
    }
    return await this.sysDeptRepository.updateDept(sysDept);
  }

  async deleteDeptById(deptId: string): Promise<number> {
    return await this.sysDeptRepository.deleteDeptById(deptId);
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
    if (childrens && childrens.length === 0) {
      return;
    }
    // 替换父ID
    childrens = childrens.map(child => {
      child.ancestors = child.ancestors.replace(oldAncestors, newAncestors);
      return child;
    });
    this.sysDeptRepository.updateDeptChildren(childrens);
  }

  /**
   * 修改该部门的父级部门状态
   * @param sysDept 当前部门
   * @return 修改数
   */
  private async updateParentDeptStatusNormal(
    sysDept: SysDept
  ): Promise<number> {
    if (!sysDept.ancestors || sysDept.ancestors === '0') return 0;
    const deptIds: string[] = sysDept.ancestors.split(',');
    return await this.sysDeptRepository.updateDeptStatusNormal(deptIds);
  }
}
