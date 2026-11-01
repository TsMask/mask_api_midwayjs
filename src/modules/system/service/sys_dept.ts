import { Inject, Provide, Singleton } from '@midwayjs/core';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
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
    dept_id: number,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<SysDept[]> {
    return await this.sysDeptRepository.selectExcludeChildren(dept_id, filter);
  }

  public async findById(dept_id: number): Promise<SysDept> {
    return await this.sysDeptRepository.selectById(dept_id);
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
      sysDept.parent_id
    );
    if (sysDept.parent_id > 0 && parentDept.id !== sysDept.parent_id) {
      return 0;
    }

    const moved = dept.parent_id !== sysDept.parent_id;
    return await this.db.transaction('', async manager => {
      if (moved) {
        const moveErr = await this.sysDeptRepository.moveDeptSubtree(
          manager,
          sysDept.id,
          sysDept.parent_id
        );
        if (moveErr !== '') {
          throw new Error(moveErr);
        }
      }
      if (
        sysDept.dept_status === STATUS_YES &&
        parentDept.dept_status === STATUS_NO
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

  public async deleteById(dept_id: number): Promise<number> {
    return await this.db.transaction('', async manager => {
      await this.sysRoleDeptRepository.deleteByDeptIds([dept_id], manager);
      return await this.sysDeptRepository.deleteById(dept_id, manager);
    });
  }

  public async findDeptIdsByRoleId(role_id: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([role_id]);
    const role = roles[0];
    if (!role || role.id !== role_id) {
      return [];
    }
    return await this.sysDeptRepository.selectDeptIdsByRoleId(
      role.id,
      role.role_dept_check_strictly === '1'
    );
  }

  public async existChildrenByDeptId(dept_id: number): Promise<number> {
    return await this.sysDeptRepository.existChildrenByDeptId(dept_id);
  }

  public async existUserByDeptId(dept_id: number): Promise<number> {
    return await this.sysDeptRepository.existUserByDeptId(dept_id);
  }

  public async checkUniqueParentIdByDeptName(
    parent_id: number,
    dept_name: string,
    dept_id: number
  ): Promise<boolean> {
    const sysDept = new SysDept();
    sysDept.dept_name = dept_name;
    sysDept.parent_id = parent_id;
    const uniqueId = await this.sysDeptRepository.checkUnique(sysDept);
    return uniqueId === dept_id || uniqueId === 0;
  }

  public async buildTreeSelect(
    sysDept: SysDept,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<TreeSelect[]> {
    const rows = await this.sysDeptRepository.select(sysDept, filter);
    return this.parseDataToTree(rows).map(item => sysDeptTreeSelect(item));
  }

  public async selectDescendantIds(dept_id: number): Promise<number[]> {
    return await this.sysDeptRepository.selectDescendantIds(dept_id);
  }

  private parseDataToTree(rows: SysDept[]): SysDept[] {
    const childrenMap = new Map<number, SysDept[]>();
    const dept_ids: number[] = [];
    for (const item of rows) {
      const group = childrenMap.get(item.parent_id) ?? [];
      group.push(item);
      childrenMap.set(item.parent_id, group);
      dept_ids.push(item.id);
    }

    const tree: SysDept[] = [];
    for (const [parent_id, children] of childrenMap) {
      if (!dept_ids.includes(parent_id)) {
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
