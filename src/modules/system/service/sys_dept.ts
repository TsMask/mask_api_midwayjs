import { Inject, Provide, Singleton } from '@midwayjs/core';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { STATUS_NO, STATUS_YES } from '../../../internal/shared/constants/common';
import { SysRoleDeptRepository } from '../repository/sys_role_dept';
import { SysDeptRepository } from '../repository/sys_dept';
import { SysRoleRepository } from '../repository/sys_role';
import { SysDept } from '../model/sys_dept';
import { TreeSelect, sysDeptTreeSelect } from '../model/vo/tree_select';

/** Department management service. */
@Provide()
@Singleton()
export class SysDeptService {
  @Inject()
  private db: DynamicDataSource;

  @Inject()
  private sysDeptRepository: SysDeptRepository;

  @Inject()
  private sysRoleDeptRepository: SysRoleDeptRepository;

  @Inject()
  private sysRoleRepository: SysRoleRepository;

  public async find(
    sysDept: SysDept,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    return await this.sysDeptRepository.select(sysDept, filter);
  }

  public async findExcludeChildren(
    deptId: number,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    return await this.sysDeptRepository.selectExcludeChildren(deptId, filter);
  }

  public async findById(deptId: number): Promise<SysDept> {
    return await this.sysDeptRepository.selectById(deptId);
  }

  public async insert(sysDept: SysDept): Promise<number> {
    return await this.sysDeptRepository.insert(sysDept);
  }

  public async update(sysDept: SysDept): Promise<number> {
    const dept = await this.sysDeptRepository.selectById(sysDept.id);
    if (dept.id !== sysDept.id) {
      return 0;
    }
    const parentDept = await this.sysDeptRepository.selectById(
      sysDept.parentId
    );
    if (sysDept.parentId > 0 && parentDept.id !== sysDept.parentId) {
      return 0;
    }

    const moved = dept.parentId !== sysDept.parentId;
    return await this.db.transaction('', async manager => {
      if (moved) {
        const moveErr = await this.sysDeptRepository.moveDeptSubtree(
          manager,
          sysDept.id,
          sysDept.parentId
        );
        if (moveErr !== '') {
          throw new Error(moveErr);
        }
      }
      if (
        sysDept.deptStatus === STATUS_YES &&
        parentDept.deptStatus === STATUS_NO
      ) {
        await this.sysDeptRepository.updateDeptStatusNormal(
          sysDept.id,
          manager
        );
      }
      const rows = await this.sysDeptRepository.update(sysDept, manager);
      return moved && rows === 0 ? 1 : rows;
    });
  }

  public async deleteById(deptId: number): Promise<number> {
    return await this.db.transaction('', async manager => {
      await this.sysRoleDeptRepository.deleteByDeptIds([deptId], manager);
      return await this.sysDeptRepository.deleteById(deptId, manager);
    });
  }

  public async findDeptIdsByRoleId(roleId: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([roleId]);
    const role = roles[0];
    if (!role || role.id !== roleId) {
      return [];
    }
    return await this.sysDeptRepository.selectDeptIdsByRoleId(
      role.id,
      role.roleDeptCheckStrictly === '1'
    );
  }

  public async existChildrenByDeptId(deptId: number): Promise<number> {
    return await this.sysDeptRepository.existChildrenByDeptId(deptId);
  }

  public async existUserByDeptId(deptId: number): Promise<number> {
    return await this.sysDeptRepository.existUserByDeptId(deptId);
  }

  public async checkUniqueParentIdByDeptName(
    parentId: number,
    deptName: string,
    deptId: number
  ): Promise<boolean> {
    const sysDept = new SysDept();
    sysDept.deptName = deptName;
    sysDept.parentId = parentId;
    const uniqueId = await this.sysDeptRepository.checkUnique(sysDept);
    return uniqueId === deptId || uniqueId === 0;
  }

  public async buildTreeSelect(
    sysDept: SysDept,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<TreeSelect[]> {
    const rows = await this.sysDeptRepository.select(sysDept, filter);
    return this.parseDataToTree(rows).map(item => sysDeptTreeSelect(item));
  }

  public async selectDescendantIds(deptId: number): Promise<number[]> {
    return await this.sysDeptRepository.selectDescendantIds(deptId);
  }

  private parseDataToTree(rows: SysDept[]): SysDept[] {
    const childrenMap = new Map<number, SysDept[]>();
    const deptIds: number[] = [];
    for (const item of rows) {
      const group = childrenMap.get(item.parentId) ?? [];
      group.push(item);
      childrenMap.set(item.parentId, group);
      deptIds.push(item.id);
    }

    const tree: SysDept[] = [];
    for (const [parentId, children] of childrenMap) {
      if (!deptIds.includes(parentId)) {
        tree.push(...children);
      }
    }
    for (const node of tree) {
      this.fillChildren(node, childrenMap);
    }
    return tree;
  }

  private fillChildren(
    node: SysDept,
    childrenMap: Map<number, SysDept[]>
  ): void {
    const children = childrenMap.get(node.id);
    if (!children) {
      return;
    }
    node.children = children;
    for (const child of children) {
      this.fillChildren(child, childrenMap);
    }
  }
}
